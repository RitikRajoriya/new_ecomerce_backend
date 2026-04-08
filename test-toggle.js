// Quick test script for toggle visibility
const axios = require('axios');

const BASE_URL = 'http://localhost:5001';
const TEST_ID = '69cd30b430e364c0357af1a6'; // Replace with actual newsletter ID
const TOKEN = 'YOUR_ADMIN_TOKEN_HERE'; // Replace with actual token

async function testToggle() {
  try {
    console.log('Testing toggle visibility...\n');
    
    const response = await axios.patch(
      `${BASE_URL}/api/newsletters/${TEST_ID}/toggle-visibility`,
      { visible: undefined }, // Toggle current value
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Success!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testToggle();
