/**
 * Cost Guard - Production-grade cost control for Vertex AI calls
 * 
 * Features:
 * - Circuit breaker pattern for cost overruns
 * - Per-request cost estimation and tracking
 * - Kill-switch enforcement
 * - Metrics export to Cloud Monitoring
 */

package com.agenticsearch.vectorsearch.config;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class CostGuard {
    
    private static final Logger logger = LoggerFactory.getLogger(CostGuard.class);
    
    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final CircuitBreaker circuitBreaker;
    
    @Value("${cost.daily-budget-usd:8.0}")
    private double dailyBudgetUSD;
    
    @Value("${cost.kill-switch:true}")
    private boolean killSwitchEnabled;
    
    @Value("${cost.max-query-cost-usd:0.50}")
    private double maxQueryCostUSD;
    
    private final AtomicLong dailyQueryCount = new AtomicLong(0);
    private final AtomicLong totalCostUSD = new AtomicLong(0); // Store as cents to avoid floating point issues
    
    public CostGuard(ReactiveRedisTemplate<String, String> redisTemplate, 
                    CircuitBreaker circuitBreaker) {
        this.redisTemplate = redisTemplate;
        this.circuitBreaker = circuitBreaker;
    }
    
    /**
     * Check if a request can proceed based on cost controls
     * @param estimatedCostUSD Estimated cost of the operation in USD
     * @return Mono<Boolean> - true if request can proceed, false if blocked
     */
    public Mono<Boolean> canProceed(double estimatedCostUSD) {
        return Mono.fromCallable(() -> {
            // Check 1: Kill-switch
            if (killSwitchEnabled) {
                logger.warn("Request blocked: Kill-switch is enabled");
                return false;
            }
            
            // Check 2: Per-query cost limit
            if (estimatedCostUSD > maxQueryCostUSD) {
                logger.warn("Request blocked: Estimated cost ${} exceeds limit of ${}", 
                    estimatedCostUSD, maxQueryCostUSD);
                return false;
            }
            
            // Check 3: Circuit breaker
            if (circuitBreaker.getState() != CircuitBreaker.State.CLOSED) {
                logger.warn("Request blocked: Circuit breaker is {}", circuitBreaker.getState());
                return false;
            }
            
            return true;
        }).flatMap(canProceed -> {
            if (!canProceed) {
                return Mono.just(false);
            }
            
            // Check 4: Daily budget from Redis
            return checkDailyBudget(estimatedCostUSD);
        });
    }
    
    /**
     * Check daily budget from Redis
     */
    private Mono<Boolean> checkDailyBudget(double estimatedCostUSD) {
        String dateKey = getDateKey();
        String costKey = "cost:vector-search:" + dateKey;
        String queryKey = "queries:vector-search:" + dateKey;
        
        return redisTemplate.opsForValue().get(costKey)
            .defaultIfEmpty("0")
            .flatMap(currentSpendStr -> {
                try {
                    double currentSpend = Double.parseDouble(currentSpendStr);
                    double projectedSpend = currentSpend + estimatedCostUSD;
                    
                    if (projectedSpend > dailyBudgetUSD) {
                        logger.warn("Request blocked: Daily budget of ${} would be exceeded. Current: ${}, Projected: ${}", 
                            dailyBudgetUSD, currentSpend, projectedSpend);
                        return Mono.just(false);
                    }
                    
                    return Mono.just(true);
                } catch (NumberFormatException e) {
                    logger.error("Failed to parse current spend: {}", currentSpendStr);
                    return Mono.just(false);
                }
            });
    }
    
    /**
     * Record actual cost after operation completes
     * @param actualCostUSD Actual cost incurred in USD
     */
    public Mono<Void> recordCost(double actualCostUSD) {
        String dateKey = getDateKey();
        String costKey = "cost:vector-search:" + dateKey;
        String queryKey = "queries:vector-search:" + dateKey;
        
        return redisTemplate.opsForValue().increment(costKey, actualCostUSD)
            .flatMap(newSpend -> {
                // Increment query count
                return redisTemplate.opsForValue().increment(queryKey, 1);
            })
            .flatMap(queryCount -> {
                // Set expiration for both keys (24 hours)
                return redisTemplate.expire(costKey, Duration.ofHours(24))
                    .then(redisTemplate.expire(queryKey, Duration.ofHours(24)));
            })
            .doOnSuccess(unused -> {
                dailyQueryCount.incrementAndGet();
                totalCostUSD.addAndGet((long) (actualCostUSD * 100)); // Store as cents
                
                logger.info("Recorded ${} cost. Total queries today: {}, Total cost: ${}", 
                    actualCostUSD, dailyQueryCount.get(), totalCostUSD.get() / 100.0);
            })
            .doOnError(error -> {
                logger.error("Failed to record cost in Redis: {}", error.getMessage());
            })
            .then();
    }
    
    /**
     * Get current daily spend
     */
    public Mono<Double> getDailySpend() {
        String dateKey = getDateKey();
        String costKey = "cost:vector-search:" + dateKey;
        
        return redisTemplate.opsForValue().get(costKey)
            .defaultIfEmpty("0")
            .map(Double::parseDouble);
    }
    
    /**
     * Get daily query count
     */
    public Mono<Long> getDailyQueryCount() {
        String dateKey = getDateKey();
        String queryKey = "queries:vector-search:" + dateKey;
        
        return redisTemplate.opsForValue().get(queryKey)
            .defaultIfEmpty("0")
            .map(Long::parseLong);
    }
    
    /**
     * Get cost metrics for monitoring
     */
    public Mono<CostMetrics> getMetrics() {
        return getDailySpend()
            .zipWith(getDailyQueryCount())
            .map(tuple -> {
                double dailySpend = tuple.getT1();
                long queryCount = tuple.getT2();
                
                return CostMetrics.builder()
                    .serviceName("vector-search")
                    .dailySpend(dailySpend)
                    .dailyBudget(dailyBudgetUSD)
                    .remainingBudget(Math.max(0, dailyBudgetUSD - dailySpend))
                    .queryCount(queryCount)
                    .killSwitchActive(killSwitchEnabled)
                    .circuitBreakerState(circuitBreaker.getState().toString())
                    .build();
            });
    }
    
    /**
     * Reset daily counters (usually called automatically by Redis TTL)
     */
    public Mono<Void> resetDaily() {
        String dateKey = getDateKey();
        String costKey = "cost:vector-search:" + dateKey;
        String queryKey = "queries:vector-search:" + dateKey;
        
        return redisTemplate.delete(costKey)
            .then(redisTemplate.delete(queryKey))
            .doOnSuccess(unused -> {
                logger.info("Daily counters reset for vector-search service");
                dailyQueryCount.set(0);
                totalCostUSD.set(0);
            })
            .then();
    }
    
    /**
     * Get date key for Redis (YYYY-MM-DD)
     */
    private String getDateKey() {
        return LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
    
    /**
     * Estimate cost for Vertex AI Matching Engine query
     */
    public double estimateQueryCost(int numQueries) {
        // Vertex AI Matching Engine pricing: ~$0.50 per 1000 queries
        return (numQueries * 0.50) / 1000.0;
    }
    
    /**
     * Cost metrics data class
     */
    public static class CostMetrics {
        private final String serviceName;
        private final double dailySpend;
        private final double dailyBudget;
        private final double remainingBudget;
        private final long queryCount;
        private final boolean killSwitchActive;
        private final String circuitBreakerState;
        
        private CostMetrics(Builder builder) {
            this.serviceName = builder.serviceName;
            this.dailySpend = builder.dailySpend;
            this.dailyBudget = builder.dailyBudget;
            this.remainingBudget = builder.remainingBudget;
            this.queryCount = builder.queryCount;
            this.killSwitchActive = builder.killSwitchActive;
            this.circuitBreakerState = builder.circuitBreakerState;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        // Getters
        public String getServiceName() { return serviceName; }
        public double getDailySpend() { return dailySpend; }
        public double getDailyBudget() { return dailyBudget; }
        public double getRemainingBudget() { return remainingBudget; }
        public long getQueryCount() { return queryCount; }
        public boolean isKillSwitchActive() { return killSwitchActive; }
        public String getCircuitBreakerState() { return circuitBreakerState; }
        
        public static class Builder {
            private String serviceName;
            private double dailySpend;
            private double dailyBudget;
            private double remainingBudget;
            private long queryCount;
            private boolean killSwitchActive;
            private String circuitBreakerState;
            
            public Builder serviceName(String serviceName) {
                this.serviceName = serviceName;
                return this;
            }
            
            public Builder dailySpend(double dailySpend) {
                this.dailySpend = dailySpend;
                return this;
            }
            
            public Builder dailyBudget(double dailyBudget) {
                this.dailyBudget = dailyBudget;
                return this;
            }
            
            public Builder remainingBudget(double remainingBudget) {
                this.remainingBudget = remainingBudget;
                return this;
            }
            
            public Builder queryCount(long queryCount) {
                this.queryCount = queryCount;
                return this;
            }
            
            public Builder killSwitchActive(boolean killSwitchActive) {
                this.killSwitchActive = killSwitchActive;
                return this;
            }
            
            public Builder circuitBreakerState(String circuitBreakerState) {
                this.circuitBreakerState = circuitBreakerState;
                return this;
            }
            
            public CostMetrics build() {
                return new CostMetrics(this);
            }
        }
    }
}

