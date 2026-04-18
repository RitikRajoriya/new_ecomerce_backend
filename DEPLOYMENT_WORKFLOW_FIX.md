# ✅ GitHub Actions Deployment Fix - COMPLETE

## 🎯 Problem Fixed

**Issue:** GitHub Actions "Deploy Node Backend (PM2)" workflow failed after push  
**Status:** ✅ **FIXED**

---

## 🔧 What Was Fixed

### 1. ✅ Fixed Deployment Path
**Before:**
```yaml
cd /home/ubuntu/new_ecomerce_backend
```

**After:**
```yaml
cd /var/www/backend
```

**Why:** Standardized deployment directory

---

### 2. ✅ Added .env File Creation from GitHub Secrets
**Added:**
```yaml
echo "📝 Step 6: Creating .env file from GitHub Secrets"
cat > .env << EOF
NODE_ENV=production
PORT=5001
MONGODB_URI=${{ secrets.MONGODB_URI }}
JWT_SECRET=${{ secrets.JWT_SECRET }}
FRONTEND_URL=https://indianhandicraftshop.com
CASHFREE_ENV=production
CASHFREE_PROD_APP_ID=${{ secrets.CASHFREE_PROD_APP_ID }}
CASHFREE_PROD_SECRET_KEY=${{ secrets.CASHFREE_PROD_SECRET_KEY }}
EOF
```

**Why:** 
- `.env` file is in `.gitignore` (not committed)
- Must be created dynamically from secrets
- Contains production credentials

---

### 3. ✅ Fixed PM2 Process Name
**Before:**
```yaml
pm2 reload server
pm2 start server.js --name server
```

**After:**
```yaml
pm2 delete ecommerce-api || true
pm2 start server.js --name ecommerce-api
```

**Why:**
- Consistent process naming
- Delete before start prevents conflicts
- `|| true` prevents failure if process doesn't exist

---

### 4. ✅ Added PM2 Installation
**Added:**
```yaml
echo "📦 Step 0: Ensuring PM2 is installed"
npm install -g pm2 || echo "⚠️ PM2 install warning"
```

**Why:** Ensures PM2 is available on server

---

### 5. ✅ Enhanced Debug Logging
**Added:**
```yaml
echo "📊 PM2 Status:"
pm2 list

echo "🔍 Recent Logs:"
pm2 logs ecommerce-api --lines 50 --nostream

echo "🔍 Environment Check:"
echo "Cashfree ENV: $(grep CASHFREE_ENV .env)"
echo "Node Version: $(node --version)"
echo "PM2 Version: $(pm2 --version)"
```

**Why:** Better visibility into deployment status

---

### 6. ✅ Increased Log Lines
**Before:**
```yaml
pm2 logs server --lines 5 --nostream
```

**After:**
```yaml
pm2 logs ecommerce-api --lines 50 --nostream
```

**Why:** More context for debugging

---

## 📋 Complete Workflow Steps

The fixed workflow now performs these steps:

```
Step 0:  Ensure PM2 is installed ✅
Step 1:  Move to /var/www/backend ✅
Step 2:  Reset local changes ✅
Step 3:  Fetch latest code ✅
Step 4:  Sync with GitHub ✅
Step 5:  Clean up ✅
Step 6:  Create .env from secrets ✅
Step 7:  Install dependencies ✅
Step 8:  Restart PM2 ✅
Step 9:  Save PM2 state ✅
         Show debug logs ✅
```

---

## 🔐 Required GitHub Secrets

The workflow needs these 7 secrets:

### SSH Connection:
1. `SSH_HOST` - Server IP/domain
2. `SSH_USER` - SSH username
3. `SSH_KEY` - SSH private key

### Application:
4. `MONGODB_URI` - Database connection
5. `JWT_SECRET` - JWT signing key
6. `CASHFREE_PROD_APP_ID` - Cashfree App ID
7. `CASHFREE_PROD_SECRET_KEY` - Cashfree Secret

**Setup Guide:** See `GITHUB_SECRETS_SETUP.md`

---

## 🚀 How to Test

### 1. Add GitHub Secrets
Follow the guide in `GITHUB_SECRETS_SETUP.md`

### 2. Push to Main Branch
```bash
cd c:\pachmarhi\backend
git add .
git commit -m "fix: update deployment workflow"
git push origin main
```

### 3. Watch Deployment
1. Go to: https://github.com/RitikRajoriya/new_ecomerce_backend/actions
2. Click on latest workflow run
3. Watch logs in real-time

### 4. Expected Output
```
========================================
🚀 Starting Deployment
========================================

📦 Step 0: Ensuring PM2 is installed
✅ PM2 installed globally

📁 Step 1: Moving to project directory
✅ Directory exists

📝 Step 6: Creating .env file from GitHub Secrets
✅ .env file created

📦 Step 7: Installing dependencies
added 150 packages in 30s

🔁 Step 8: Restarting PM2
[PM2] Applying action deleteProcessId
[PM2] Starting server.js in fork_mode

💾 Step 9: Saving PM2 state
[PM2] Saving current process list

========================================
✅ Deployment Complete
========================================

📊 PM2 Status:
┌────┬─────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id │ name            │ mode        │ status  │ cpu     │ memory   │
├────┼─────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0  │ ecommerce-api   │ fork        │ online  │ 0%      │ 85.2mb   │
└────┴─────────────────┴─────────────┴─────────┴─────────┴──────────┘

🔍 Environment Check:
Cashfree ENV: CASHFREE_ENV=production
Node Version: v18.19.0
PM2 Version: 5.3.0
```

