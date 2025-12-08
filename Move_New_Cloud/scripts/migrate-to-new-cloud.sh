#!/bin/bash

# Cloud Account Migration Script
# This script helps automate the migration to a new GCP account

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
OLD_PROJECT_ID="future-of-search"
OLD_PROJECT_NUMBER="188396315187"
OLD_BUCKET="future-of-search-matching-engine-us-central1"

echo -e "${BLUE}🚀 Cloud Account Migration Script${NC}"
echo ""

# Get new project details
read -p "Enter your NEW GCP Project ID: " NEW_PROJECT_ID
read -p "Enter your GCP Region (default: us-central1): " NEW_REGION
NEW_REGION=${NEW_REGION:-us-central1}
read -p "Enter your NEW Storage Bucket name (default: ${NEW_PROJECT_ID}-matching-engine-${NEW_REGION}): " NEW_BUCKET
NEW_BUCKET=${NEW_BUCKET:-${NEW_PROJECT_ID}-matching-engine-${NEW_REGION}}

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Old Project ID: $OLD_PROJECT_ID"
echo "  New Project ID: $NEW_PROJECT_ID"
echo "  Region: $NEW_REGION"
echo "  New Bucket: $NEW_BUCKET"
echo ""
read -p "Continue with migration? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo -e "${RED}Migration cancelled.${NC}"
    exit 1
fi

# Step 1: Set up new project
echo -e "${BLUE}Step 1: Setting up new GCP project...${NC}"
gcloud config set project "$NEW_PROJECT_ID"

# Verify project exists
if ! gcloud projects describe "$NEW_PROJECT_ID" &>/dev/null; then
    echo -e "${RED}Error: Project $NEW_PROJECT_ID does not exist.${NC}"
    echo "Please create it first: gcloud projects create $NEW_PROJECT_ID"
    exit 1
fi

# Get project number
PROJECT_NUMBER=$(gcloud projects describe "$NEW_PROJECT_ID" --format="value(projectNumber)")
echo -e "${GREEN}✓ Project $NEW_PROJECT_ID found (Project Number: $PROJECT_NUMBER)${NC}"

# Step 2: Enable APIs
echo -e "${BLUE}Step 2: Enabling required GCP APIs...${NC}"
gcloud services enable \
    aiplatform.googleapis.com \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    containerregistry.googleapis.com \
    storage-component.googleapis.com \
    storage-api.googleapis.com \
    compute.googleapis.com \
    servicenetworking.googleapis.com \
    vpcaccess.googleapis.com \
    --project="$NEW_PROJECT_ID" || true

echo -e "${GREEN}✓ APIs enabled${NC}"

# Step 3: Create storage bucket
echo -e "${BLUE}Step 3: Creating Cloud Storage bucket...${NC}"
if gsutil ls -b "gs://$NEW_BUCKET" &>/dev/null; then
    echo -e "${YELLOW}⚠ Bucket $NEW_BUCKET already exists${NC}"
else
    gsutil mb -p "$NEW_PROJECT_ID" -c STANDARD -l "$NEW_REGION" "gs://$NEW_BUCKET"
    echo -e "${GREEN}✓ Bucket created: gs://$NEW_BUCKET${NC}"
fi

# Step 4: Update configuration files
echo -e "${BLUE}Step 4: Updating configuration files...${NC}"

