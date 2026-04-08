const http = require('http');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}`;

const routes = [
  '/api/health',
  '/api/products',
  '/api/categories',
];

console.log(`\n🔍 Testing server at ${BASE_URL}...\n`);

let passed = 0;
let failed = 0;

function testRoute(route) {
  return new Promise((resolve) => {
    const start = Date.now();
    
    http.get(`${BASE_URL}${route}`, (res) => {
      const duration = Date.now() - start;
      
      if (res.statusCode === 200 || res.statusCode === 401) {
        console.log(`✅ ${route} - ${res.statusCode} (${duration}ms)`);
        passed++;
      } else {
        console.log(`❌ ${route} - ${res.statusCode} (${duration}ms)`);
        failed++;
      }
      resolve();
    }).on('error', (err) => {
      console.log(`❌ ${route} - Connection refused`);
      failed++;
      resolve();
    });
  });
}

async function runTests() {
  for (const route of routes) {
    await testRoute(route);
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${'='.repeat(50)}\n`);

  if (failed > 0) {
    console.log('⚠️  Some routes failed. Check if server is running.\n');
    process.exit(1);
  } else {
    console.log('✅ All routes working!\n');
    process.exit(0);
  }
}

runTests();