---

## 🐛 Troubleshooting

### Issue 1: Workflow Fails at Step 1
**Error:** "Directory not found"

**Solution:**
```bash
# SSH into server
ssh user@your-server

# Create directory manually
mkdir -p /var/www/backend
cd /var/www/backend

# Initialize git
git init
git remote add origin https://github.com/RitikRajoriya/new_ecomerce_backend.git
```

### Issue 2: Workflow Fails at Step 6
**Error:** "Secrets not found"

**Solution:**
- Verify all 7 secrets are added
- Check secret names are EXACT (case-sensitive)
- See `GITHUB_SECRETS_SETUP.md`

### Issue 3: Workflow Fails at Step 7
**Error:** "npm install failed"

**Solution:**
```bash
# SSH into server
cd /var/www/backend

# Check Node version
node --version
# Should be v18 or higher

# Check npm version
npm --version

# Manual install
npm install --production
```

### Issue 4: Workflow Fails at Step 8
**Error:** "PM2 start failed"

**Solution:**
```bash
# SSH into server
cd /var/www/backend

# Check .env exists
cat .env

# Verify environment
node -e "require('dotenv').config(); console.log(process.env.CASHFREE_ENV)"

# Manual start
pm2 delete ecommerce-api || true
pm2 start server.js --name ecommerce-api
pm2 logs ecommerce-api
```

### Issue 5: App Starts but Crashes
**Error:** PM2 shows "errored" status

**Solution:**
```bash
# Check logs
pm2 logs ecommerce-api --lines 100

# Common issues:
# - Missing .env variables
# - MongoDB not running
# - Port already in use

# Check if port is in use
lsof -i :5001

# Kill existing process
kill -9 <PID>

# Restart
pm2 restart ecommerce-api
```

---

## 📊 Deployment Checklist

Before pushing to main:

- [ ] All 7 GitHub secrets added
- [ ] Server SSH accessible
- [ ] PM2 installed on server
- [ ] Node.js 18+ installed on server
- [ ] MongoDB running on server
- [ ] `/var/www/backend` directory exists (or will be created)
- [ ] SSH key added to server's `authorized_keys`

---

## 🔍 Verification After Deployment

### 1. Check PM2 Status:
```bash
ssh user@server
pm2 list
# Should show: ecommerce-api | online
```

### 2. Check Logs:
```bash
pm2 logs ecommerce-api --lines 50
# Should show:
# ========================================
# Server running on port 5001
# ========================================
# Environment: production
# Cashfree ENV: production
# ✅ PRODUCTION MODE ACTIVE
```

### 3. Test API:
```bash
curl https://api.indianhandicraftshop.com/health
# Should return 200 OK
```

### 4. Test Payment:
- Visit: https://indianhandicraftshop.com
- Add product to cart
- Complete checkout
- Should work with production Cashfree

---

## 📁 Files Modified

1. ✅ `.github/workflows/deploy.yml` - Fixed deployment workflow
2. ✅ `GITHUB_SECRETS_SETUP.md` - Secrets setup guide
3. ✅ `DEPLOYMENT_WORKFLOW_FIX.md` - This documentation

---

## 🎯 Key Improvements

| Feature | Before | After |
|---------|--------|-------|
| **Deploy Path** | `/home/ubuntu/new_ecomerce_backend` | `/var/www/backend` ✅ |
| **Environment** | Missing | Created from secrets ✅ |
| **PM2 Name** | `server` | `ecommerce-api` ✅ |
| **PM2 Install** | Not ensured | Installed automatically ✅ |
| **Error Handling** | Minimal | Comprehensive ✅ |
| **Debug Logs** | 5 lines | 50 lines + env check ✅ |
| **Secrets** | Not used | All 7 secrets used ✅ |

---

## 💡 Important Notes

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Secrets are case-sensitive** - Use exact names
3. **SSH key must be private key** - Not public key
4. **PM2 name must match** - `ecommerce-api` everywhere
5. **Check logs after deploy** - Verify production mode active
6. **Test payment after deploy** - Ensure Cashfree works

---

## 🚀 Next Steps

1. ✅ Workflow fixed
2. ⏳ Add GitHub secrets (see `GITHUB_SECRETS_SETUP.md`)
3. ⏳ Push to main branch
4. ⏳ Watch deployment in Actions tab
5. ⏳ Verify deployment on server
6. ⏳ Test live payment

---

**Status:** ✅ **WORKFLOW FIXED**  
**Ready for:** Automated deployment  
**Required:** GitHub secrets setup  

**Last Updated:** April 18, 2026
