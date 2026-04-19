# ✅ Fix 404 Error: Cashfree Order Creation API

## 🎯 Problem

**Error:**
```
POST https://api.indianhandicraftshop.com/api/orders/cashfree/create 404 (Not Found)
```

**Cause:** Production server is running outdated backend code.

---

## ✅ Local Verification (Code is Correct)

### 1. ✅ Route Exists in `orderRoutes.js`
**File:** `routes/orderRoutes.js` (Line 14)
```javascript
router.post('/cashfree/create', authMiddleware, orderController.createCashfreeOrder);
```

### 2. ✅ Route Mounted in `server.js`
**File:** `server.js` (Line 151)
```javascript
app.use('/api/orders', orderRoutes);
```

### 3. ✅ Controller Function Exists
**File:** `controller/orderController.js` (Line 515)
```javascript
exports.createCashfreeOrder = async (req, res) => {
  // Implementation present
}
```

### 4. ✅ Full Route Path
```
/api/orders + /cashfree/create = /api/orders/cashfree/create ✅
```

---

## 🔧 Solution: Deploy Latest Code to Production

The issue is that **GitHub Actions pushed the code**, but the **server needs to pull and restart**.

### Option 1: Automatic Deployment (If GitHub Actions Working)

If you've set up GitHub Secrets correctly, the deployment should happen automatically:

1. **Check GitHub Actions:**
   - Go to: https://github.com/RitikRajoriya/new_ecomerce_backend/actions
   - Look for latest workflow run
   - Should show: ✅ Success

2. **Verify on Server:**
   ```bash
   ssh user@your-server
   cd /var/www/backend
   pm2 logs ecommerce-api --lines 50
   ```

### Option 2: Manual Deployment (Immediate Fix)

SSH into your server and run:

```bash
# 1. SSH to server
ssh user@your-server

# 2. Go to backend directory
cd /var/www/backend

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm install --production

# 5. Create/Update .env file (if not exists)
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://indianhandicraftshop.com
ADMIN_URL=https://admin.indianhandicraftshop.com
API_BASE_URL=https://api.indianhandicraftshop.com
CASHFREE_ENV=production
CASHFREE_PROD_APP_ID=YOUR_CASHFREE_APP_ID
CASHFREE_PROD_SECRET_KEY=YOUR_CASHFREE_SECRET_KEY
EOF

# 6. Restart PM2
pm2 restart ecommerce-api

# 7. Check logs
pm2 logs ecommerce-api --lines 50
```

---

## 🔍 Verification Steps

### Step 1: Check PM2 Status
```bash
ssh user@your-server
pm2 list
```

**Expected Output:**
```
┌────┬─────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id │ name            │ mode        │ status  │ cpu     │ memory   │
├────┼─────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0  │ ecommerce-api   │ fork        │ online  │ 0%      │ 85.2mb   │
└────┴─────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### Step 2: Check Logs for Production Mode
```bash
pm2 logs ecommerce-api --lines 50
```

**Expected Output:**
```
========================================
Server running on port 5001
========================================
Environment: production
Cashfree ENV: production
✅ PRODUCTION MODE ACTIVE
Cashfree App ID: Configured
Payment Endpoint: https://api.cashfree.com/pg/orders
```

### Step 3: Test API Health
```bash
curl https://api.indianhandicraftshop.com/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "environment": "production"
}
```

### Step 4: Test Orders Endpoint
```bash
curl https://api.indianhandicraftshop.com/api/orders
```

**Expected:** Should NOT return 404 (might require auth)

### Step 5: Test Cashfree Route (With Auth)
```bash
# Get auth token first
TOKEN="your_auth_token"

# Test cashfree endpoint
curl -X POST https://api.indianhandicraftshop.com/api/orders/cashfree/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

**Expected Response:**
```json
{
  "success": true,
  "payment_session_id": "session_xxxxx",
  "order_id": "order_xxxxx"
}
```

---

## 🔧 Nginx Configuration Check

If API still returns 404 after deployment, check Nginx config:

### 1. Check Nginx Config
```bash
ssh user@your-server
sudo nano /etc/nginx/sites-available/indianhandicraftshop.com
```

