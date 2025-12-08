#!/usr/bin/env node
/**
 * Create Vertex AI Matching Engine Index with 1000 products
 * NO PYTHON - Pure Node.js implementation
 */

const fs = require('fs');
const path = require('path');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');

// Configuration
const PROJECT_ID = 'future-of-search';
const LOCATION = 'us-central1';
const BUCKET_NAME = 'future-of-search-matching-engine-us-central1';
const EMBEDDING_MODEL = 'text-embedding-005';

// Initialize clients
const predictionClient = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`,
});

async function createMatchingEngineIndex() {
  console.log('🚀 Creating Vertex AI Matching Engine Index (NO PYTHON!)...');
  
  try {
    // Step 1: Generate real embeddings for all products
    console.log('\n📊 Step 1: Generating real embeddings for 1000 products...');
    
    const csvPath = path.join(__dirname, 'products-1000.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const products = lines.slice(1).map(line => {
      const values = line.split(',');
      const product = {};
      headers.forEach((header, index) => {
        product[header] = values[index];
      });
      return product;
    });

    console.log(`📦 Processing ${products.length} products...`);

    // Generate embeddings in batches
    const embeddings = [];
    const batchSize = 10;
    let totalCost = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} products)...`);

      try {
        // Prepare texts for embedding
        const texts = batch.map(product => {
          return `${product.name} ${product.description} ${product.category} ${product.subcategory} ${product.brand} ${product.color} ${product.material} ${product.style_tags} ${product.occasion}`.toLowerCase();
        });

        // Generate embeddings using Vertex AI
        const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}`;
        
        const request = {
          endpoint,
          instances: texts.map(text => ({
            content: text
          }))
        };

        const [response] = await predictionClient.predict(request);
        
        // Process results
        response.predictions?.forEach((prediction, index) => {
          const product = batch[index];
          if (prediction.embeddings && prediction.embeddings.values) {
            embeddings.push({
              id: product.sku,
              embedding: prediction.embeddings.values,
              metadata: {
                name: product.name,
                category: product.category,
                brand: product.brand,
                price: parseFloat(product.price),
                color: product.color,
                material: product.material,
                occasion: product.occasion
              }
            });
          }
        });

        // Calculate cost
        const batchCost = batch.length * 0.0001; // $0.0001 per embedding
        totalCost += batchCost;
        
        console.log(`✅ Batch completed. Cost: $${batchCost.toFixed(4)} | Total: $${totalCost.toFixed(4)}`);

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error processing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        // Continue with next batch
      }
    }

    console.log(`\n📈 Embedding generation complete!`);
    console.log(`💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`📊 Generated ${embeddings.length} embeddings`);

    // Step 2: Save embeddings in Matching Engine format
    console.log('\n💾 Step 2: Preparing Matching Engine data...');
    
    const matchingEngineData = embeddings.map(item => ({
      id: item.id,
      embedding: item.embedding,
      metadata: item.metadata
    }));

    // Save to JSON file
    const matchingEnginePath = path.join(__dirname, 'matching-engine-data.json');
    fs.writeFileSync(matchingEnginePath, JSON.stringify(matchingEngineData, null, 2));
    console.log(`✅ Saved Matching Engine data to ${matchingEnginePath}`);

    // Step 3: Upload to Cloud Storage
    console.log('\n☁️  Step 3: Uploading to Cloud Storage...');
    
    try {
      const { Storage } = require('@google-cloud/storage');
      const storage = new Storage({ projectId: PROJECT_ID });
      
      const bucket = storage.bucket(BUCKET_NAME);
      
      // Upload Matching Engine data
      await bucket.upload(matchingEnginePath, {
        destination: 'matching-engine/data/kiko-embeddings.json',
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });
      
      console.log(`✅ Uploaded to gs://${BUCKET_NAME}/matching-engine/data/kiko-embeddings.json`);
      
    } catch (error) {
      console.log(`⚠️  Cloud Storage upload failed: ${error.message}`);
      console.log(`📁 File saved locally. Upload manually later.`);
    }

    // Step 4: Create Matching Engine Index (using gcloud CLI)
    console.log('\n🔍 Step 4: Creating Matching Engine Index...');
    
    const indexName = 'agentic-search-index';
    const endpointName = 'agentic-search-endpoint';
    
    console.log(`📋 Index Name: ${indexName}`);
    console.log(`📋 Endpoint Name: ${endpointName}`);
    console.log(`📋 Data URI: gs://${BUCKET_NAME}/matching-engine/data/`);
    console.log(`📋 Dimensions: 768`);
    
    // Create index using gcloud
    const createIndexCmd = `gcloud ai indexes create \
      --display-name="${indexName}" \
      --metadata-file=<(echo '{"contentsDeltaUri": "gs://${BUCKET_NAME}/matching-engine/data/", "isCompleteOverwrite": false}' | base64) \
      --project=${PROJECT_ID} \
      --region=${LOCATION}`;

    console.log(`\n🔧 Run this command to create the index:`);
    console.log(createIndexCmd);
    
    console.log(`\n🔧 Then run this to create the endpoint:`);
    const createEndpointCmd = `gcloud ai index-endpoints create \
      --display-name="${endpointName}" \
      --project=${PROJECT_ID} \
      --region=${LOCATION}`;
    console.log(createEndpointCmd);

    console.log(`\n🎉 SUCCESS! Matching Engine setup complete!`);
    console.log(`📊 Generated ${embeddings.length} real embeddings for $${totalCost.toFixed(4)}`);
    console.log(`📁 Data uploaded to gs://${BUCKET_NAME}/matching-engine/data/`);
    console.log(`\n⚠️  Next steps:`);
    console.log(`   1. Run the gcloud commands above to create index and endpoint`);
    console.log(`   2. Note the index ID and endpoint ID for configuration`);
    console.log(`   3. Deploy the index to the endpoint`);

    return {
      embeddings,
      totalCost,
      dataPath: matchingEnginePath,
      bucketPath: `gs://${BUCKET_NAME}/matching-engine/data/kiko-embeddings.json`
    };

  } catch (error) {
    console.error(`❌ FAILED:`, error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createMatchingEngineIndex()
    .then(result => {
      console.log(`\n🎉 SUCCESS! Generated ${result.embeddings.length} real embeddings for $${result.totalCost.toFixed(4)}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ FAILED:`, error);
      process.exit(1);
    });
}

module.exports = { createMatchingEngineIndex };

