#!/bin/bash
# Script to delete Matching Engine resources and stop costs

set -e

PROJECT_ID="${GCP_PROJECT_ID:-future-of-search}"
REGION="${GCP_REGION:-us-central1}"

echo "🗑️  Deleting Matching Engine Resources..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Function to delete an endpoint
delete_endpoint() {
    local endpoint_id=$1
    echo "   Deleting endpoint: $endpoint_id"
    
    # First, get deployed indexes and undeploy them
    DEPLOYED_INDEXES=$(gcloud ai index-endpoints describe "$endpoint_id" \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(deployedIndexes[].id)" 2>/dev/null || echo "")
    
    if [ -n "$DEPLOYED_INDEXES" ]; then
        echo "$DEPLOYED_INDEXES" | while read deployed_id; do
            if [ -n "$deployed_id" ]; then
                echo "   → Undeploying index: $deployed_id"
                gcloud ai index-endpoints undeploy-index "$endpoint_id" \
                    --deployed-index-id="$deployed_id" \
                    --region=$REGION \
                    --project=$PROJECT_ID \
                    --quiet 2>/dev/null || echo "   ⚠️  Could not undeploy $deployed_id"
            fi
        done
    fi
    
    # Wait a bit for undeployment
    sleep 5
    
    # Now delete the endpoint
    echo "   → Deleting endpoint..."
    gcloud ai index-endpoints delete "$endpoint_id" \
        --region=$REGION \
        --project=$PROJECT_ID \
        --quiet && echo "   ✅ Deleted endpoint: $endpoint_id" || echo "   ❌ Failed to delete endpoint: $endpoint_id"
}

# Function to delete an index
delete_index() {
    local index_id=$1
    echo "   Deleting index: $index_id"
    gcloud ai indexes delete "$index_id" \
        --region=$REGION \
        --project=$PROJECT_ID \
        --quiet && echo "   ✅ Deleted index: $index_id" || echo "   ❌ Failed to delete index: $index_id"
}

# Step 1: List and delete endpoints
echo "1️⃣  Checking for Index Endpoints..."
ENDPOINTS=$(gcloud ai index-endpoints list --region=$REGION --project=$PROJECT_ID --format="value(name)" 2>/dev/null || echo "")

if [ -z "$ENDPOINTS" ]; then
    echo "   ✅ No endpoints found"
else
    echo "   Found endpoints:"
    echo "$ENDPOINTS" | while read endpoint; do
        if [ -n "$endpoint" ]; then
            # Extract just the ID from the full resource name
            ENDPOINT_ID=$(echo "$endpoint" | sed 's/.*\///')
            echo "   - $ENDPOINT_ID"
            delete_endpoint "$ENDPOINT_ID"
            echo ""
        fi
    done
fi

# Step 2: List and delete indexes
echo ""
echo "2️⃣  Checking for Indexes..."
INDEXES=$(gcloud ai indexes list --region=$REGION --project=$PROJECT_ID --format="value(name)" 2>/dev/null || echo "")

if [ -z "$INDEXES" ]; then
    echo "   ✅ No indexes found"
else
    echo "   Found indexes:"
    echo "$INDEXES" | while read index; do
        if [ -n "$index" ]; then
            # Extract just the ID from the full resource name
            INDEX_ID=$(echo "$index" | sed 's/.*\///')
            echo "   - $INDEX_ID"
            delete_index "$INDEX_ID"
            echo ""
        fi
    done
fi

echo ""
echo "✅ Deletion process complete!"
echo ""
echo "⚠️  Note: It may take a few minutes for resources to be fully deleted."
echo "   Check the Google Cloud Console to confirm deletion."

