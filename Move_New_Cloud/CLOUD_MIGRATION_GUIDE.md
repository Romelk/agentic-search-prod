# 🚀 Cloud Account Migration Guide

Complete step-by-step guide to migrate the Agentic Search System from one Google Cloud Platform account to another.

## 📋 Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Step 1: Set Up New GCP Account](#step-1-set-up-new-gcp-account)
3. [Step 2: Update Configuration Files](#step-2-update-configuration-files)
4. [Step 3: Set Up GCP Services](#step-3-set-up-gcp-services)
5. [Step 4: Build and Push Docker Images](#step-4-build-and-push-docker-images)
6. [Step 5: Deploy Services to Cloud Run](#step-5-deploy-services-to-cloud-run)
7. [Step 6: Set Up Vertex AI Matching Engine](#step-6-set-up-vertex-ai-matching-engine)
8. [Step 7: Configure Service URLs](#step-7-configure-service-urls)
9. [Step 8: Verify Deployment](#step-8-verify-deployment)
10. [Step 9: Run the Application](#step-9-run-the-application)
11. [Troubleshooting](#troubleshooting)

---

## Pre-Migration Checklist

Before starting, gather the following information:

- [ ] New GCP Project ID (e.g., `your-new-project-id`)
- [ ] New GCP Project Number (will be assigned automatically)
- [ ] Preferred GCP Region (default: `us-central1`)
- [ ] Billing account enabled on new project
- [ ] Access to new GCP account with appropriate permissions

**Current Configuration:**
- Project ID: `future-of-search`
- Project Number: `188396315187`
- Region: `us-central1`
- Storage Bucket: `future-of-search-matching-engine-us-central1`

---

## Step 1: Set Up New GCP Account

### 1.1 Create New GCP Project

```bash
# Authenticate with new GCP account
gcloud auth login

# Create new project (replace with your project ID)
gcloud projects create YOUR-NEW-PROJECT-ID --name="Agentic Search Production"

# Set the project as active
gcloud config set project YOUR-NEW-PROJECT-ID

# Get the project number (save this for later)
gcloud projects describe YOUR-NEW-PROJECT-ID --format="value(projectNumber)"
```

### 1.2 Enable Billing

1. Go to [GCP Console Billing](https://console.cloud.google.com/billing)
2. Link your billing account to the new project
3. Verify billing is enabled:
   ```bash
   gcloud billing projects describe YOUR-NEW-PROJECT-ID
   ```

### 1.3 Set Up Authentication

```bash
# Set up Application Default Credentials
gcloud auth application-default login

# Verify authentication
gcloud auth list
```

---

## Step 2: Update Configuration Files

Update all configuration files with your new project ID. Replace `YOUR-NEW-PROJECT-ID` with your actual project ID.

### 2.1 Update Environment Variables

Create or update `.env` files in each service directory:

**`services/query-processor/.env`:**
```bash
GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID
GCP_REGION=us-central1
GEMINI_MODEL=gemini-2.0-flash-exp
EMBEDDING_MODEL=text-embedding-005
DAILY_BUDGET_USD=5
VERTEX_AI_KILL_SWITCH=false
REDIS_URL=redis://localhost:6379
```

**`services/vector-search/.env`:**
```bash
GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID
GCP_REGION=us-central1
DAILY_BUDGET_USD=8
VERTEX_AI_KILL_SWITCH=false
```

### 2.2 Update Docker Compose

Edit `docker-compose.yml`:

```bash
# Replace all instances of 'future-of-search' with YOUR-NEW-PROJECT-ID
sed -i '' 's/future-of-search/YOUR-NEW-PROJECT-ID/g' docker-compose.yml
```

Or manually update lines 76 and 103:
```yaml
- GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID
```

### 2.3 Update Cloud Build Files

**`frontend/cloudbuild.yaml`:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/YOUR-NEW-PROJECT-ID/frontend',
      '--build-arg', 'VITE_API_BASE_URL=https://simple-orchestrator-PROJECT-NUMBER.us-central1.run.app',
      '.'
    ]
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/YOUR-NEW-PROJECT-ID/frontend']
images:
  - 'gcr.io/YOUR-NEW-PROJECT-ID/frontend'
```

**`services/query-processor/cloudbuild.yaml`:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/YOUR-NEW-PROJECT-ID/query-processor',
      '-f', 'services/query-processor/Dockerfile',
      '--build-arg', 'SERVICE_DIR=services/query-processor',
      '.'
    ]
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/YOUR-NEW-PROJECT-ID/query-processor']
```

### 2.4 Update Infrastructure Scripts

**`infrastructure/create-matching-engine.js`:**
```javascript
const PROJECT_ID = 'YOUR-NEW-PROJECT-ID';
const REGION = 'us-central1';
const BUCKET_NAME = 'YOUR-NEW-PROJECT-ID-matching-engine-us-central1';
```

**`infrastructure/generate-embeddings.js`:**
```javascript
const PROJECT_ID = 'YOUR-NEW-PROJECT-ID';
const REGION = 'us-central1';
const BUCKET_NAME = 'YOUR-NEW-PROJECT-ID-matching-engine-us-central1';
```

**`scripts/delete-matching-engine.sh`:**
```bash
PROJECT_ID="${GCP_PROJECT_ID:-YOUR-NEW-PROJECT-ID}"
```

**`scripts/stop-vertex-ai.sh`:**
```bash
PROJECT_ID="${GCP_PROJECT_ID:-YOUR-NEW-PROJECT-ID}"
```

### 2.5 Update Application Configuration Files

**`services/vector-search/src/main/resources/application.yml`:**
```yaml
gcp:
  project-id: ${GCP_PROJECT_ID:YOUR-NEW-PROJECT-ID}
  region: ${GCP_REGION:us-central1}
```

**`services/vector-search/src/main/resources/application-local.yml`:**
```yaml
gcp:
  project-id: YOUR-NEW-PROJECT-ID
```

**`services/query-processor/src/server.ts`:**
```typescript
projectId: process.env.GCP_PROJECT_ID || 'YOUR-NEW-PROJECT-ID',
```

### 2.6 Update README and Documentation

Update `README.md`:
```bash
export GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID
```

---

## Step 3: Set Up GCP Services

### 3.1 Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable \
  aiplatform.googleapis.com \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  storage-component.googleapis.com \
  storage-api.googleapis.com \
  compute.googleapis.com \
  servicenetworking.googleapis.com \
  vpcaccess.googleapis.com

# Verify APIs are enabled
gcloud services list --enabled
```

### 3.2 Create Cloud Storage Bucket

```bash
# Create bucket for Matching Engine data
gsutil mb -p YOUR-NEW-PROJECT-ID -c STANDARD -l us-central1 \
  gs://YOUR-NEW-PROJECT-ID-matching-engine-us-central1

# Verify bucket creation
gsutil ls -p YOUR-NEW-PROJECT-ID
```

### 3.3 Set Up Service Account (Optional but Recommended)

```bash
# Create service account
gcloud iam service-accounts create agentic-search-sa \
  --display-name="Agentic Search Service Account" \
  --project=YOUR-NEW-PROJECT-ID

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR-NEW-PROJECT-ID \
  --member="serviceAccount:agentic-search-sa@YOUR-NEW-PROJECT-ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding YOUR-NEW-PROJECT-ID \
  --member="serviceAccount:agentic-search-sa@YOUR-NEW-PROJECT-ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

---

## Step 4: Build and Push Docker Images

### 4.1 Configure Docker for GCR

```bash
# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Verify Docker can access GCR
docker pull gcr.io/YOUR-NEW-PROJECT-ID/hello-world
```

### 4.2 Build and Push Frontend

```bash
cd frontend

# Build the image
docker build \
  --build-arg VITE_API_BASE_URL=https://simple-orchestrator-PROJECT-NUMBER.us-central1.run.app \
  -t gcr.io/YOUR-NEW-PROJECT-ID/frontend .

# Push to Container Registry
docker push gcr.io/YOUR-NEW-PROJECT-ID/frontend
```

### 4.3 Build and Push Query Processor

```bash
cd services/query-processor

# Build from project root
docker build \
  -f services/query-processor/Dockerfile \
  --build-arg SERVICE_DIR=services/query-processor \
  -t gcr.io/YOUR-NEW-PROJECT-ID/query-processor \
  ../..

# Push to Container Registry
docker push gcr.io/YOUR-NEW-PROJECT-ID/query-processor
```

### 4.4 Build and Push Simple Orchestrator

```bash
cd services/simple-orchestrator

# Build the image
docker build -t gcr.io/YOUR-NEW-PROJECT-ID/simple-orchestrator .

# Push to Container Registry
docker push gcr.io/YOUR-NEW-PROJECT-ID/simple-orchestrator
```

### 4.5 Build and Push Other Services (Optional)

If you plan to deploy the full orchestrator, vector-search, or response-pipeline:

```bash
# Full Orchestrator
cd services/orchestrator
docker build -t gcr.io/YOUR-NEW-PROJECT-ID/orchestrator .
docker push gcr.io/YOUR-NEW-PROJECT-ID/orchestrator

# Vector Search (Java)
cd services/vector-search
docker build -t gcr.io/YOUR-NEW-PROJECT-ID/vector-search .
docker push gcr.io/YOUR-NEW-PROJECT-ID/vector-search

# Response Pipeline (Java)
cd services/response-pipeline
docker build -t gcr.io/YOUR-NEW-PROJECT-ID/response-pipeline .
docker push gcr.io/YOUR-NEW-PROJECT-ID/response-pipeline
```

---

## Step 5: Deploy Services to Cloud Run

### 5.1 Deploy Simple Orchestrator

```bash
gcloud run deploy simple-orchestrator \
  --image gcr.io/YOUR-NEW-PROJECT-ID/simple-orchestrator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID,GCP_REGION=us-central1,QUERY_PROCESSOR_URL=https://query-processor-PROJECT-NUMBER.us-central1.run.app,VERTEX_AI_KILL_SWITCH=false,DAILY_BUDGET_USD=15" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10

# Get the service URL (save this!)
SIMPLE_ORCHESTRATOR_URL=$(gcloud run services describe simple-orchestrator \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

echo "Simple Orchestrator URL: $SIMPLE_ORCHESTRATOR_URL"
```

### 5.2 Deploy Query Processor

```bash
gcloud run deploy query-processor \
  --image gcr.io/YOUR-NEW-PROJECT-ID/query-processor \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID,GCP_REGION=us-central1,VERTEX_AI_KILL_SWITCH=false,DAILY_BUDGET_USD=5,GEMINI_MODEL=gemini-2.0-flash-exp,EMBEDDING_MODEL=text-embedding-005" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10

# Get the service URL
QUERY_PROCESSOR_URL=$(gcloud run services describe query-processor \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

echo "Query Processor URL: $QUERY_PROCESSOR_URL"
```

### 5.3 Update Simple Orchestrator with Query Processor URL

```bash
# Update the orchestrator with the actual query processor URL
gcloud run services update simple-orchestrator \
  --platform managed \
  --region us-central1 \
  --update-env-vars="QUERY_PROCESSOR_URL=$QUERY_PROCESSOR_URL"
```

### 5.4 Deploy Frontend

```bash
# First, update the frontend build with the correct orchestrator URL
cd frontend

# Rebuild with correct API URL
docker build \
  --build-arg VITE_API_BASE_URL=$SIMPLE_ORCHESTRATOR_URL \
  -t gcr.io/YOUR-NEW-PROJECT-ID/frontend .

docker push gcr.io/YOUR-NEW-PROJECT-ID/frontend

# Deploy to Cloud Run
gcloud run deploy frontend \
  --image gcr.io/YOUR-NEW-PROJECT-ID/frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --timeout 60 \
  --max-instances 10

# Get the frontend URL
FRONTEND_URL=$(gcloud run services describe frontend \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

echo "Frontend URL: $FRONTEND_URL"
```

### 5.5 Deploy Additional Services (Optional)

If deploying the full stack:

```bash
# Full Orchestrator
gcloud run deploy orchestrator \
  --image gcr.io/YOUR-NEW-PROJECT-ID/orchestrator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID,GCP_REGION=us-central1,QUERY_PROCESSOR_URL=$QUERY_PROCESSOR_URL,VECTOR_SEARCH_URL=https://vector-search-PROJECT-NUMBER.us-central1.run.app,RESPONSE_PIPELINE_URL=https://response-pipeline-PROJECT-NUMBER.us-central1.run.app" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300

# Vector Search
gcloud run deploy vector-search \
  --image gcr.io/YOUR-NEW-PROJECT-ID/vector-search \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID,GCP_REGION=us-central1,SPRING_PROFILES_ACTIVE=production" \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300

# Response Pipeline
gcloud run deploy response-pipeline \
  --image gcr.io/YOUR-NEW-PROJECT-ID/response-pipeline \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID,SPRING_PROFILES_ACTIVE=production" \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300
```

---

## Step 6: Set Up Vertex AI Matching Engine

### 6.1 Prepare Data

```bash
cd infrastructure

# Generate embeddings (if you have product data)
node generate-embeddings.js

# Or use mock data for testing
node generate-mock-embeddings.js
```

### 6.2 Upload Data to Cloud Storage

```bash
# Upload embeddings to the bucket
gsutil cp matching-engine-data.json \
  gs://YOUR-NEW-PROJECT-ID-matching-engine-us-central1/matching-engine/data/

# Upload index metadata
gsutil cp index-metadata.json \
  gs://YOUR-NEW-PROJECT-ID-matching-engine-us-central1/matching-engine/data/
```

### 6.3 Create Matching Engine Index

```bash
# Update the create-matching-engine.js script with your project ID first
node create-matching-engine.js

# Or use gcloud CLI
gcloud ai indexes create \
  --metadata-file=index-metadata.json \
  --display-name="agentic-search-index" \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID
```

### 6.4 Create Index Endpoint

```bash
gcloud ai index-endpoints create \
  --display-name="agentic-search-endpoint" \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID

# Get the endpoint ID
ENDPOINT_ID=$(gcloud ai index-endpoints list \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID \
  --format="value(name)" | head -1)

echo "Endpoint ID: $ENDPOINT_ID"
```

### 6.5 Deploy Index to Endpoint

```bash
# Get the index ID
INDEX_ID=$(gcloud ai indexes list \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID \
  --format="value(name)" | head -1)

# Deploy the index
gcloud ai index-endpoints deploy-index $ENDPOINT_ID \
  --deployed-index-id="agentic-search-deployed-index" \
  --index=$INDEX_ID \
  --display-name="agentic-search-deployment" \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID
```

### 6.6 Update Vector Search Service

```bash
# Get the deployed index ID
DEPLOYED_INDEX_ID=$(gcloud ai index-endpoints describe $ENDPOINT_ID \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID \
  --format="value(deployedIndexes[0].id)")

# Update vector-search service with endpoint and index IDs
gcloud run services update vector-search \
  --platform managed \
  --region us-central1 \
  --update-env-vars="VERTEX_AI_ENDPOINT_ID=$ENDPOINT_ID,VERTEX_AI_INDEX_ID=$INDEX_ID,VERTEX_AI_DEPLOYED_INDEX_ID=$DEPLOYED_INDEX_ID"
```

---

## Step 7: Configure Service URLs

### 7.1 Update Frontend with Correct Backend URL

After deploying the orchestrator, rebuild and redeploy the frontend:

```bash
cd frontend

# Get the actual orchestrator URL
ORCHESTRATOR_URL=$(gcloud run services describe simple-orchestrator \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

# Rebuild with correct URL
docker build \
  --build-arg VITE_API_BASE_URL=$ORCHESTRATOR_URL \
  -t gcr.io/YOUR-NEW-PROJECT-ID/frontend .

docker push gcr.io/YOUR-NEW-PROJECT-ID/frontend

# Redeploy
gcloud run services update frontend \
  --image gcr.io/YOUR-NEW-PROJECT-ID/frontend \
  --platform managed \
  --region us-central1
```

### 7.2 Update Service-to-Service URLs

If using the full orchestrator, update it with all service URLs:

```bash
QUERY_PROCESSOR_URL=$(gcloud run services describe query-processor \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

VECTOR_SEARCH_URL=$(gcloud run services describe vector-search \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

RESPONSE_PIPELINE_URL=$(gcloud run services describe response-pipeline \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)")

gcloud run services update orchestrator \
  --platform managed \
  --region us-central1 \
  --update-env-vars="QUERY_PROCESSOR_URL=$QUERY_PROCESSOR_URL,VECTOR_SEARCH_URL=$VECTOR_SEARCH_URL,RESPONSE_PIPELINE_URL=$RESPONSE_PIPELINE_URL"
```

---

## Step 8: Verify Deployment

### 8.1 Check All Services Are Running

```bash
# List all Cloud Run services
gcloud run services list --platform managed --region us-central1

# Check service health
curl https://SIMPLE-ORCHESTRATOR-URL/health
curl https://QUERY-PROCESSOR-URL/health
curl https://FRONTEND-URL
```

### 8.2 Test API Endpoints

```bash
# Test search endpoint
curl -X POST https://SIMPLE-ORCHESTRATOR-URL/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress", "maxResults": 10}'

# Test health endpoint
curl https://SIMPLE-ORCHESTRATOR-URL/health
```

### 8.3 Verify Vertex AI Access

```bash
# Test Vertex AI API access
gcloud ai models list --region=us-central1 --project=YOUR-NEW-PROJECT-ID

# Check Matching Engine index
gcloud ai indexes list --region=us-central1 --project=YOUR-NEW-PROJECT-ID
```

### 8.4 Check Logs

```bash
# View logs for each service
gcloud run services logs read simple-orchestrator \
  --platform managed \
  --region us-central1

gcloud run services logs read query-processor \
  --platform managed \
  --region us-central1
```

---

## Step 9: Run the Application

### 9.1 Access the Application

Open your browser and navigate to:
```
https://FRONTEND-URL
```

### 9.2 Test Local Development

For local development, update your environment variables:

```bash
# Set environment variables
export GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID
export GCP_REGION=us-central1
export VERTEX_AI_KILL_SWITCH=false
export DAILY_BUDGET_USD=15

# Start services locally
docker-compose up -d redis postgres
cd services/simple-orchestrator && npm run dev
cd services/query-processor && npm run dev
cd frontend && npm run dev
```

### 9.3 Run with Docker Compose

```bash
# Update docker-compose.yml with new project ID
# Then start all services
docker-compose up
```

---

## Troubleshooting

### Issue: Authentication Errors

**Problem:** `403 Forbidden` or authentication errors

**Solution:**
```bash
# Re-authenticate
gcloud auth login
gcloud auth application-default login

# Verify project is set
gcloud config set project YOUR-NEW-PROJECT-ID
gcloud config get-value project
```

### Issue: API Not Enabled

**Problem:** `API not enabled` errors

**Solution:**
```bash
# Enable the specific API
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
```

### Issue: Billing Not Enabled

**Problem:** `BILLING_DISABLED` errors

**Solution:**
1. Go to [GCP Console Billing](https://console.cloud.google.com/billing)
2. Link a billing account to your project
3. Wait a few minutes for propagation

### Issue: Container Registry Access Denied

**Problem:** Cannot push to `gcr.io`

**Solution:**
```bash
# Configure Docker authentication
gcloud auth configure-docker

# Verify access
gcloud auth list
```

### Issue: Service URLs Not Working

**Problem:** Services return 404 or connection errors

**Solution:**
```bash
# Verify services are deployed
gcloud run services list --platform managed --region us-central1

# Check service URLs
gcloud run services describe SERVICE-NAME \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)"

# Check service logs for errors
gcloud run services logs read SERVICE-NAME \
  --platform managed \
  --region us-central1
```

### Issue: Vertex AI Quota Exceeded

**Problem:** `429 Too Many Requests` or quota errors

**Solution:**
1. Check quotas: [GCP Console Quotas](https://console.cloud.google.com/iam-admin/quotas)
2. Request quota increase if needed
3. Implement rate limiting in your application

### Issue: Matching Engine Not Found

**Problem:** Vector search returns errors about missing index

**Solution:**
```bash
# Verify index exists
gcloud ai indexes list --region=us-central1 --project=YOUR-NEW-PROJECT-ID

# Verify endpoint exists
gcloud ai index-endpoints list --region=us-central1 --project=YOUR-NEW-PROJECT-ID

# Check deployment status
gcloud ai index-endpoints describe ENDPOINT-ID \
  --region=us-central1 \
  --project=YOUR-NEW-PROJECT-ID
```

### Issue: Environment Variables Not Set

**Problem:** Services fail with missing configuration

**Solution:**
```bash
# Update service with environment variables
gcloud run services update SERVICE-NAME \
  --platform managed \
  --region us-central1 \
  --update-env-vars="GCP_PROJECT_ID=YOUR-NEW-PROJECT-ID,GCP_REGION=us-central1"
```

---

## Quick Reference: All Commands in One Place

```bash
# 1. Set up project
gcloud config set project YOUR-NEW-PROJECT-ID

# 2. Enable APIs
gcloud services enable aiplatform.googleapis.com run.googleapis.com cloudbuild.googleapis.com

# 3. Create bucket
gsutil mb -p YOUR-NEW-PROJECT-ID -c STANDARD -l us-central1 \
  gs://YOUR-NEW-PROJECT-ID-matching-engine-us-central1

# 4. Build and push images
docker build -t gcr.io/YOUR-NEW-PROJECT-ID/frontend ./frontend
docker push gcr.io/YOUR-NEW-PROJECT-ID/frontend

# 5. Deploy services
gcloud run deploy simple-orchestrator \
  --image gcr.io/YOUR-NEW-PROJECT-ID/simple-orchestrator \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# 6. Get service URLs
gcloud run services describe simple-orchestrator \
  --platform managed \
  --region us-central1 \
  --format="value(status.url)"
```

---

## Post-Migration Checklist

- [ ] All services deployed and accessible
- [ ] Health checks passing
- [ ] API endpoints responding correctly
- [ ] Frontend loading and connecting to backend
- [ ] Vertex AI API calls working
- [ ] Matching Engine index created and deployed (if using)
- [ ] Service-to-service communication working
- [ ] Logs showing no errors
- [ ] Billing alerts configured
- [ ] Monitoring set up
- [ ] Old project resources cleaned up (optional)

---

## Cost Management

After migration, set up cost controls:

```bash
# Set up budget alerts
# Go to: https://console.cloud.google.com/billing/budgets?project=YOUR-NEW-PROJECT-ID

# Configure daily budgets in service environment variables
# DAILY_BUDGET_USD=15
# SERVICE_BUDGET_QUERY_PROCESSOR=5
# SERVICE_BUDGET_VECTOR_SEARCH=8
```

---

## Support and Resources

- **GCP Console**: https://console.cloud.google.com/?project=YOUR-NEW-PROJECT-ID
- **Cloud Run Services**: https://console.cloud.google.com/run?project=YOUR-NEW-PROJECT-ID
- **Vertex AI Console**: https://console.cloud.google.com/vertex-ai?project=YOUR-NEW-PROJECT-ID
- **Billing Dashboard**: https://console.cloud.google.com/billing?project=YOUR-NEW-PROJECT-ID
- **Cloud Storage**: https://console.cloud.google.com/storage?project=YOUR-NEW-PROJECT-ID

---

**Last Updated**: 2025-01-17
**Migration Status**: Ready for execution

