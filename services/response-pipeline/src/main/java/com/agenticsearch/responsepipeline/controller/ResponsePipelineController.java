/**
 * Response Pipeline Controller - REST endpoints for response pipeline operations
 * 
 * Endpoints:
 * - POST /api/v1/pipeline/bundles - Create look bundles from candidates
 * - POST /api/v1/pipeline/rank - Rank and score look bundles
 * - POST /api/v1/pipeline/explain - Generate explanations for looks
 * - POST /api/v1/pipeline/validate - Validate and approve looks
 * - GET /api/v1/pipeline/health - Health check
 */

package com.agenticsearch.responsepipeline.controller;

import com.agenticsearch.responsepipeline.model.LookBundle;
import com.agenticsearch.responsepipeline.model.RankedLook;
import com.agenticsearch.responsepipeline.model.SearchCandidate;
import com.agenticsearch.responsepipeline.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pipeline")
@CrossOrigin(origins = "*")
public class ResponsePipelineController {
    
    private static final Logger logger = LoggerFactory.getLogger(ResponsePipelineController.class);
    
    private final WeaveComposerService weaveComposerService;
    private final JudgeRankerService judgeRankerService;
    private final SageExplainerService sageExplainerService;
    private final AegisGuardianService aegisGuardianService;
    
    @Autowired
    public ResponsePipelineController(WeaveComposerService weaveComposerService,
                                    JudgeRankerService judgeRankerService,
                                    SageExplainerService sageExplainerService,
                                    AegisGuardianService aegisGuardianService) {
        this.weaveComposerService = weaveComposerService;
        this.judgeRankerService = judgeRankerService;
        this.sageExplainerService = sageExplainerService;
        this.aegisGuardianService = aegisGuardianService;
    }
    
    /**
     * Create look bundles from search candidates
     */
    @PostMapping("/bundles")
    public Mono<ResponseEntity<BundleResponse>> createBundles(@RequestBody BundleRequest request) {
        logger.info("Creating bundles from {} candidates", 
            request.getSearchCandidates() != null ? request.getSearchCandidates().size() : 0);
        
        List<String> styleThemes = request.getStyleThemes() != null ? 
            request.getStyleThemes() : List.of("casual", "formal", "mixed");
        int maxBundles = request.getMaxBundles() != null ? request.getMaxBundles() : 5;
        
        return weaveComposerService.createBundles(request.getSearchCandidates(), styleThemes, maxBundles)
            .map(bundles -> {
                BundleResponse response = new BundleResponse(
                    "Bundles created successfully",
                    bundles,
                    bundles.size()
                );
                return ResponseEntity.ok(response);
            })
            .onErrorResume(error -> {
                logger.error("Bundle creation failed: {}", error.getMessage());
                BundleResponse errorResponse = new BundleResponse(
                    "Bundle creation failed: " + error.getMessage(),
                    null,
                    0
                );
                return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
            });
    }
    
    /**
     * Rank look bundles
     */
    @PostMapping("/rank")
    public Mono<ResponseEntity<RankResponse>> rankBundles(@RequestBody RankRequest request) {
        logger.info("Ranking {} bundles", 
            request.getBundles() != null ? request.getBundles().size() : 0);
        
        Map<String, Object> userPreferences = request.getUserPreferences() != null ? 
            request.getUserPreferences() : new HashMap<>();
        int maxResults = request.getMaxResults() != null ? request.getMaxResults() : 5;
        
        return judgeRankerService.rankBundles(request.getBundles(), userPreferences, maxResults)
            .map(rankedLooks -> {
                RankResponse response = new RankResponse(
                    "Bundles ranked successfully",
                    rankedLooks,
                    rankedLooks.size()
                );
                return ResponseEntity.ok(response);
            })
            .onErrorResume(error -> {
                logger.error("Bundle ranking failed: {}", error.getMessage());
                RankResponse errorResponse = new RankResponse(
                    "Bundle ranking failed: " + error.getMessage(),
                    null,
                    0
                );
                return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
            });
    }
    
    /**
     * Generate explanations for ranked looks
     */
    @PostMapping("/explain")
    public Mono<ResponseEntity<ExplainResponse>> explainLooks(@RequestBody ExplainRequest request) {
        logger.info("Generating explanations for {} ranked looks", 
            request.getRankedLooks() != null ? request.getRankedLooks().size() : 0);
        
        String userQuery = request.getUserQuery() != null ? request.getUserQuery() : "";
        
        return sageExplainerService.generateExplanations(request.getRankedLooks(), userQuery)
            .map(explainedLooks -> {
                ExplainResponse response = new ExplainResponse(
                    "Explanations generated successfully",
                    explainedLooks,
                    explainedLooks.size()
                );
                return ResponseEntity.ok(response);
            })
            .onErrorResume(error -> {
                logger.error("Explanation generation failed: {}", error.getMessage());
                ExplainResponse errorResponse = new ExplainResponse(
                    "Explanation generation failed: " + error.getMessage(),
                    null,
                    0
                );
                return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
            });
    }
    
