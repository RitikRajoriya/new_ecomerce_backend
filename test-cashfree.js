// Test Cashfree API connection
require('dotenv').config();
const axios = require('axios');

console.log('Testing Cashfree API...');
console.log('App ID:', process.env.CASHFREE_APP_ID);
console.log('Secret Key:', process.env.CASHFREE_SECRET_KEY ? '***' + process.env.CASHFREE_SECRET_KEY.slice(-10) : 'MISSING');
console.log('Mode:', process.env.CASHFREE_MODE);

const baseUrl = process.env.CASHFREE_MODE === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

console.log('Base URL:', baseUrl);

// Test creating an order
const testOrder = async () => {
  try {
    const orderData = {
      order_id: `TEST_${Date.now()}`,
      order_amount: 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: 'test_user',
        customer_phone: '9999999999',
      },
      order_meta: {
        return_url: `https://indianhandicraftshop.com/orders?order_id={order_id}`,
      },
    };

    console.log('\nSending request to Cashfree...');
    console.log('Order data:', JSON.stringify(orderData, null, 2));

    const response = await axios.post(`${baseUrl}/orders`, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2023-08-01',
      },
    });

    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log('Status:', error.response?.status);
    console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error message:', error.message);
  }
};

testOrder();
