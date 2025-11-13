# Product Data Coverage for Test Scenarios

This document describes the product data designed to return results for each test scenario.

## Product Inventory

**Total Products**: 14

### Test Case 1: "blue dress" (Simple Product Search)
**Products**: 5 blue dresses

| SKU | Name | Color | Category | Price | Notes |
|-----|------|-------|----------|-------|-------|
| SKU-00001 | Nike Blue Dress | Blue | Dresses | $45.99 | Summer, Casual |
| SKU-00002 | Zara Blue Maxi Dress | Blue | Dresses | $79.99 | Summer, Elegant |
| SKU-00003 | H&M Blue A-Line Dress | Blue | Dresses | $39.99 | All-Season, Classic |
| SKU-00011 | Cobalt Blue Cocktail Dress | Blue | Dresses | $119.99 | All-Season, Outfit-ready |
| SKU-00012 | Navy Blue Outfit Dress | Blue | Dresses | $89.99 | All-Season, Versatile |

**Expected Results**: 3-5 products returned

---

### Test Case 2: "dress for wedding" (Occasion-based Search)
**Products**: 3 wedding dresses

| SKU | Name | Color | Occasion | Price | Notes |
|-----|------|-------|----------|-------|-------|
| SKU-00004 | Elegant White Wedding Dress | White | Wedding | $299.99 | Formal, Sophisticated |
| SKU-00005 | Lavender Wedding Guest Dress | Lavender | Wedding | $149.99 | Formal, Charming |
| SKU-00006 | Navy Blue Formal Dress | Navy Blue | Wedding | $199.99 | Formal, Timeless |

**Expected Results**: 3 products returned (all wedding-related)

---

### Test Case 3: "summer dress for beach wedding in July" (Multi-context Search)
**Products**: 2 beach wedding dresses

| SKU | Name | Season | Occasion | Price | Notes |
|-----|------|--------|----------|-------|-------|
| SKU-00007 | Summer Beach Wedding Dress | Summer | Wedding | $129.99 | Beach-ready, Linen |
| SKU-00008 | Floral Summer Wedding Dress | Summer | Wedding | $159.99 | Beach-ready, Cotton |

**Expected Results**: 2 products returned (summer + wedding + beach context)

---

### Test Case 4: "summer dress" (Seasonal Search)
**Products**: 5 summer dresses

| SKU | Name | Season | Price | Notes |
|-----|------|--------|-------|-------|
| SKU-00001 | Nike Blue Dress | Summer | $45.99 | Blue, Casual |
| SKU-00002 | Zara Blue Maxi Dress | Summer | $79.99 | Blue, Elegant |
| SKU-00007 | Summer Beach Wedding Dress | Summer | $129.99 | Beach, Wedding |
| SKU-00008 | Floral Summer Wedding Dress | Summer | $159.99 | Floral, Wedding |
| SKU-00009 | Yellow Summer Sundress | Summer | $49.99 | Yellow, Casual |
| SKU-00010 | Pink Summer Floral Dress | Summer | $59.99 | Pink, Floral |

**Expected Results**: 5-6 products returned (all summer-related)

---

### Test Case 5: "blue dress outfit" (Outfit/Bundling Search)
**Products**: 2 outfit-ready blue dresses

| SKU | Name | Color | Style Tags | Price | Notes |
|-----|------|-------|------------|-------|-------|
| SKU-00011 | Cobalt Blue Cocktail Dress | Blue | outfit-ready, versatile | $119.99 | Outfit-ready |
| SKU-00012 | Navy Blue Outfit Dress | Blue | outfit, coordinated | $89.99 | Outfit-ready |

**Expected Results**: 2 products returned (outfit-ready blue dresses)

---

## Search Algorithm

The mock vector search service uses **relevance scoring**:

1. **Field Matching** (weighted):
   - Name match: +0.3 points
   - Color match: +0.25 points
   - Category match: +0.2 points
   - Occasion match: +0.2 points
   - Season match: +0.15 points
   - General text match: +0.1 points

2. **Multi-term Boost**: Products matching multiple terms get 1.2x score multiplier

3. **Sorting**: Products sorted by relevance score (highest first)

4. **Filtering**: Only products with at least one match are returned

## Verification

To verify product data coverage:

```bash
# Test Case 1: "blue dress"
curl -X POST http://localhost:8082/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress", "maxResults": 10}' | \
  jq '{totalResults: .totalResults, products: [.candidates[] | {name: .metadata.name, color: .metadata.color, score: .score}]}'

# Test Case 2: "dress for wedding"
curl -X POST http://localhost:8082/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "dress for wedding", "maxResults": 10}' | \
  jq '{totalResults: .totalResults, products: [.candidates[] | {name: .metadata.name, occasion: .metadata.occasion, score: .score}]}'

# Test Case 3: "summer dress for beach wedding in July"
curl -X POST http://localhost:8082/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "summer dress for beach wedding in July", "maxResults": 10}' | \
  jq '{totalResults: .totalResults, products: [.candidates[] | {name: .metadata.name, season: .metadata.season, occasion: .metadata.occasion, score: .score}]}'

# Test Case 4: "summer dress"
curl -X POST http://localhost:8082/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "summer dress", "maxResults": 10}' | \
  jq '{totalResults: .totalResults, products: [.candidates[] | {name: .metadata.name, season: .metadata.season, score: .score}]}'

# Test Case 5: "blue dress outfit"
curl -X POST http://localhost:8082/api/v1/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "blue dress outfit", "maxResults": 10}' | \
  jq '{totalResults: .totalResults, products: [.candidates[] | {name: .metadata.name, styleTags: .metadata.style_tags, score: .score}]}'
```

## Expected Results Summary

| Test Case | Query | Expected Products | Expected Count |
|-----------|-------|-------------------|----------------|
| 1 | "blue dress" | Blue dresses | 5 |
| 2 | "dress for wedding" | Wedding dresses | 3 |
| 3 | "summer dress for beach wedding in July" | Summer + Wedding dresses | 2 |
| 4 | "summer dress" | Summer dresses | 5-6 |
| 5 | "blue dress outfit" | Outfit-ready blue dresses | 2 |

## Notes

- Products are designed to match test scenarios with relevant attributes
- Search uses relevance scoring (not random)
- Products are sorted by relevance (highest scores first)
- All products have complete metadata (color, category, occasion, season, etc.)

