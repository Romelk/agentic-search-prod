/**
 * Aegis Guardian Service - Safety and Content Policy Validation Agent
 * 
 * Responsibilities:
 * - Validate safety, inclusivity, and content policy compliance
 * - Check for inappropriate content or recommendations
 * - Ensure cultural sensitivity and inclusive language
 * - Validate business rules and constraints
 */

package com.agenticsearch.responsepipeline.service;

import com.agenticsearch.responsepipeline.model.RankedLook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AegisGuardianService {
    
    private static final Logger logger = LoggerFactory.getLogger(AegisGuardianService.class);
    
    // Content policy violations
    private static final Set<String> INAPPROPRIATE_TERMS = Set.of(
        "inappropriate", "offensive", "controversial", "explicit"
    );
    
    // Inclusive language patterns
    private static final Set<String> INCLUSIVE_TERMS = Set.of(
        "inclusive", "diverse", "accessible", "universal", "versatile"
    );
    
    // Safety guidelines
    private static final double MIN_SAFETY_SCORE = 0.7;
    private static final double MIN_INCLUSIVITY_SCORE = 0.6;
    
    /**
     * Validate and approve ranked looks for safety and policy compliance
     * @param rankedLooks List of ranked looks to validate
     * @param userContext User context and preferences
     * @return Mono<List<RankedLook>> - List of approved looks
     */
    public Mono<List<RankedLook>> validateAndApprove(List<RankedLook> rankedLooks, 
                                                   Map<String, Object> userContext) {
        logger.info("Validating {} ranked looks for safety and policy compliance", rankedLooks.size());
        
        return Mono.fromCallable(() -> {
            List<RankedLook> approvedLooks = new ArrayList<>();
            List<String> validationWarnings = new ArrayList<>();
            
            for (RankedLook rankedLook : rankedLooks) {
                ValidationResult validation = validateSingleLook(rankedLook, userContext);
                
                if (validation.isApproved()) {
                    approvedLooks.add(rankedLook);
                    logger.debug("Approved look: {}", rankedLook.getLook().getBundleId());
                } else {
                    logger.warn("Rejected look {}: {}", 
                        rankedLook.getLook().getBundleId(), 
                        validation.getRejectionReason());
                }
                
                if (!validation.getWarnings().isEmpty()) {
                    validationWarnings.addAll(validation.getWarnings());
                }
            }
            
            if (!validationWarnings.isEmpty()) {
                logger.info("Validation warnings: {}", validationWarnings);
            }
            
            logger.info("Approved {} out of {} looks after validation", 
                approvedLooks.size(), rankedLooks.size());
            
            return approvedLooks;
        });
    }
    
    /**
     * Validate a single ranked look
     */
    private ValidationResult validateSingleLook(RankedLook rankedLook, Map<String, Object> userContext) {
        List<String> warnings = new ArrayList<>();
        List<String> rejectionReasons = new ArrayList<>();
        
        // Content safety validation
        ContentSafetyResult contentSafety = validateContentSafety(rankedLook);
        if (!contentSafety.isSafe()) {
            rejectionReasons.addAll(contentSafety.getIssues());
        }
        warnings.addAll(contentSafety.getWarnings());
        
        // Inclusivity validation
        InclusivityResult inclusivity = validateInclusivity(rankedLook);
        if (!inclusivity.isInclusive()) {
            rejectionReasons.addAll(inclusivity.getIssues());
        }
        warnings.addAll(inclusivity.getWarnings());
        
        // Business rules validation
        BusinessRulesResult businessRules = validateBusinessRules(rankedLook);
        if (!businessRules.isCompliant()) {
            rejectionReasons.addAll(businessRules.getIssues());
        }
        warnings.addAll(businessRules.getWarnings());
        
        // User safety validation
        UserSafetyResult userSafety = validateUserSafety(rankedLook, userContext);
        if (!userSafety.isSafe()) {
            rejectionReasons.addAll(userSafety.getIssues());
        }
        warnings.addAll(userSafety.getWarnings());
        
        boolean isApproved = rejectionReasons.isEmpty();
        
        return new ValidationResult(isApproved, warnings, rejectionReasons);
    }
    
    /**
     * Validate content safety
     */
    private ContentSafetyResult validateContentSafety(RankedLook rankedLook) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        var look = rankedLook.getLook();
        
        // Check product names and descriptions
        for (var item : look.getItems()) {
            String name = item.getProduct().getName().toLowerCase();
            String description = item.getProduct().getDescription().toLowerCase();
            
            // Check for inappropriate terms
            for (String term : INAPPROPRIATE_TERMS) {
                if (name.contains(term) || description.contains(term)) {
                    issues.add(String.format("Inappropriate content detected in product: %s", 
                        item.getProduct().getName()));
                }
            }
            
            // Check for potentially problematic categories
            if (isProblematicCategory(item.getProduct().getCategory())) {
                warnings.add(String.format("Sensitive category detected: %s", 
                    item.getProduct().getCategory()));
            }
        }
        
        // Check bundle description
        String bundleDescription = look.getDescription().toLowerCase();
        for (String term : INAPPROPRIATE_TERMS) {
            if (bundleDescription.contains(term)) {
                issues.add("Inappropriate content in bundle description");
                break;
            }
        }
        
        return new ContentSafetyResult(issues.isEmpty(), issues, warnings);
    }
    
    /**
     * Validate inclusivity
     */
    private InclusivityResult validateInclusivity(RankedLook rankedLook) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        var look = rankedLook.getLook();
        
        // Check for gender inclusivity
        if (!isGenderInclusive(look)) {
            warnings.add("Look may not be suitable for all genders");
        }
        
        // Check for size inclusivity
        if (!isSizeInclusive(look)) {
            warnings.add("Limited size availability may affect inclusivity");
        }
        
        // Check for price inclusivity
        if (!isPriceInclusive(look)) {
            warnings.add("High price point may limit accessibility");
        }
        
        // Check for cultural sensitivity
        if (!isCulturallySensitive(look)) {
            issues.add("Cultural sensitivity concerns detected");
        }
        
        return new InclusivityResult(issues.isEmpty(), issues, warnings);
    }
    
    /**
     * Validate business rules
     */
    private BusinessRulesResult validateBusinessRules(RankedLook rankedLook) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        var look = rankedLook.getLook();
        
        // Check minimum item count
        if (look.getItems().size() < 2) {
            issues.add("Bundle must contain at least 2 items");
        }
        
        // Check maximum item count
        if (look.getItems().size() > 10) {
            issues.add("Bundle exceeds maximum item limit (10 items)");
        }
        
        // Check price limits
        if (look.getTotalPrice() > 10000) {
            issues.add("Bundle exceeds maximum price limit ($10,000)");
        }
        
        // Check stock availability
        boolean hasOutOfStockItems = look.getItems().stream()
            .anyMatch(item -> "out_of_stock".equalsIgnoreCase(item.getProduct().getStockStatus()));
        
        if (hasOutOfStockItems) {
            issues.add("Bundle contains out-of-stock items");
        }
        
        // Check for duplicate items
        Set<String> skus = look.getItems().stream()
            .map(item -> item.getProduct().getSku())
            .collect(Collectors.toSet());
        
        if (skus.size() != look.getItems().size()) {
            issues.add("Bundle contains duplicate items");
        }
        
        return new BusinessRulesResult(issues.isEmpty(), issues, warnings);
    }
    
    /**
     * Validate user safety
     */
    private UserSafetyResult validateUserSafety(RankedLook rankedLook, Map<String, Object> userContext) {
        List<String> issues = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        
        var look = rankedLook.getLook();
        
        // Check budget compliance
        Double userMaxBudget = (Double) userContext.get("max_budget");
        if (userMaxBudget != null && look.getTotalPrice() > userMaxBudget * 1.1) {
            issues.add("Bundle exceeds user budget by more than 10%");
        }
        
        // Check preference alignment
        String userPreferredStyle = (String) userContext.getOrDefault("preferred_style", "");
        if (!userPreferredStyle.isEmpty() && 
            !look.getStyleTheme().toLowerCase().contains(userPreferredStyle.toLowerCase())) {
            warnings.add("Bundle may not align with user's preferred style");
        }
        
        // Check age appropriateness
        String userAgeGroup = (String) userContext.getOrDefault("age_group", "");
        if (!isAgeAppropriate(look, userAgeGroup)) {
            warnings.add("Bundle may not be age-appropriate for user");
        }
        
        return new UserSafetyResult(issues.isEmpty(), issues, warnings);
    }
    
    // Helper methods for validation checks
    
    private boolean isProblematicCategory(String category) {
        Set<String> sensitiveCategories = Set.of(
            "adult", "mature", "controversial", "political", "religious"
        );
        return sensitiveCategories.contains(category.toLowerCase());
    }
    
    private boolean isGenderInclusive(LookBundle look) {
        // Check if look works for multiple genders or is gender-neutral
        long uniqueGenders = look.getItems().stream()
            .map(item -> item.getProduct().getGender())
            .filter(gender -> gender != null && !gender.isEmpty())
            .distinct()
            .count();
        
        // Consider it inclusive if it has multiple genders or is unisex
        return uniqueGenders > 1 || look.getItems().stream()
            .anyMatch(item -> "unisex".equalsIgnoreCase(item.getProduct().getGender()));
    }
    
    private boolean isSizeInclusive(LookBundle look) {
        // Check if look has reasonable size range
        List<String> sizes = look.getItems().stream()
            .map(item -> item.getProduct().getSize())
            .filter(size -> size != null && !size.isEmpty())
            .distinct()
            .toList();
        
        // Consider it inclusive if it has multiple size options
        return sizes.size() >= 2;
    }
    
    private boolean isPriceInclusive(LookBundle look) {
        // Consider it inclusive if total price is reasonable
        return look.getTotalPrice() <= 500; // Adjust threshold as needed
    }
    
    private boolean isCulturallySensitive(LookBundle look) {
        // Check for culturally sensitive terms or patterns
        for (var item : look.getItems()) {
            String name = item.getProduct().getName().toLowerCase();
            String description = item.getProduct().getDescription().toLowerCase();
            
            // Add cultural sensitivity checks here
            // This is a simplified implementation
            if (name.contains("cultural") || description.contains("cultural")) {
                return false;
            }
        }
        return true;
    }
    
    private boolean isAgeAppropriate(LookBundle look, String ageGroup) {
        // Check if look is appropriate for the user's age group
        String styleTheme = look.getStyleTheme().toLowerCase();
        
        return switch (ageGroup.toLowerCase()) {
            case "teen", "young" -> !styleTheme.contains("adult") && !styleTheme.contains("mature");
            case "adult", "mature" -> true; // Adults can wear anything appropriate
            case "senior", "elderly" -> !styleTheme.contains("teen") && !styleTheme.contains("young");
            default -> true; // Default to appropriate if age group unknown
        };
    }
    
    // Result classes for validation
    private static class ValidationResult {
        private final boolean approved;
        private final List<String> warnings;
        private final List<String> rejectionReasons;
        
        public ValidationResult(boolean approved, List<String> warnings, List<String> rejectionReasons) {
            this.approved = approved;
            this.warnings = warnings;
            this.rejectionReasons = rejectionReasons;
        }
        
        public boolean isApproved() { return approved; }
        public List<String> getWarnings() { return warnings; }
        public List<String> getRejectionReason() { return rejectionReasons; }
    }
    
    private static class ContentSafetyResult {
        private final boolean safe;
        private final List<String> issues;
        private final List<String> warnings;
        
        public ContentSafetyResult(boolean safe, List<String> issues, List<String> warnings) {
            this.safe = safe;
            this.issues = issues;
            this.warnings = warnings;
        }
        
        public boolean isSafe() { return safe; }
        public List<String> getIssues() { return issues; }
        public List<String> getWarnings() { return warnings; }
    }
    
    private static class InclusivityResult {
        private final boolean inclusive;
        private final List<String> issues;
        private final List<String> warnings;
        
        public InclusivityResult(boolean inclusive, List<String> issues, List<String> warnings) {
            this.inclusive = inclusive;
            this.issues = issues;
            this.warnings = warnings;
        }
        
        public boolean isInclusive() { return inclusive; }
        public List<String> getIssues() { return issues; }
        public List<String> getWarnings() { return warnings; }
    }
    
    private static class BusinessRulesResult {
        private final boolean compliant;
        private final List<String> issues;
        private final List<String> warnings;
        
        public BusinessRulesResult(boolean compliant, List<String> issues, List<String> warnings) {
            this.compliant = compliant;
            this.issues = issues;
            this.warnings = warnings;
        }
        
        public boolean isCompliant() { return compliant; }
        public List<String> getIssues() { return issues; }
        public List<String> getWarnings() { return warnings; }
    }
    
    private static class UserSafetyResult {
        private final boolean safe;
        private final List<String> issues;
        private final List<String> warnings;
        
        public UserSafetyResult(boolean safe, List<String> issues, List<String> warnings) {
            this.safe = safe;
            this.issues = issues;
            this.warnings = warnings;
        }
        
        public boolean isSafe() { return safe; }
        public List<String> getIssues() { return issues; }
        public List<String> getWarnings() { return warnings; }
    }
}