### 2. Verify API Location Block
Should contain:
```nginx
# API Backend
location /api/ {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # CORS headers
    add_header Access-Control-Allow-Origin https://indianhandicraftshop.com;
    add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type, Authorization';
    
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

### 3. Test Nginx Config
```bash
sudo nginx -t
```

### 4. Reload Nginx (if changed)
```bash
sudo systemctl reload nginx
```

---

## 🐛 Troubleshooting

### Issue 1: Still Getting 404 After Deployment

**Check 1: Verify Route Exists**
```bash
cd /var/www/backend
grep -n "cashfree/create" routes/orderRoutes.js
```

**Should show:**
```
14:router.post('/cashfree/create', authMiddleware, orderController.createCashfreeOrder);
```

**Check 2: Verify server.js Mounts Route**
```bash
grep -n "orderRoutes" server.js
```

**Should show:**
```
151:app.use('/api/orders', orderRoutes);
```

**Check 3: Check PM2 Logs**
```bash
pm2 logs ecommerce-api --lines 100
# Look for any startup errors
```

---

### Issue 2: PM2 Shows "Errored" Status

**Solution:**
```bash
# Stop existing process
pm2 stop ecommerce-api
pm2 delete ecommerce-api

# Check .env exists
cat .env

# Manual start
pm2 start server.js --name ecommerce-api

# Check logs
pm2 logs ecommerce-api --lines 50
```

---

### Issue 3: Port Already in Use

**Solution:**
```bash
# Find process using port 5001
lsof -i :5001

# Kill it
kill -9 <PID>

# Restart PM2
pm2 restart ecommerce-api
```

---

### Issue 4: Missing .env File

**Solution:**
```bash
cd /var/www/backend

# Create .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://indianhandicraftshop.com
CASHFREE_ENV=production
CASHFREE_PROD_APP_ID=YOUR_CASHFREE_APP_ID
CASHFREE_PROD_SECRET_KEY=YOUR_CASHFREE_SECRET_KEY
EOF

# Restart
pm2 restart ecommerce-api
```

---

### Issue 5: Git Pull Fails

**Solution:**
```bash
cd /var/www/backend

# Reset any local changes
git reset --hard origin/main

# Clean untracked files
git clean -fd

# Pull latest
git pull origin main

# Restart
pm2 restart ecommerce-api
```

---

## 📋 Complete Deployment Checklist

Run through this checklist:

- [ ] SSH to server
- [ ] Navigate to `/var/www/backend`
- [ ] Pull latest code: `git pull origin main`
- [ ] Install dependencies: `npm install --production`
- [ ] Verify .env exists with production credentials
- [ ] Restart PM2: `pm2 restart ecommerce-api`
- [ ] Check PM2 status: `pm2 list`
- [ ] Check logs: `pm2 logs ecommerce-api --lines 50`
- [ ] Verify production mode active in logs
- [ ] Test health endpoint
- [ ] Test cashfree endpoint
- [ ] Test payment flow on website

---

## 🎯 Quick Fix Command

**One-line fix (copy-paste to server):**

```bash
cd /var/www/backend && git pull origin main && npm install --production && pm2 restart ecommerce-api && pm2 logs ecommerce-api --lines 50
```

---

## ✅ Expected Result

After deployment, this should work:

**Request:**
```
POST https://api.indianhandicraftshop.com/api/orders/cashfree/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderAmount": 100
}
```

**Response:**
```json
{
  "success": true,
  "order_id": "order_xxxxx",
  "payment_session_id": "session_xxxxx",
  "order_amount": 100,
  "order_currency": "INR"
}
```

---

## 📊 Summary

| Check | Status |
|-------|--------|
| **Route exists locally** | ✅ Yes |
| **Route mounted in server.js** | ✅ Yes |
| **Controller function exists** | ✅ Yes |
| **Code pushed to GitHub** | ✅ Yes |
| **Code deployed to server** | ⏳ **REQUIRED** |
| **PM2 restarted** | ⏳ **REQUIRED** |

---

**Status:** 📝 **DEPLOYMENT REQUIRED**  
**Next Step:** Pull latest code on server and restart PM2  
**ETA:** 2-3 minutes  

**Last Updated:** April 18, 2026