    /**
     * Validate and approve ranked looks
     */
    @PostMapping("/validate")
    public Mono<ResponseEntity<ValidationResponse>> validateLooks(@RequestBody ValidationRequest request) {
        logger.info("Validating {} ranked looks", 
            request.getRankedLooks() != null ? request.getRankedLooks().size() : 0);
        
        Map<String, Object> userContext = request.getUserContext() != null ? 
            request.getUserContext() : new HashMap<>();
        
        return aegisGuardianService.validateAndApprove(request.getRankedLooks(), userContext)
            .map(approvedLooks -> {
                ValidationResponse response = new ValidationResponse(
                    "Validation completed successfully",
                    approvedLooks,
                    approvedLooks.size(),
                    request.getRankedLooks().size() - approvedLooks.size()
                );
                return ResponseEntity.ok(response);
            })
            .onErrorResume(error -> {
                logger.error("Look validation failed: {}", error.getMessage());
                ValidationResponse errorResponse = new ValidationResponse(
                    "Look validation failed: " + error.getMessage(),
                    null,
                    0,
                    0
                );
                return Mono.just(ResponseEntity.internalServerError().body(errorResponse));
            });
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public Mono<ResponseEntity<HealthResponse>> health() {
        HealthResponse response = new HealthResponse();
        response.setStatus("healthy");
        response.setTimestamp(System.currentTimeMillis());
        response.setService("response-pipeline");
        response.setVersion("1.0.0");
        response.setComponents(Map.of(
            "weave-composer", "healthy",
            "judge-ranker", "healthy", 
            "sage-explainer", "healthy",
            "aegis-guardian", "healthy"
        ));
        
        return Mono.just(ResponseEntity.ok(response));
    }
    
    /**
     * Service status endpoint
     */
    @GetMapping("/status")
    public Mono<ResponseEntity<ServiceStatus>> getStatus() {
        ServiceStatus status = new ServiceStatus();
        status.setServiceName("Response Pipeline");
        status.setStatus("ready");
        status.setDescription("Bundle creation, ranking, explanation, and validation services");
        status.setCapabilities(List.of(
            "Look bundle creation",
            "Bundle ranking and scoring",
            "Explanation generation",
            "Content validation and approval",
            "Safety and inclusivity checks"
        ));
        
        return Mono.just(ResponseEntity.ok(status));
    }
    
    // Request/Response model classes
    
    public static class BundleRequest {
        private List<SearchCandidate> searchCandidates;
        private List<String> styleThemes;
        private Integer maxBundles;
        
        // Constructors
        public BundleRequest() {}
        
        public BundleRequest(List<SearchCandidate> searchCandidates, List<String> styleThemes, Integer maxBundles) {
            this.searchCandidates = searchCandidates;
            this.styleThemes = styleThemes;
            this.maxBundles = maxBundles;
        }
        
        // Getters and Setters
        public List<SearchCandidate> getSearchCandidates() { return searchCandidates; }
        public void setSearchCandidates(List<SearchCandidate> searchCandidates) { this.searchCandidates = searchCandidates; }
        
        public List<String> getStyleThemes() { return styleThemes; }
        public void setStyleThemes(List<String> styleThemes) { this.styleThemes = styleThemes; }
        
        public Integer getMaxBundles() { return maxBundles; }
        public void setMaxBundles(Integer maxBundles) { this.maxBundles = maxBundles; }
    }
    
    public static class BundleResponse {
        private String message;
        private List<LookBundle> bundles;
        private int count;
        
        // Constructors
        public BundleResponse() {}
        
        public BundleResponse(String message, List<LookBundle> bundles, int count) {
            this.message = message;
            this.bundles = bundles;
            this.count = count;
        }
        
        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public List<LookBundle> getBundles() { return bundles; }
        public void setBundles(List<LookBundle> bundles) { this.bundles = bundles; }
        
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
    }
    
    public static class RankRequest {
        private List<LookBundle> bundles;
        private Map<String, Object> userPreferences;
        private Integer maxResults;
        
        // Constructors
        public RankRequest() {}
        
        // Getters and Setters
        public List<LookBundle> getBundles() { return bundles; }
        public void setBundles(List<LookBundle> bundles) { this.bundles = bundles; }
        
        public Map<String, Object> getUserPreferences() { return userPreferences; }
        public void setUserPreferences(Map<String, Object> userPreferences) { this.userPreferences = userPreferences; }
        
        public Integer getMaxResults() { return maxResults; }
        public void setMaxResults(Integer maxResults) { this.maxResults = maxResults; }
    }
    
    public static class RankResponse {
        private String message;
        private List<RankedLook> rankedLooks;
        private int count;
        
        // Constructors
        public RankResponse() {}
        
        public RankResponse(String message, List<RankedLook> rankedLooks, int count) {
            this.message = message;
            this.rankedLooks = rankedLooks;
            this.count = count;
        }
        
        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public List<RankedLook> getRankedLooks() { return rankedLooks; }
        public void setRankedLooks(List<RankedLook> rankedLooks) { this.rankedLooks = rankedLooks; }
        
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
    }
    
    public static class ExplainRequest {
        private List<RankedLook> rankedLooks;
        private String userQuery;
        
        // Constructors
        public ExplainRequest() {}
        
        // Getters and Setters
        public List<RankedLook> getRankedLooks() { return rankedLooks; }
        public void setRankedLooks(List<RankedLook> rankedLooks) { this.rankedLooks = rankedLooks; }
        
        public String getUserQuery() { return userQuery; }
        public void setUserQuery(String userQuery) { this.userQuery = userQuery; }
    }
    
    public static class ExplainResponse {
        private String message;
        private List<RankedLook> explainedLooks;
        private int count;
        
        // Constructors
        public ExplainResponse() {}
        
        public ExplainResponse(String message, List<RankedLook> explainedLooks, int count) {
            this.message = message;
            this.explainedLooks = explainedLooks;
            this.count = count;
        }
        
        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public List<RankedLook> getExplainedLooks() { return explainedLooks; }
        public void setExplainedLooks(List<RankedLook> explainedLooks) { this.explainedLooks = explainedLooks; }
        
        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }
    }
    
