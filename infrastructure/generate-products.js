#!/usr/bin/env node
/**
 * Generate 1000-product CSV dataset for Agentic Search
 * NO PYTHON - Pure Node.js implementation
 */

const fs = require('fs');
const path = require('path');

// Product data templates
const brands = ['Zara', 'H&M', 'Nike', 'Adidas', 'Levi\'s', 'Gap', 'Uniqlo', 'Mango', 'Forever 21', 'Pull&Bear'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Gray', 'Brown', 'Navy', 'Beige', 'Olive', 'Burgundy', 'Cream'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const materials = ['Cotton', 'Polyester', 'Denim', 'Silk', 'Wool', 'Linen', 'Leather', 'Synthetic', 'Blend'];
const seasons = ['Spring', 'Summer', 'Fall', 'Winter', 'All-Season'];
const genders = ['Men', 'Women', 'Unisex'];
const occasions = ['Casual', 'Formal', 'Party', 'Office', 'Sports', 'Travel', 'Wedding'];
const stockStatuses = ['In Stock', 'Low Stock', 'Out of Stock'];

const categories = {
  'Tops': ['T-Shirt', 'Shirt', 'Blouse', 'Tank Top', 'Polo', 'Sweater', 'Hoodie', 'Cardigan'],
  'Bottoms': ['Jeans', 'Pants', 'Shorts', 'Skirt', 'Leggings', 'Chinos', 'Trousers'],
  'Dresses': ['Maxi Dress', 'Mini Dress', 'Midi Dress', 'Cocktail Dress', 'Evening Gown'],
  'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Windbreaker', 'Parka', 'Bomber'],
  'Footwear': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Loafers', 'Flats'],
  'Accessories': ['Belt', 'Hat', 'Scarf', 'Bag', 'Sunglasses', 'Watch']
};

const styleTags = {
  'Tops': ['casual', 'streetwear', 'minimalist', 'vintage', 'modern'],
  'Bottoms': ['slim-fit', 'relaxed', 'high-waist', 'distressed', 'classic'],
  'Dresses': ['elegant', 'bohemian', 'romantic', 'chic', 'sophisticated'],
  'Outerwear': ['urban', 'sporty', 'classic', 'trendy', 'oversized'],
  'Footwear': ['athletic', 'elegant', 'casual', 'comfortable', 'statement'],
  'Accessories': ['minimalist', 'statement', 'classic', 'trendy', 'functional']
};

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateProduct(index) {
  const category = random(Object.keys(categories));
  const subcategory = random(categories[category]);
  const brand = random(brands);
  const color = random(colors);
  const size = random(sizes);
  const material = random(materials);
  const season = random(seasons);
  const gender = random(genders);
  const occasion = random(occasions);
  const tags = styleTags[category];
  const styleTag = tags ? random(tags) : 'classic';

  const name = `${brand} ${color} ${subcategory}`;
  const description = `${season} ${subcategory} for ${gender.toLowerCase()}. ${material} material with ${styleTag} style. Perfect for ${occasion.toLowerCase()} occasions.`;
  
  const basePriceMap = {
    'Tops': [20, 80],
    'Bottoms': [30, 120],
    'Dresses': [40, 200],
    'Outerwear': [60, 300],
    'Footwear': [40, 150],
    'Accessories': [15, 100]
  };
  const basePrice = basePriceMap[category] || [20, 100];

  const price = randomFloat(basePrice[0], basePrice[1]);
  const rating = randomFloat(3.0, 5.0, 1);
  const popularityScore = randomInt(1, 100);
  const stockStatus = random(stockStatuses);

  return {
    sku: `SKU-${String(index).padStart(5, '0')}`,
    name,
    description,
    price,
    currency: 'USD',
    category,
    subcategory,
    brand,
    color,
    size,
    material,
    style_tags: styleTag,
    season,
    gender,
    occasion,
    image_url: `https://placeholder.com/products/${category.toLowerCase()}-${index}.jpg`,
    stock_status: stockStatus,
    rating,
    popularity_score: popularityScore
  };
}

function generateCSV(count) {
  const products = [];
  
  for (let i = 1; i <= count; i++) {
    products.push(generateProduct(i));
  }

  // CSV header
  const headers = Object.keys(products[0]).join(',');
  
  // CSV rows
  const rows = products.map(p => 
    Object.values(p).map(v => 
      typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

// Main execution
const OUTPUT_FILE = path.join(__dirname, 'products-1000.csv');
const PRODUCT_COUNT = 1000;

console.log(`🚀 Generating ${PRODUCT_COUNT} products (NO PYTHON!)...`);
const csv = generateCSV(PRODUCT_COUNT);

fs.writeFileSync(OUTPUT_FILE, csv);
console.log(`✅ Generated ${OUTPUT_FILE}`);
console.log(`📊 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
console.log(`\nSample products:`);
console.log(csv.split('\n').slice(0, 4).join('\n'));


