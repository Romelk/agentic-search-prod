# ✅ Cloud Migration Quick Checklist

Use this checklist during your migration to track progress.

## Pre-Migration

- [ ] New GCP project created
- [ ] Billing account linked to new project
- [ ] GCP authentication configured (`gcloud auth login`)
- [ ] Application Default Credentials set (`gcloud auth application-default login`)
- [ ] New project ID and region noted

## Configuration Updates

- [ ] `docker-compose.yml` - Updated project ID
- [ ] `frontend/cloudbuild.yaml` - Updated project ID and URLs
- [ ] `services/query-processor/cloudbuild.yaml` - Updated project ID
- [ ] `infrastructure/create-matching-engine.js` - Updated project ID and bucket
- [ ] `infrastructure/generate-embeddings.js` - Updated project ID and bucket
- [ ] `infrastructure/generate-mock-embeddings.js` - Updated bucket
- [ ] `infrastructure/index-metadata.json` - Updated bucket path
- [ ] `scripts/delete-matching-engine.sh` - Updated project ID
- [ ] `scripts/stop-vertex-ai.sh` - Updated project ID
- [ ] `services/vector-search/src/main/resources/application.yml` - Updated project ID
- [ ] `services/vector-search/src/main/resources/application-local.yml` - Updated project ID
- [ ] `services/query-processor/src/server.ts` - Updated project ID
- [ ] `README.md` - Updated project ID references

## GCP Setup

- [ ] APIs enabled (aiplatform, run, cloudbuild, etc.)
- [ ] Cloud Storage bucket created
- [ ] Service account created (optional)
- [ ] Permissions configured

## Docker Images

- [ ] Frontend image built and pushed
- [ ] Query Processor image built and pushed
- [ ] Simple Orchestrator image built and pushed
- [ ] Full Orchestrator image built and pushed (if needed)
- [ ] Vector Search image built and pushed (if needed)
- [ ] Response Pipeline image built and pushed (if needed)

## Cloud Run Deployment

- [ ] Query Processor deployed
- [ ] Simple Orchestrator deployed
- [ ] Frontend deployed
- [ ] Service URLs collected and verified
- [ ] Service-to-service URLs configured
- [ ] Environment variables set correctly

## Vertex AI Matching Engine (Optional)

- [ ] Embeddings generated
- [ ] Data uploaded to Cloud Storage
- [ ] Index created
- [ ] Index endpoint created
- [ ] Index deployed to endpoint
- [ ] Vector Search service configured with endpoint/index IDs

## Verification

- [ ] All services show as "Ready" in Cloud Run console
- [ ] Health checks passing (`/health` endpoints)
- [ ] Frontend loads correctly
- [ ] API search endpoint responds
- [ ] Vertex AI API calls working
- [ ] Logs show no critical errors
- [ ] Service-to-service communication working

## Post-Migration

- [ ] Billing alerts configured
- [ ] Monitoring set up
- [ ] Documentation updated with new URLs
- [ ] Team notified of new service URLs
- [ ] Old project resources reviewed (optional cleanup)

## Quick Test Commands

```bash
# Set your new project
export NEW_PROJECT_ID="your-new-project-id"
export NEW_REGION="us-central1"

# Get service URLs
FRONTEND_URL=$(gcloud run services describe frontend \
  --platform managed --region $NEW_REGION --project $NEW_PROJECT_ID \
  --format="value(status.url)")

ORCHESTRATOR_URL=$(gcloud run services describe simple-orchestrator \
  --platform managed --region $NEW_REGION --project $NEW_PROJECT_ID \
  --format="value(status.url)")

# Test health
curl $ORCHESTRATOR_URL/health

# Test search
curl -X POST $ORCHESTRATOR_URL/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress", "maxResults": 10}'

# Open frontend
open $FRONTEND_URL
```

## Important URLs to Save

After migration, save these URLs:

- Frontend URL: _________________________
- Simple Orchestrator URL: _________________________
- Query Processor URL: _________________________
- Full Orchestrator URL: _________________________ (if deployed)
- Vector Search URL: _________________________ (if deployed)
- Response Pipeline URL: _________________________ (if deployed)

## Rollback Plan

If something goes wrong:

1. Keep old project running until new one is verified
2. Update DNS/load balancer to point back to old services
3. Review logs to identify issues
4. Fix issues and redeploy

---

**Migration Date**: _______________
**New Project ID**: _______________
**Migration Status**: _______________