    public static class ValidationRequest {
        private List<RankedLook> rankedLooks;
        private Map<String, Object> userContext;
        
        // Constructors
        public ValidationRequest() {}
        
        // Getters and Setters
        public List<RankedLook> getRankedLooks() { return rankedLooks; }
        public void setRankedLooks(List<RankedLook> rankedLooks) { this.rankedLooks = rankedLooks; }
        
        public Map<String, Object> getUserContext() { return userContext; }
        public void setUserContext(Map<String, Object> userContext) { this.userContext = userContext; }
    }
    
    public static class ValidationResponse {
        private String message;
        private List<RankedLook> approvedLooks;
        private int approvedCount;
        private int rejectedCount;
        
        // Constructors
        public ValidationResponse() {}
        
        public ValidationResponse(String message, List<RankedLook> approvedLooks, int approvedCount, int rejectedCount) {
            this.message = message;
            this.approvedLooks = approvedLooks;
            this.approvedCount = approvedCount;
            this.rejectedCount = rejectedCount;
        }
        
        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public List<RankedLook> getApprovedLooks() { return approvedLooks; }
        public void setApprovedLooks(List<RankedLook> approvedLooks) { this.approvedLooks = approvedLooks; }
        
        public int getApprovedCount() { return approvedCount; }
        public void setApprovedCount(int approvedCount) { this.approvedCount = approvedCount; }
        
        public int getRejectedCount() { return rejectedCount; }
        public void setRejectedCount(int rejectedCount) { this.rejectedCount = rejectedCount; }
    }
    
    public static class HealthResponse {
        private String status;
        private long timestamp;
        private String service;
        private String version;
        private Map<String, String> components;
        
        // Constructors
        public HealthResponse() {}
        
        // Getters and Setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
        
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
        
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        
        public Map<String, String> getComponents() { return components; }
        public void setComponents(Map<String, String> components) { this.components = components; }
    }
    
    public static class ServiceStatus {
        private String serviceName;
        private String status;
        private String description;
        private List<String> capabilities;
        
        // Constructors
        public ServiceStatus() {}
        
        // Getters and Setters
        public String getServiceName() { return serviceName; }
        public void setServiceName(String serviceName) { this.serviceName = serviceName; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public List<String> getCapabilities() { return capabilities; }
        public void setCapabilities(List<String> capabilities) { this.capabilities = capabilities; }
    }
}

