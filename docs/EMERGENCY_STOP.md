# 🛑 Emergency Stop: Vertex AI Cost Control

## Immediate Actions Taken

✅ **All application services stopped** - No more API calls from your local services
✅ **Kill switch enabled** - Set `VERTEX_AI_KILL_SWITCH=true` to block all Vertex AI calls

## Critical: Stop Matching Engine Costs

**Matching Engine endpoints and indexes cost money even when idle!** You must delete them in Google Cloud Console.

### Quick Steps:

1. **Go to Vertex AI Console:**
   - https://console.cloud.google.com/vertex-ai/matching-engine/indexes?project=future-of-search
   - Delete any active indexes

2. **Go to Index Endpoints:**
   - https://console.cloud.google.com/vertex-ai/matching-engine/index-endpoints?project=future-of-search
   - **Undeploy** or **Delete** any active endpoints (this is the main cost driver!)

3. **Disable Vertex AI API (Nuclear Option):**
   - https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=future-of-search
   - Click **"DISABLE API"** - This stops ALL Vertex AI usage immediately

### Using gcloud CLI:

```bash
# List endpoints
gcloud ai index-endpoints list --region=us-central1 --project=future-of-search

# Undeploy an index from an endpoint (replace with actual IDs)
gcloud ai index-endpoints undeploy-index ENDPOINT_ID \
  --deployed-index-id=DEPLOYED_INDEX_ID \
  --region=us-central1 \
  --project=future-of-search

# Delete an endpoint (WARNING: Permanent!)
gcloud ai index-endpoints delete ENDPOINT_ID \
  --region=us-central1 \
  --project=future-of-search

# Delete an index (WARNING: Permanent!)
gcloud ai indexes delete INDEX_ID \
  --region=us-central1 \
  --project=future-of-search
```

## Prevent Future Costs

### 1. Enable Kill Switch Permanently

Add to your `~/.zshrc` or `~/.bashrc`:
```bash
export VERTEX_AI_KILL_SWITCH=true
```

### 2. Set Up Billing Alerts

1. Go to: https://console.cloud.google.com/billing/budgets?project=future-of-search
2. Create a budget with alerts at $50, $100, $200 thresholds
3. Set up email/SMS notifications

### 3. Disable Vertex AI API (if you don't need it)

1. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=future-of-search
2. Click **"DISABLE API"**

## Cost Breakdown

Your $415 cost likely comes from:
- **Matching Engine Endpoint**: ~$0.10-0.50/hour when deployed (even idle!)
- **API Calls**: Gemini, Embeddings, Matching Engine queries
- **Index Building**: One-time cost when creating indexes

## Re-enable Later

When you're ready to use Vertex AI again:

```bash
# Disable kill switch
export VERTEX_AI_KILL_SWITCH=false

# Or unset it
unset VERTEX_AI_KILL_SWITCH
```

## Emergency Script

Run this anytime to stop everything:
```bash
./scripts/stop-vertex-ai.sh
```

