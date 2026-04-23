#!/bin/bash

# Production Deployment Script for Backend
# Usage: ./deploy.sh

echo "🚀 Starting Backend Deployment..."

# Step 1: Check if on main branch
echo "📌 Checking git branch..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Not on main branch. Current: $BRANCH"
    echo "Please switch to main branch first:"
    echo "   git checkout main"
    exit 1
fi

# Step 2: Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Step 3: Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Step 4: Verify .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found!"
    echo "Please create it with your MongoDB Atlas connection string"
    exit 1
fi

# Step 5: Check MongoDB URI
echo "🔍 Checking MongoDB configuration..."
if grep -q "your_username:your_password" .env.production; then
    echo "⚠️  WARNING: MongoDB URI still has placeholder values!"
    echo "Please update .env.production with your actual MongoDB Atlas connection string"
    echo ""
    echo "Format: mongodb+srv://<username>:<password>@cluster.mongodb.net/ecommerce"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 6: Create logs directory if not exists
mkdir -p logs

# Step 7: Restart PM2
echo "🔄 Restarting PM2..."
if pm2 list | grep -q "ecommerce-api"; then
    echo "♻️  Restarting existing app..."
    pm2 restart ecommerce-api --update-env
else
    echo "🆕 Starting new app with PM2..."
    pm2 start ecosystem.config.js --env production
fi

# Step 8: Save PM2 configuration
pm2 save

# Step 9: Check status
echo ""
echo "📊 PM2 Status:"
pm2 status

# Step 10: Show recent logs
echo ""
echo "📋 Recent Logs (last 20 lines):"
pm2 logs ecommerce-api --lines 20 --nostream

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check logs: pm2 logs ecommerce-api"
echo "2. Test health: curl http://localhost:5001/api/health"
echo "3. Monitor: pm2 monit"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for troubleshooting"
