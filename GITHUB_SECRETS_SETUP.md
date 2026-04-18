# 🔐 GitHub Secrets Setup Guide

## Required Secrets for Deployment

Your GitHub Actions workflow needs these secrets to deploy successfully.

---

## 📋 Required Secrets

### SSH Connection:
| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `SSH_HOST` | Your server IP or domain | `192.168.1.100` or `api.indianhandicraftshop.com` |
| `SSH_USER` | SSH username | `ubuntu` or `root` |
| `SSH_KEY` | SSH private key | `-----BEGIN RSA PRIVATE KEY-----...` |

### Database:
| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/ecommerce` |

### JWT:
| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `JWT_SECRET` | JWT signing secret | `your_super_secret_jwt_key_here` |

### Cashfree Production:
| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `CASHFREE_PROD_APP_ID` | Cashfree Production App ID | `YOUR_CASHFREE_APP_ID_HERE` |
| `CASHFREE_PROD_SECRET_KEY` | Cashfree Production Secret | `YOUR_CASHFREE_SECRET_KEY_HERE` |

---

## 🔧 How to Add Secrets

### Step 1: Go to Repository Settings
1. Open: https://github.com/RitikRajoriya/new_ecomerce_backend
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions** in left sidebar

### Step 2: Add Each Secret
1. Click **New repository secret**
2. Enter **Name** (exact name from table above)
3. Enter **Value** (your actual secret value)
4. Click **Add secret**

### Step 3: Verify All Secrets
Make sure you have all 7 secrets:
- ✅ `SSH_HOST`
- ✅ `SSH_USER`
- ✅ `SSH_KEY`
- ✅ `MONGODB_URI`
- ✅ `JWT_SECRET`
- ✅ `CASHFREE_PROD_APP_ID`
- ✅ `CASHFREE_PROD_SECRET_KEY`

---

## 🔑 How to Get SSH Key

### Option 1: Use Existing SSH Key
```bash
# On your local machine
cat ~/.ssh/id_rsa
```
Copy the entire content (including BEGIN and END lines)

### Option 2: Generate New SSH Key
```bash
# Generate new key
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# View public key (add to server's authorized_keys)
cat ~/.ssh/id_rsa.pub

# View private key (add to GitHub secret)
cat ~/.ssh/id_rsa
```

### Add Public Key to Server:
```bash
# On your server
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 📝 Secret Values Example

### SSH_HOST:
```
192.168.1.100
```
or
```
api.indianhandicraftshop.com
```

### SSH_USER:
```
ubuntu
```

### SSH_KEY:
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA0Z3VS5JJcds3xfn/ygWyF...
... (entire key content) ...
-----END RSA PRIVATE KEY-----
```

### MONGODB_URI:
```
mongodb://127.0.0.1:27017/ecommerce
```

### JWT_SECRET:
```
your_super_secret_jwt_key_change_in_production_2024
```

### CASHFREE_PROD_APP_ID:
```
YOUR_CASHFREE_APP_ID_HERE
```

### CASHFREE_PROD_SECRET_KEY:
```
YOUR_CASHFREE_SECRET_KEY_HERE
```

---

## ✅ Verify Secrets

After adding all secrets, your Actions secrets page should show:

```
Repository secrets (7):
  ✅ SSH_HOST
  ✅ SSH_USER
  ✅ SSH_KEY
  ✅ MONGODB_URI
  ✅ JWT_SECRET
  ✅ CASHFREE_PROD_APP_ID
  ✅ CASHFREE_PROD_SECRET_KEY
```

---

## 🚀 Test Deployment

After adding secrets:

1. **Push any change to main branch:**
   ```bash
   git add .
   git commit -m "test: trigger deployment"
   git push origin main
   ```

2. **Watch GitHub Actions:**
   - Go to: https://github.com/RitikRajoriya/new_ecomerce_backend/actions
   - Click on the latest workflow run
   - Watch the deployment logs

3. **Expected Output:**
   ```
   ========================================
   🚀 Starting Deployment
   ========================================
   
   📦 Step 0: Ensuring PM2 is installed
   ✅ PM2 installed
   
   📁 Step 1: Moving to project directory
   ✅ Directory exists
   
   📝 Step 6: Creating .env file from GitHub Secrets
   ✅ .env file created
   
   📦 Step 7: Installing dependencies
   ✅ Dependencies installed
   
   🔁 Step 8: Restarting PM2
   ✅ PM2 started
   
   ========================================
   ✅ Deployment Complete
   ========================================
   ```

---

## 🐛 Troubleshooting

### Error: "Secret not found"
**Solution:** 
- Check secret name is EXACT (case-sensitive)
- Verify secret is added to correct repository

### Error: "SSH authentication failed"
**Solution:**
- Verify SSH_KEY is correct (includes BEGIN/END lines)
- Check SSH_USER is correct
- Verify public key is in server's `~/.ssh/authorized_keys`

### Error: "Permission denied"
**Solution:**
- Check SSH_KEY has correct permissions
- Verify server allows SSH key authentication

### Error: "PM2 not found"
**Solution:**
- Workflow now installs PM2 automatically
- Check logs for installation errors

---

## 🔒 Security Notes

- ✅ Secrets are encrypted by GitHub
- ✅ Secrets are not visible in logs
- ✅ Secrets are not available to pull requests from forks
- ✅ Never commit `.env` file to repository
- ✅ Rotate secrets periodically
- ✅ Use strong, unique values

---

**Status:** 📝 **SETUP REQUIRED**  
**Next Step:** Add all 7 secrets to GitHub repository
