# Backend API Testing Guide

## 🧪 Quick Testing Methods

### 1. **Test Script (Recommended)**
Run the automated test script:
```bash
./test-backend.sh
```

This will test all endpoints and save full response to `test-output.json`.

### 2. **HTTP File (VS Code REST Client)**
Open `test-backend-api.http` in VS Code with REST Client extension installed.
Click "Send Request" above each endpoint.

### 3. **Swagger UI (Interactive)**
Open `swagger-ui.html` in your browser to get an interactive API documentation interface.

### 4. **cURL Commands**
See examples below.

## 📋 API Endpoints

### Base URL
```
http://localhost:3003
```

### 1. Health Check
```bash
curl http://localhost:3003/health
```

### 2. API Information
```bash
curl http://localhost:3003/
```

### 3. Search Endpoint
```bash
curl -X POST http://localhost:3003/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "blue dress",
    "maxResults": 5
  }'
```

### 4. Search with Filters
```bash
curl -X POST http://localhost:3003/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "shirt",
    "filters": {
      "color": "blue",
      "priceRange": [50, 100],
      "occasion": "work"
    },
    "maxResults": 5
  }'
```

## 📊 Expected Response Structure

```json
{
  "sessionId": "session_1234567890",
  "query": "blue dress",
  "results": [
    {
      "look": {
        "bundleId": "bundle_001",
        "bundleName": "blue dress Look",
        "items": [
          {
            "product": {
              "sku": "SKU001",
              "name": "Elegant Blue Summer Dress",
              "price": 89.99,
              "category": "clothing",
              "subcategory": "dresses",
              "color": "blue",
              "brand": "StyleCo"
            },
            "similarityScore": 0.95,
            "matchingAttributes": ["color", "category", "occasion"],
            "matchReason": "Matches your search for \"blue dress\""
          }
        ],
        "totalPrice": 245.98,
        "description": "A perfect blue dress look featuring curated items",
        "styleTheme": "modern"
      },
      "finalScore": 1.0,
      "confidence": 0.89,
      "recommendationReason": "Excellent modern style with great coherence and value"
    }
  ],
  "questions": [],
  "processingTime": 450,
  "cost": 0.015,
  "aiAnalysis": {
    "intent": {
      "intentType": "product_search",
      "confidence": 0.95
    },
    "clarification": {
      "needsClarification": false,
      "questions": []
    }
  }
}
```

## 🔍 Testing Scenarios

### Scenario 1: Simple Query (No Clarification Needed)
```bash
curl -X POST http://localhost:3003/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress", "maxResults": 3}'
```
**Expected**: Results returned, no questions

### Scenario 2: Ambiguous Query (Clarification Needed)
```bash
curl -X POST http://localhost:3003/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "shirt", "maxResults": 5}'
```
**Expected**: Results returned + questions array with clarification options

### Scenario 3: Filtered Search
```bash
curl -X POST http://localhost:3003/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "dress",
    "filters": {
      "color": "red",
      "priceRange": [50, 150],
      "occasion": "party"
    },
    "maxResults": 5
  }'
```
**Expected**: Filtered results matching criteria

## 🛠️ Using Postman

1. Import the OpenAPI spec: `schema/openapi.yaml`
2. Create a new collection
3. Add requests using the examples above

## 📝 Response Validation Checklist

- ✅ `query` matches input
- ✅ `results` is an array
- ✅ Each result has `look.bundleId`, `look.bundleName`, `look.items`
- ✅ Each item has `product` with required fields
- ✅ `recommendationReason` is present
- ✅ `processingTime` and `cost` are numeric
- ✅ `questions` array (may be empty)
- ✅ `aiAnalysis.intent.intentType` is set

## 🚀 Next Steps

Once backend is verified:
1. Test frontend integration
2. Test filter combinations
3. Test error scenarios
4. Load testing




