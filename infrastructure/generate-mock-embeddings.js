#!/usr/bin/env node
/**
 * Generate MOCK embeddings for 1000 products
 * This allows us to continue development while we fix Vertex AI integration
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BUCKET_NAME = 'future-of-search-products';
const EMBEDDING_DIMENSION = 768; // text-embedding-005 dimension

function generateMockEmbedding() {
  // Generate a random vector of the correct dimension
  const embedding = [];
  for (let i = 0; i < EMBEDDING_DIMENSION; i++) {
    embedding.push(Math.random() * 2 - 1); // Random values between -1 and 1
  }
  return embedding;
}

async function generateMockEmbeddings() {
  console.log('🚀 Starting MOCK embedding generation (for development)...');
  
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
  let totalCost = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    // Create searchable text from product attributes
    const text = `${product.name} ${product.description} ${product.category} ${product.subcategory} ${product.brand} ${product.color} ${product.material} ${product.style_tags} ${product.occasion}`.toLowerCase();
    
    // Generate mock embedding
    const embedding = generateMockEmbedding();
    
    embeddings.push({
      id: product.sku,
      embedding: embedding,
      metadata: {
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: parseFloat(product.price),
        color: product.color,
        material: product.material,
        occasion: product.occasion,
        text: text // Store the original text for reference
      }
    });

    // Simulate cost (mock)
    const mockCost = 0.0001; // $0.0001 per embedding
    totalCost += mockCost;

    if ((i + 1) % 100 === 0) {
      console.log(`✅ Processed ${i + 1}/${products.length} products...`);
    }
  }

  console.log(`\n📈 Mock embedding generation complete!`);
  console.log(`💰 Simulated cost: $${totalCost.toFixed(4)}`);
  console.log(`📊 Generated ${embeddings.length} mock embeddings`);

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

  // Upload to Cloud Storage
  try {
    console.log(`\n☁️  Uploading to Cloud Storage...`);
    const { Storage } = require('@google-cloud/storage');
    const storage = new Storage({ projectId: 'future-of-search' });
    
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
    console.log(`⚠️  Cloud Storage upload failed: ${error.message}`);
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
  generateMockEmbeddings()
    .then(result => {
      console.log(`\n🎉 SUCCESS! Generated ${result.embeddings.length} MOCK embeddings for $${result.totalCost.toFixed(4)}`);
      console.log(`📁 Files created:`);
      console.log(`   - ${result.filePaths.embeddings}`);
      console.log(`   - ${result.filePaths.matchingEngine}`);
      console.log(`\n⚠️  NOTE: These are MOCK embeddings for development.`);
      console.log(`   Replace with real Vertex AI embeddings when API is fixed.`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ FAILED:`, error);
      process.exit(1);
    });
}

module.exports = { generateMockEmbeddings };

