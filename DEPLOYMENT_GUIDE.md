# Production Deployment Guide

## 🚀 Quick Start

### 1. Update MongoDB Connection String

Edit `.env.production` on your VPS server:

```bash
nano /path/to/backend/.env.production
```

Replace the placeholder with your actual MongoDB Atlas connection string:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
```

**If using local MongoDB on VPS**, uncomment this line instead:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
```

### 2. Deploy to VPS

```bash
# Navigate to backend directory on VPS
cd /path/to/backend

# Install dependencies
npm install --production

# Update PM2 with new environment variables
pm2 restart ecommerce-api --update-env

# Check logs
pm2 logs ecommerce-api
```

### 3. Verify Server is Running

```bash
# Check PM2 status
pm2 status

# Check if server responds
curl http://localhost:5001/api/health

# Test the Cashfree endpoint
curl -X POST http://localhost:5001/api/orders/cashfree/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100}'
```

### 4. Verify Nginx Configuration

Ensure Nginx is proxying to the correct port:

```nginx
server {
    listen 80;
    server_name api.indianhandicraftshop.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Restart Nginx:
```bash
sudo systemctl restart nginx
```

## 🔍 Troubleshooting

### MongoDB Connection Error

If you see `ECONNREFUSED 127.0.0.1:27017`:

1. **Check if MongoDB is installed locally:**
   ```bash
   systemctl status mongod
   ```

2. **If not installed, use MongoDB Atlas:**
   - Create account at https://www.mongodb.com/cloud/atlas
   - Create a cluster
   - Get connection string
   - Update `.env.production`

3. **Verify connection string:**
   ```bash
   # Test connection
   node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('Connected'); process.exit(0); }).catch(err => { console.error(err.message); process.exit(1); });"
   ```

### 404 Error on API Endpoints

If you see `Cannot POST /api/orders/cashfree/create`:

1. **Check server logs:**
   ```bash
   pm2 logs ecommerce-api --lines 100
   ```

2. **Verify routes are registered:**
   Look for this in startup logs:
   ```
   === Environment Verification ===
   NODE_ENV: production
   MONGODB_URI: Configured
   ```

3. **Test endpoint directly:**
   ```bash
   curl http://localhost:5001/api/health
   ```

### PM2 Environment Variables Not Loading

```bash
# Stop the app
pm2 stop ecommerce-api

# Delete and restart with fresh env
pm2 delete ecommerce-api
pm2 start server.js --name ecommerce-api --env production

# Or update existing
pm2 restart ecommerce-api --update-env
```

## ✅ Success Checklist

- [ ] MongoDB connection successful (check PM2 logs)
- [ ] Server starts without errors
- [ ] `/api/health` endpoint returns healthy status
- [ ] `/api/orders/cashfree/create` endpoint accessible
- [ ] Nginx proxy working correctly
- [ ] Cashfree credentials configured
- [ ] No 404 errors in logs

## 📊 Monitor Logs

```bash
# Real-time logs
pm2 logs ecommerce-api

# Error logs only
pm2 logs ecommerce-api --err

# Last 100 lines
pm2 logs ecommerce-api --lines 100

# Flush logs
pm2 flush
```

## 🔐 Security Notes

1. **Never commit `.env.production` to Git**
2. **Keep Cashfree production keys secure**
3. **Use strong JWT_SECRET**
4. **Enable firewall on VPS**
5. **Use HTTPS for all domains**

## 🔄 Update Backend

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Restart with PM2
pm2 restart ecommerce-api --update-env

# Check logs
pm2 logs ecommerce-api
```
