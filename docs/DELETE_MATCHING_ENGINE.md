# 🗑️ How to Delete Matching Engine Resources

## ⚠️ CRITICAL: Delete These to Stop Costs

Matching Engine endpoints cost **~$0.10-0.50/hour** even when idle. You must delete them to stop the charges.

---

## Method 1: Google Cloud Console (Recommended)

### Step 1: Delete Index Endpoints

1. **Go to Index Endpoints:**
   - Direct link: https://console.cloud.google.com/vertex-ai/matching-engine/index-endpoints?project=future-of-search
   - Or navigate: Vertex AI → Matching Engine → Index Endpoints

2. **For each endpoint:**
   - Click on the endpoint name
   - Click **"UNDEPLOY INDEX"** (if an index is deployed)
   - Wait for undeployment to complete
   - Click **"DELETE"** button
   - Confirm deletion

### Step 2: Delete Indexes

1. **Go to Indexes:**
   - Direct link: https://console.cloud.google.com/vertex-ai/matching-engine/indexes?project=future-of-search
   - Or navigate: Vertex AI → Matching Engine → Indexes

2. **For each index:**
   - Click on the index name
   - Click **"DELETE"** button
   - Confirm deletion

---

## Method 2: Using gcloud CLI

**Note:** This requires billing to be enabled. If you get permission errors, use Method 1 instead.

### Quick Delete Script

```bash
# Run the automated deletion script
./scripts/delete-matching-engine.sh
```

### Manual Commands

```bash
# Set your project and region
export PROJECT_ID=future-of-search
export REGION=us-central1

# 1. List all endpoints
gcloud ai index-endpoints list --region=$REGION --project=$PROJECT_ID

# 2. For each endpoint, first undeploy any indexes
gcloud ai index-endpoints undeploy-index ENDPOINT_ID \
  --deployed-index-id=DEPLOYED_INDEX_ID \
  --region=$REGION \
  --project=$PROJECT_ID

# 3. Delete the endpoint
gcloud ai index-endpoints delete ENDPOINT_ID \
  --region=$REGION \
  --project=$PROJECT_ID

# 4. List all indexes
gcloud ai indexes list --region=$REGION --project=$PROJECT_ID

# 5. Delete each index
gcloud ai indexes delete INDEX_ID \
  --region=$REGION \
  --project=$PROJECT_ID
```

---

## Method 3: Disable Vertex AI API (Nuclear Option)

This stops ALL Vertex AI usage immediately:

1. **Go to API Library:**
   - Direct link: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=future-of-search

2. **Disable the API:**
   - Click **"DISABLE API"** button
   - Confirm the action

**⚠️ Warning:** This will disable ALL Vertex AI services, not just Matching Engine.

---

## Verify Deletion

After deletion, verify:

1. **Check Index Endpoints:**
   - https://console.cloud.google.com/vertex-ai/matching-engine/index-endpoints?project=future-of-search
   - Should show "No resources found"

2. **Check Indexes:**
   - https://console.cloud.google.com/vertex-ai/matching-engine/indexes?project=future-of-search
   - Should show "No resources found"

3. **Check Billing:**
   - https://console.cloud.google.com/billing
   - Costs should stop accumulating after deletion

---

## Expected Costs After Deletion

- **Index Endpoints:** $0/hour (deleted)
- **Indexes:** $0 (deleted)
- **API Calls:** $0 (kill switch enabled)
- **Storage:** Minimal (GCS bucket storage only)

---

## Troubleshooting

### "Cannot delete endpoint with deployed indexes"
- First undeploy all indexes from the endpoint
- Then delete the endpoint

### "Permission denied" errors
- Use Google Cloud Console instead of CLI
- Ensure you have "Vertex AI Admin" role

### Resources still showing after deletion
- Wait 5-10 minutes for propagation
- Refresh the console page
- Check if deletion is still in progress

---

## Prevention

After deletion, ensure:

1. ✅ Kill switch is enabled: `export VERTEX_AI_KILL_SWITCH=true`
2. ✅ No services are running locally
3. ✅ Billing alerts are set up
4. ✅ Vertex AI API is disabled (if you don't need it)

