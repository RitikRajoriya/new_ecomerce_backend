# 🚀 Production Deployment Checklist

## ✅ All Code Fixes Applied & Pushed to Main

### Changes Made:
- ✅ **CORS Fixed** - Admin panel can now access backend APIs
- ✅ **MongoDB Connection** - Proper error handling with Atlas support
- ✅ **404 Handler** - Enhanced debugging for missing routes
- ✅ **Route Logging** - Debug logs to verify routes are registered
- ✅ **Server Startup** - Environment verification on boot

---

## 📋 VPS Deployment Steps

### Step 1: SSH to Your VPS
```bash
ssh user@your-vps-ip
```

### Step 2: Navigate to Backend Directory
```bash
cd /path/to/backend
# Common locations:
# /var/www/backend
# /home/ubuntu/backend
# ~/backend
```

### Step 3: Update MongoDB Connection String (CRITICAL)
```bash
nano .env.production
```

**Replace this line:**
```env
MONGODB_URI=mongodb+srv://your_username:your_password@your-cluster.mongodb.net/ecommerce?retryWrites=true&w=majority
```

**With your actual MongoDB Atlas connection string.**

If you don't have MongoDB Atlas:
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string from "Connect" → "Connect your application"
4. Update the `.env.production` file

### Step 4: Pull Latest Code
```bash
git pull origin main
```

### Step 5: Install Dependencies
```bash
npm install --production
```

### Step 6: Restart PM2
```bash
pm2 restart ecommerce-api --update-env
```

### Step 7: Check Logs
```bash
pm2 logs ecommerce-api --lines 50
```

---

## ✅ Verification Checklist

### 1. Check Server Startup Logs

You should see these messages in order:

```
=== Environment Verification ===
NODE_ENV: production
PORT: 5001
MONGODB_URI: Configured
JWT_SECRET: Configured
CASHFREE_ENV: production
FRONTEND_URL: https://indianhandicraftshop.com
=============================

Attempting to connect to MongoDB...
✅ MongoDB Connected: your-cluster.mongodb.net

📡 Registering API routes...
✅ Order routes registered
✅ All API routes registered

========================================
✅ Server running on port 5001
========================================
Environment: production
Cashfree ENV: production
✅ PRODUCTION MODE ACTIVE
```

### 2. Test Health Endpoint
```bash
curl http://localhost:5001/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "environment": "production"
}
```

### 3. Test Cashfree Endpoint
```bash
curl -X POST http://localhost:5001/api/orders/cashfree/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 100}'
```

**Expected:** 200 OK with payment_session_id (not 404)

### 4. Test from Admin Panel

Open browser: https://admin.indianhandicraftshop.com

- ✅ Login should work (no CORS error)
- ✅ API calls should succeed
- ✅ No "Access-Control-Allow-Origin" errors in console

### 5. Check Nginx Proxy
```bash
curl https://api.indianhandicraftshop.com/api/health
```

**Expected:** Same as localhost health check

---

## 🐛 Troubleshooting

### Issue: MongoDB Connection Error

**Error:** `ECONNREFUSED 127.0.0.1:27017`

**Fix:**
```bash
# Check if MongoDB URI is set correctly
cat .env.production | grep MONGODB_URI

# Should show Atlas connection string, NOT localhost
```

### Issue: CORS Error Still Present

**Error:** `No 'Access-Control-Allow-Origin' header`

**Fix:**
```bash
# Verify you have latest code
git log --oneline -5

# Should show commit: "Fix CORS, add route debugging..."

# If not, pull again
git pull origin main
pm2 restart ecommerce-api --update-env
```

### Issue: 404 on Cashfree Endpoint

**Error:** `Cannot POST /api/orders/cashfree/create`

**Fix:**
```bash
# Check if routes are registered
pm2 logs ecommerce-api | grep "Order routes"

# Should show: ✅ Order routes registered

# Test locally on server
curl http://localhost:5001/api/orders/cashfree/create
```

### Issue: PM2 Not Starting

**Fix:**
```bash
# Check PM2 status
pm2 list

# If errored, check logs
pm2 logs ecommerce-api --err

# Delete and restart
pm2 delete ecommerce-api
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## 📊 Monitor After Deployment

### Real-time Logs
```bash
pm2 logs ecommerce-api
```

### Error Logs Only
```bash
pm2 logs ecommerce-api --err
```

### Server Status
```bash
pm2 status
pm2 monit
```

### Test from Outside
```bash
# From your local machine
curl https://api.indianhandicraftshop.com/api/health
```

---

## 🎯 Success Criteria

- [x] MongoDB connects successfully
- [x] Server starts without errors
- [x] `/api/health` returns healthy status
- [x] Admin panel login works (no CORS)
- [x] `/api/orders/cashfree/create` returns 200 (not 404)
- [x] Nginx proxy works correctly
- [x] PM2 process is online and stable

---

## 📞 Quick Commands Reference

```bash
# View logs
pm2 logs ecommerce-api

# Restart
pm2 restart ecommerce-api --update-env

# Stop
pm2 stop ecommerce-api

# Delete and recreate
pm2 delete ecommerce-api
pm2 start ecosystem.config.js --env production

# Save PM2 state
pm2 save

# Check status
pm2 status
pm2 monit
```

---

## 🔐 Security Reminders

- ✅ Never commit `.env.production` to Git
- ✅ Keep Cashfree production keys secure
- ✅ Use strong JWT_SECRET
- ✅ Enable UFW firewall on VPS
- ✅ Use HTTPS for all domains
- ✅ Regularly update dependencies

---

**Last Updated:** April 23, 2026
**Commit:** All fixes pushed to `main` branch