# Function to replace in file
replace_in_file() {
    local file=$1
    local old=$2
    local new=$3
    
    if [ -f "$file" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|$old|$new|g" "$file"
        else
            # Linux
            sed -i "s|$old|$new|g" "$file"
        fi
        echo -e "${GREEN}✓ Updated: $file${NC}"
    else
        echo -e "${YELLOW}⚠ File not found: $file${NC}"
    fi
}

# Update docker-compose.yml
replace_in_file "docker-compose.yml" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"

# Update cloudbuild files
replace_in_file "frontend/cloudbuild.yaml" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "services/query-processor/cloudbuild.yaml" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"

# Update infrastructure scripts
replace_in_file "infrastructure/create-matching-engine.js" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "infrastructure/generate-embeddings.js" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "infrastructure/generate-mock-embeddings.js" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "scripts/delete-matching-engine.sh" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "scripts/stop-vertex-ai.sh" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "scripts/generate_embeddings.py" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"

# Update bucket names
replace_in_file "infrastructure/create-matching-engine.js" "$OLD_BUCKET" "$NEW_BUCKET"
replace_in_file "infrastructure/generate-embeddings.js" "$OLD_BUCKET" "$NEW_BUCKET"
replace_in_file "infrastructure/generate-mock-embeddings.js" "$OLD_BUCKET" "$NEW_BUCKET"
replace_in_file "infrastructure/index-metadata.json" "$OLD_BUCKET" "$NEW_BUCKET"
replace_in_file "outputs/index-config.json" "$OLD_BUCKET" "$NEW_BUCKET"
replace_in_file "outputs/index-config.yaml" "$OLD_BUCKET" "$NEW_BUCKET"

# Update application configs
replace_in_file "services/vector-search/src/main/resources/application.yml" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "services/vector-search/src/main/resources/application-local.yml" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"
replace_in_file "services/query-processor/src/server.ts" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"

# Update README
replace_in_file "README.md" "$OLD_PROJECT_ID" "$NEW_PROJECT_ID"

# Update frontend cloudbuild with project number (approximate, will need manual update)
echo -e "${YELLOW}⚠ Note: You'll need to manually update frontend/cloudbuild.yaml with the actual orchestrator URL after deployment${NC}"

echo -e "${GREEN}✓ Configuration files updated${NC}"

# Step 5: Configure Docker
echo -e "${BLUE}Step 5: Configuring Docker for GCR...${NC}"
gcloud auth configure-docker --quiet
echo -e "${GREEN}✓ Docker configured${NC}"

# Step 6: Build and push images
echo -e "${BLUE}Step 6: Building and pushing Docker images...${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"

# Build frontend (will need orchestrator URL later)
echo -e "${BLUE}Building frontend...${NC}"
cd frontend
docker build -t "gcr.io/$NEW_PROJECT_ID/frontend" . || {
    echo -e "${RED}Error building frontend. Continuing...${NC}"
}
docker push "gcr.io/$NEW_PROJECT_ID/frontend" || {
    echo -e "${RED}Error pushing frontend. Continuing...${NC}"
}
cd ..

# Build query-processor
echo -e "${BLUE}Building query-processor...${NC}"
cd services/query-processor
docker build -f Dockerfile --build-arg SERVICE_DIR=services/query-processor -t "gcr.io/$NEW_PROJECT_ID/query-processor" ../.. || {
    echo -e "${RED}Error building query-processor. Continuing...${NC}"
}
docker push "gcr.io/$NEW_PROJECT_ID/query-processor" || {
    echo -e "${RED}Error pushing query-processor. Continuing...${NC}"
}
cd ../..

# Build simple-orchestrator
echo -e "${BLUE}Building simple-orchestrator...${NC}"
cd services/simple-orchestrator
docker build -t "gcr.io/$NEW_PROJECT_ID/simple-orchestrator" . || {
    echo -e "${RED}Error building simple-orchestrator. Continuing...${NC}"
}
docker push "gcr.io/$NEW_PROJECT_ID/simple-orchestrator" || {
    echo -e "${RED}Error pushing simple-orchestrator. Continuing...${NC}"
}
cd ../..

echo -e "${GREEN}✓ Docker images built and pushed${NC}"

# Step 7: Deploy services
echo -e "${BLUE}Step 7: Deploying services to Cloud Run...${NC}"

# Deploy query-processor first
echo -e "${BLUE}Deploying query-processor...${NC}"
gcloud run deploy query-processor \
    --image "gcr.io/$NEW_PROJECT_ID/query-processor" \
    --platform managed \
    --region "$NEW_REGION" \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=$NEW_PROJECT_ID,GCP_REGION=$NEW_REGION,VERTEX_AI_KILL_SWITCH=false,DAILY_BUDGET_USD=5,GEMINI_MODEL=gemini-2.0-flash-exp,EMBEDDING_MODEL=text-embedding-005" \
    --memory 1Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --project="$NEW_PROJECT_ID" || {
    echo -e "${RED}Error deploying query-processor${NC}"
    exit 1
}

