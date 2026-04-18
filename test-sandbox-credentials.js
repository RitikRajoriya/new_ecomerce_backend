// Test Cashfree Sandbox Credentials
const axios = require('axios');

// Load environment variables
require('dotenv').config();

console.log('Testing Cashfree Sandbox Credentials...\n');
console.log('Environment:', process.env.CASHFREE_ENV);
console.log('App ID:', process.env.CASHFREE_SANDBOX_APP_ID);
console.log('Secret Key:', process.env.CASHFREE_SANDBOX_SECRET_KEY?.substring(0, 15) + '***\n');

const testCashfreeSandbox = async () => {
  try {
    const orderData = {
      order_id: `TEST_SANDBOX_${Date.now()}`,
      order_amount: 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'test_user',
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: 'http://localhost:5175/orders?order_id={order_id}',
      },
    };

    console.log('Sending test request to Cashfree Sandbox...');
    console.log('URL: https://sandbox.cashfree.com/pg/orders\n');

    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': process.env.CASHFREE_SANDBOX_APP_ID,
          'x-client-secret': process.env.CASHFREE_SANDBOX_SECRET_KEY,
          'x-api-version': '2023-08-01',
        },
      }
    );

    console.log('✅ SUCCESS! Sandbox credentials are working!\n');
    console.log('Response:');
    console.log('- Order ID:', response.data.order_id);
    console.log('- Amount:', response.data.order_amount);
    console.log('- Payment Session ID:', response.data.payment_session_id);
    console.log('- Order Status:', response.data.order_status);

  } catch (error) {
    console.error('❌ FAILED! Sandbox credentials test failed.\n');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', error.response?.data);
    console.error('Message:', error.message);
  }
};

testCashfreeSandbox();
