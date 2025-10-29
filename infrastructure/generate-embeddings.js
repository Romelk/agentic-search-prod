#!/usr/bin/env node
/**
 * Generate embeddings for 1000 products using Vertex AI
 * NO PYTHON - Pure Node.js implementation
 */

const fs = require('fs');
const path = require('path');
const { PredictionServiceClient } = require('@google-cloud/aiplatform').v1;

// Configuration
const PROJECT_ID = 'future-of-search';
const LOCATION = 'us-central1';
const BUCKET_NAME = 'future-of-search-products';
const EMBEDDING_MODEL = 'text-embedding-005';

// Initialize Vertex AI client
const client = new PredictionServiceClient();

async function generateEmbeddings() {
  console.log('🚀 Starting embedding generation (NO PYTHON!)...');
  
  // Read the CSV file
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

  console.log(`📊 Processing ${products.length} products...`);

  const embeddings = [];
  const batchSize = 10; // Process in batches to avoid rate limits
  let totalCost = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${batch.length} products)...`);

    try {
      // Prepare texts for embedding
      const texts = batch.map(product => {
        // Create searchable text from product attributes
        return `${product.name} ${product.description} ${product.category} ${product.subcategory} ${product.brand} ${product.color} ${product.material} ${product.style_tags} ${product.occasion}`.toLowerCase();
      });

      // Generate embeddings for the batch using Vertex AI
      const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}`;
      
      const instances = texts.map(text => ({
        content: text
      }));
      
      const request = {
        endpoint,
        instances,
      };
      
      const [response] = await client.predict(request);
      const batchEmbeddings = response.predictions.map(prediction => ({
        values: prediction.embeddings.values
      }));
      
      // Process results
      batchEmbeddings.forEach((embedding, index) => {
        const product = batch[index];
        embeddings.push({
          id: product.sku,
          embedding: embedding.values,
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
      });

      // Calculate cost for this batch
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

  // Save embeddings to JSON file
  const embeddingsPath = path.join(__dirname, 'embeddings.json');
  fs.writeFileSync(embeddingsPath, JSON.stringify(embeddings, null, 2));
  console.log(`💾 Saved embeddings to ${embeddingsPath}`);

  // Create Matching Engine format
  const matchingEngineData = embeddings.map(item => ({
    id: item.id,
    embedding: item.embedding,
    metadata: item.metadata
  }));

  const matchingEnginePath = path.join(__dirname, 'matching-engine-data.json');
  fs.writeFileSync(matchingEnginePath, JSON.stringify(matchingEngineData, null, 2));
  console.log(`🔍 Saved Matching Engine data to ${matchingEnginePath}`);

  // Upload to Cloud Storage (if bucket exists)
  try {
    console.log(`\n☁️  Uploading to Cloud Storage...`);
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage({ projectId: PROJECT_ID });
    
    const bucket = storage.bucket(BUCKET_NAME);
    
    // Upload embeddings
    await bucket.upload(embeddingsPath, {
      destination: 'embeddings/embeddings.json',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    // Upload Matching Engine data
    await bucket.upload(matchingEnginePath, {
      destination: 'embeddings/matching-engine-data.json',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    console.log(`✅ Uploaded to gs://${BUCKET_NAME}/embeddings/`);
    
  } catch (error) {
    console.log(`⚠️  Cloud Storage upload failed (bucket may not exist yet): ${error.message}`);
    console.log(`📁 Files saved locally. Upload manually later.`);
  }

  return {
    embeddings,
    totalCost,
    filePaths: {
      embeddings: embeddingsPath,
      matchingEngine: matchingEnginePath
    }
  };
}

// Run the script
if (require.main === module) {
  generateEmbeddings()
    .then(result => {
      console.log(`\n🎉 SUCCESS! Generated ${result.embeddings.length} embeddings for $${result.totalCost.toFixed(4)}`);
      console.log(`📁 Files created:`);
      console.log(`   - ${result.filePaths.embeddings}`);
      console.log(`   - ${result.filePaths.matchingEngine}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ FAILED:`, error);
      process.exit(1);
    });
}

module.exports = { generateEmbeddings };
