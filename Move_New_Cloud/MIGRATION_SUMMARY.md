# 🚀 Cloud Migration Summary

This document provides a quick overview of the migration process. For detailed steps, see `CLOUD_MIGRATION_GUIDE.md`.

## Quick Start

### Option 1: Automated Migration (Recommended)

Run the automated migration script:

```bash
./scripts/migrate-to-new-cloud.sh
```

The script will:
- ✅ Set up your new GCP project
- ✅ Enable required APIs
- ✅ Create storage bucket
- ✅ Update all configuration files
- ✅ Build and push Docker images
- ✅ Deploy services to Cloud Run
- ✅ Configure service URLs

**Time Required**: 15-30 minutes

### Option 2: Manual Migration

Follow the detailed guide step-by-step:

```bash
# Open the detailed guide
cat CLOUD_MIGRATION_GUIDE.md
```

**Time Required**: 1-2 hours

## What Gets Migrated

### ✅ Services
- Simple Orchestrator (Backend API)
- Query Processor (AI Agents)
- Frontend (React App)
- Full Orchestrator (Optional - LangGraph)
- Vector Search (Optional - Java)
- Response Pipeline (Optional - Java)

### ✅ Infrastructure
- Cloud Run services
- Cloud Storage bucket
- Vertex AI Matching Engine (if configured)
- Container Registry images
- Service configurations

### ✅ Configuration
- Project IDs
- Service URLs
- Environment variables
- API endpoints
- Storage bucket paths

## What You Need

1. **New GCP Project**
   - Project ID (e.g., `my-new-project`)
   - Billing account enabled
   - Appropriate permissions

2. **Access**
   - `gcloud` CLI installed and authenticated
   - Docker installed and running
   - Access to source code repository

3. **Information**
   - Current project: `future-of-search`
   - New project: `YOUR-NEW-PROJECT-ID`
   - Region: `us-central1` (or your preferred region)

## Migration Steps Overview

1. **Setup** (5 min)
   - Create new GCP project
   - Enable billing
   - Authenticate

2. **Configuration** (10 min)
   - Update config files with new project ID
   - Update bucket names
   - Update service URLs

3. **Build & Deploy** (15-30 min)
   - Build Docker images
   - Push to Container Registry
   - Deploy to Cloud Run

4. **Verify** (5 min)
   - Test health endpoints
   - Test API calls
   - Verify frontend loads

5. **Optional Setup** (30-60 min)
   - Set up Vertex AI Matching Engine
   - Configure additional services
   - Set up monitoring

## Current vs New Configuration

| Item | Current | New |
|------|---------|-----|
| Project ID | `future-of-search` | `YOUR-NEW-PROJECT-ID` |
| Project Number | `188396315187` | `YOUR-PROJECT-NUMBER` |
| Region | `us-central1` | `us-central1` (or your choice) |
| Storage Bucket | `future-of-search-matching-engine-us-central1` | `YOUR-NEW-PROJECT-ID-matching-engine-us-central1` |
| Container Registry | `gcr.io/future-of-search/` | `gcr.io/YOUR-NEW-PROJECT-ID/` |

## Files Modified During Migration

The migration script or process will update these files:

- `docker-compose.yml`
- `frontend/cloudbuild.yaml`
- `services/query-processor/cloudbuild.yaml`
- `infrastructure/create-matching-engine.js`
- `infrastructure/generate-embeddings.js`
- `infrastructure/generate-mock-embeddings.js`
- `infrastructure/index-metadata.json`
- `scripts/delete-matching-engine.sh`
- `scripts/stop-vertex-ai.sh`
- `services/vector-search/src/main/resources/application.yml`
- `services/vector-search/src/main/resources/application-local.yml`
- `services/query-processor/src/server.ts`
- `README.md`

## Post-Migration Verification

After migration, verify:

```bash
# 1. Check services are running
gcloud run services list --platform managed --region us-central1

# 2. Test health endpoint
curl https://YOUR-ORCHESTRATOR-URL/health

# 3. Test search API
curl -X POST https://YOUR-ORCHESTRATOR-URL/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "maxResults": 10}'

# 4. Open frontend
open https://YOUR-FRONTEND-URL
```

## Troubleshooting

Common issues and quick fixes:

### Authentication Errors
```bash
gcloud auth login
gcloud auth application-default login
```

### API Not Enabled
```bash
gcloud services enable aiplatform.googleapis.com run.googleapis.com
```

### Billing Not Enabled
- Go to: https://console.cloud.google.com/billing
- Link billing account to project

### Service Not Found
```bash
# Verify deployment
gcloud run services describe SERVICE-NAME \
  --platform managed --region us-central1
```

## Cost Considerations

After migration, monitor costs:

- **Cloud Run**: ~$10-50/month (depending on traffic)
- **Vertex AI API**: ~$20/month (100 searches/day)
- **Vertex AI Matching Engine**: ~$140/month (if used)
- **Cloud Storage**: ~$1-5/month (minimal)

Set up billing alerts:
- Go to: https://console.cloud.google.com/billing/budgets

## Support Resources

- **Detailed Guide**: `CLOUD_MIGRATION_GUIDE.md`
- **Checklist**: `MIGRATION_CHECKLIST.md`
- **Migration Script**: `scripts/migrate-to-new-cloud.sh`
- **GCP Console**: https://console.cloud.google.com

## Next Steps After Migration

1. ✅ Verify all services are working
2. ✅ Update team documentation with new URLs
3. ✅ Set up monitoring and alerts
4. ✅ Configure cost budgets
5. ✅ Test all features end-to-end
6. ✅ (Optional) Clean up old project resources

## Quick Reference Commands

```bash
# Set new project
gcloud config set project YOUR-NEW-PROJECT-ID

# Enable APIs
gcloud services enable aiplatform.googleapis.com run.googleapis.com

# Deploy service
gcloud run deploy SERVICE-NAME \
  --image gcr.io/YOUR-NEW-PROJECT-ID/SERVICE-NAME \
  --platform managed --region us-central1 --allow-unauthenticated

# Get service URL
gcloud run services describe SERVICE-NAME \
  --platform managed --region us-central1 \
  --format="value(status.url)"

# View logs
gcloud run services logs read SERVICE-NAME \
  --platform managed --region us-central1
```

---

**Ready to migrate?** Start with `./scripts/migrate-to-new-cloud.sh` or follow `CLOUD_MIGRATION_GUIDE.md` for detailed steps.

