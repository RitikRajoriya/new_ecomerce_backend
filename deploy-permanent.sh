#!/bin/bash

echo "========================================="
echo "🚀 Deploying Backend Updates"
echo "========================================="

# Navigate to backend directory
cd /var/www/backend

# Step 1: Backup current .env (just in case)
echo "📦 Backing up current .env file..."
if [ -f .env ]; then
    cp .env /var/www/.env.backup
fi

# Step 2: Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# Step 3: Restore .env from PERMANENT backup (CRITICAL!)
echo "🔒 Restoring .env from permanent backup..."
if [ -f /var/www/.env.permanent ]; then
    cp /var/www/.env.permanent .env
    echo "✅ .env restored from permanent backup"
else
    echo "❌ ERROR: Permanent .env backup not found at /var/www/.env.permanent"
    echo "Please create it first: cp .env /var/www/.env.permanent"
    exit 1
fi

# Step 4: Install dependencies if needed
if [ -f package.json ]; then
    echo "📦 Checking dependencies..."
    npm install --production
fi

# Step 5: Restart PM2
echo "🔄 Restarting server..."
sudo /usr/local/bin/pm2 restart ecommerce-api --update-env

# Step 6: Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Step 7: Health check
echo "🔍 Running health check..."
HEALTH=$(curl -s http://localhost:5001/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Server is healthy and running!"
    echo "$HEALTH"
else
    echo "❌ Server health check failed!"
    echo "Response: $HEALTH"
    echo "Check logs: pm2 logs ecommerce-api --lines 50"
    exit 1
fi

# Step 8: Save PM2 process list
sudo /usr/local/bin/pm2 save

echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Server Status: Running"
echo "Health Check: http://localhost:5001/api/health"
echo "API URL: https://api.indianhandicraftshop.com"
echo ""
echo "Webhook URL (for Cashfree):"
echo "https://api.indianhandicraftshop.com/api/orders/cashfree/webhook"
echo ""
