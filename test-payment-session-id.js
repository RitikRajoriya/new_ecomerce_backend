// Test script to verify Cashfree payment_session_id is returned correctly
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001';

async function testCashfreeOrderCreation() {
  console.log('=== Testing Cashfree Order Creation ===\n');

  try {
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'user@example.com',
      password: 'user123',
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Step 2: Create Cashfree order
    console.log('Step 2: Creating Cashfree order...');
    const orderResponse = await axios.post(
      `${API_BASE_URL}/api/orders/cashfree/create`,
      { amount: 100 },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('\n=== API Response ===');
    console.log('Status:', orderResponse.status);
    console.log('Response Data:', JSON.stringify(orderResponse.data, null, 2));
    console.log('====================\n');

    // Step 3: Validate response structure
    const data = orderResponse.data;

    console.log('=== Validation ===');
    
    if (!data.success) {
      console.error('❌ FAIL: success is not true');
      return;
    }
    console.log('✅ success: true');

    if (!data.order_id) {
      console.error('❌ FAIL: order_id is missing');
      return;
    }
    console.log('✅ order_id:', data.order_id);

    if (!data.payment_session_id) {
      console.error('❌ FAIL: payment_session_id is missing');
      console.error('This is the critical field needed for checkout!');
      return;
    }
    console.log('✅ payment_session_id:', data.payment_session_id);

    if (!data.order_amount) {
      console.error('❌ FAIL: order_amount is missing');
      return;
    }
    console.log('✅ order_amount:', data.order_amount);

    console.log('\n✅ ALL VALIDATIONS PASSED!');
    console.log('\nThe backend is correctly returning payment_session_id at root level.');
    console.log('Frontend should now be able to use this to open Cashfree checkout.\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
  }
}

// Run test
testCashfreeOrderCreation();