QUERY_PROCESSOR_URL=$(gcloud run services describe query-processor \
    --platform managed \
    --region "$NEW_REGION" \
    --format="value(status.url)" \
    --project="$NEW_PROJECT_ID")

echo -e "${GREEN}✓ Query Processor deployed: $QUERY_PROCESSOR_URL${NC}"

# Deploy simple-orchestrator
echo -e "${BLUE}Deploying simple-orchestrator...${NC}"
gcloud run deploy simple-orchestrator \
    --image "gcr.io/$NEW_PROJECT_ID/simple-orchestrator" \
    --platform managed \
    --region "$NEW_REGION" \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT_ID=$NEW_PROJECT_ID,GCP_REGION=$NEW_REGION,QUERY_PROCESSOR_URL=$QUERY_PROCESSOR_URL,VERTEX_AI_KILL_SWITCH=false,DAILY_BUDGET_USD=15" \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --project="$NEW_PROJECT_ID" || {
    echo -e "${RED}Error deploying simple-orchestrator${NC}"
    exit 1
}

SIMPLE_ORCHESTRATOR_URL=$(gcloud run services describe simple-orchestrator \
    --platform managed \
    --region "$NEW_REGION" \
    --format="value(status.url)" \
    --project="$NEW_PROJECT_ID")

echo -e "${GREEN}✓ Simple Orchestrator deployed: $SIMPLE_ORCHESTRATOR_URL${NC}"

# Rebuild frontend with correct orchestrator URL
echo -e "${BLUE}Rebuilding frontend with orchestrator URL...${NC}"
cd frontend
docker build \
    --build-arg "VITE_API_BASE_URL=$SIMPLE_ORCHESTRATOR_URL" \
    -t "gcr.io/$NEW_PROJECT_ID/frontend" .
docker push "gcr.io/$NEW_PROJECT_ID/frontend"
cd ..

# Deploy frontend
echo -e "${BLUE}Deploying frontend...${NC}"
gcloud run deploy frontend \
    --image "gcr.io/$NEW_PROJECT_ID/frontend" \
    --platform managed \
    --region "$NEW_REGION" \
    --allow-unauthenticated \
    --memory 256Mi \
    --cpu 1 \
    --timeout 60 \
    --max-instances 10 \
    --project="$NEW_PROJECT_ID" || {
    echo -e "${RED}Error deploying frontend${NC}"
    exit 1
}

FRONTEND_URL=$(gcloud run services describe frontend \
    --platform managed \
    --region "$NEW_REGION" \
    --format="value(status.url)" \
    --project="$NEW_PROJECT_ID")

echo -e "${GREEN}✓ Frontend deployed: $FRONTEND_URL${NC}"

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Migration Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "  Frontend:           $FRONTEND_URL"
echo "  Simple Orchestrator: $SIMPLE_ORCHESTRATOR_URL"
echo "  Query Processor:    $QUERY_PROCESSOR_URL"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Test the application: curl $SIMPLE_ORCHESTRATOR_URL/health"
echo "  2. Open frontend: $FRONTEND_URL"
echo "  3. Set up Vertex AI Matching Engine (see CLOUD_MIGRATION_GUIDE.md Step 6)"
echo "  4. Configure billing alerts"
echo "  5. Test a search query"
echo ""
echo -e "${YELLOW}Note: You may need to manually update some configuration files${NC}"
echo -e "${YELLOW}if the script missed any references to the old project ID.${NC}"
echo ""

