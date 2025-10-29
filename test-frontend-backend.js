// Test script to verify frontend to backend connection
const axios = require('axios');

async function testFrontendBackendConnection() {
  console.log('🧪 Testing Frontend to Backend Connection...\n');
  
  // Test 1: Check if frontend is running
  try {
    const frontendResponse = await axios.get('http://localhost:3000');
    console.log('✅ Frontend is running on port 3000');
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
    return;
  }
  
  // Test 2: Check if backend is running
  try {
    const backendResponse = await axios.get('http://localhost:8080/health');
    console.log('✅ Backend is running on port 8080');
    console.log('   Status:', backendResponse.data.status);
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
    return;
  }
  
  // Test 3: Test CORS preflight
  try {
    const corsResponse = await axios.options('http://localhost:8080/api/v1/search', {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS preflight successful');
  } catch (error) {
    console.log('⚠️  CORS preflight failed (might be normal):', error.message);
  }
  
  // Test 4: Test actual search request
  try {
    console.log('\n🔍 Testing search request...');
    const searchResponse = await axios.post('http://localhost:8080/api/v1/search', {
      query: 'blue dress',
      filters: {},
      maxResults: 10
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Search request successful!');
    console.log('   Results count:', searchResponse.data.uiResponse.results.length);
    console.log('   Success:', searchResponse.data.uiResponse.success);
    console.log('   Execution time:', searchResponse.data.uiResponse.totalExecutionTimeMs + 'ms');
    
    if (searchResponse.data.uiResponse.results.length > 0) {
      console.log('   First result:', searchResponse.data.uiResponse.results[0].name);
    }
    
  } catch (error) {
    console.log('❌ Search request failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  
  console.log('\n🎯 Frontend to Backend Connection Test Complete!');
}

testFrontendBackendConnection().catch(console.error);

