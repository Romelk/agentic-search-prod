#!/bin/bash
# Emergency script to stop all Vertex AI usage and costs

set -e

echo "🛑 EMERGENCY STOP: Stopping all Vertex AI usage..."
echo ""

# 1. Kill all running services
echo "1️⃣  Stopping all application services..."
pkill -f "gradlew bootRun" 2>/dev/null || true
pkill -f "vector-search" 2>/dev/null || true
pkill -f "query-processor" 2>/dev/null || true
pkill -f "orchestrator" 2>/dev/null || true
pkill -f "response-pipeline" 2>/dev/null || true
echo "   ✅ Services stopped"

# 2. Enable kill switch globally
echo ""
echo "2️⃣  Enabling kill switch..."
export VERTEX_AI_KILL_SWITCH=true
echo "   ✅ Kill switch enabled (set VERTEX_AI_KILL_SWITCH=true)"

# 3. Check for deployed Matching Engine resources
echo ""
echo "3️⃣  Checking Matching Engine resources..."
PROJECT_ID="${GCP_PROJECT_ID:-future-of-search}"
REGION="${GCP_REGION:-us-central1}"

ENDPOINTS=$(gcloud ai index-endpoints list --region=$REGION --project=$PROJECT_ID --format="value(name)" 2>/dev/null || echo "")
INDEXES=$(gcloud ai indexes list --region=$REGION --project=$PROJECT_ID --format="value(name)" 2>/dev/null || echo "")

if [ -n "$ENDPOINTS" ]; then
    echo "   ⚠️  Found deployed endpoints:"
    echo "$ENDPOINTS" | while read endpoint; do
        echo "      - $endpoint"
        echo ""
        echo "   💡 To undeploy an endpoint, run:"
        echo "      gcloud ai index-endpoints undeploy-index $endpoint --deployed-index-id=<DEPLOYED_INDEX_ID> --region=$REGION --project=$PROJECT_ID"
        echo ""
        echo "   💡 To delete an endpoint (WARNING: This deletes the endpoint):"
        echo "      gcloud ai index-endpoints delete $endpoint --region=$REGION --project=$PROJECT_ID"
    done
else
    echo "   ✅ No deployed endpoints found"
fi

if [ -n "$INDEXES" ]; then
    echo "   ⚠️  Found indexes:"
    echo "$INDEXES" | while read index; do
        echo "      - $index"
        echo ""
        echo "   💡 To delete an index (WARNING: This deletes the index):"
        echo "      gcloud ai indexes delete $index --region=$REGION --project=$PROJECT_ID"
    done
else
    echo "   ✅ No indexes found"
fi

# 4. Instructions for Google Cloud Console
echo ""
echo "4️⃣  Additional steps to stop costs:"
echo ""
echo "   📋 In Google Cloud Console:"
echo "      1. Go to: https://console.cloud.google.com/vertex-ai"
echo "      2. Navigate to 'Matching Engine' → 'Indexes'"
echo "      3. Delete or pause any active indexes"
echo "      4. Navigate to 'Matching Engine' → 'Index Endpoints'"
echo "      5. Undeploy or delete any active endpoints"
echo ""
echo "   📋 To disable Vertex AI API (stops all API calls):"
echo "      1. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com"
echo "      2. Click 'DISABLE API' (this will stop all Vertex AI usage)"
echo ""
echo "   📋 To set billing alerts:"
echo "      1. Go to: https://console.cloud.google.com/billing"
echo "      2. Set up budget alerts to prevent future overages"
echo ""

# 5. Export kill switch for current session
echo "5️⃣  Setting environment variables..."
echo ""
echo "   Run these commands to ensure kill switch is active:"
echo "   export VERTEX_AI_KILL_SWITCH=true"
echo "   export GCP_PROJECT_ID=$PROJECT_ID"
echo "   export GCP_REGION=$REGION"
echo ""

echo "✅ Emergency stop complete!"
echo ""
echo "⚠️  IMPORTANT: Matching Engine endpoints and indexes may still be running"
echo "   and incurring costs. Review and delete them in Google Cloud Console."
echo ""
echo "💡 To permanently disable, add to your shell profile (~/.zshrc or ~/.bashrc):"
echo "   export VERTEX_AI_KILL_SWITCH=true"

