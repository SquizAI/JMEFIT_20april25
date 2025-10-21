# Security and Webhook Fixes Required

## 🚨 CRITICAL: Exposed API Keys Fixed

### Files Modified
The following files had hardcoded Supabase credentials that have been removed:
- ✅ `run-db-setup.js` - Now reads from environment variables
- ✅ `run-db-setup.sh` - Now reads from .env file
- ✅ `setup-db-tables.js` - Now reads from environment variables
- ✅ `setup-db.js` - Now reads from environment variables
- ✅ `update-password-with-session.js` - Now requires tokens and password as parameters (removed hardcoded access tokens and password)

### ⚠️ Important: Rotate Your Supabase Key
Since the Supabase anon key was committed to git history, you should consider rotating it:
1. Go to your Supabase project settings
2. Navigate to API settings
3. Generate a new anon key
4. Update your `.env` file with the new key
5. Update Netlify environment variables with the new key

## 🔧 Stripe Webhook Fix

### Problem
Stripe is reporting failures for webhook: `https://jmefit.com/.netlify/functions/sync-products`

### Root Cause
The webhook endpoint requires the `STRIPE_WEBHOOK_SECRET` environment variable to verify webhook signatures, but it's likely not set in your Netlify environment.

### Solution Steps

#### 1. Set Required Environment Variables in Netlify

Go to your Netlify dashboard → Site settings → Environment variables and ensure these are set:

**Required for all functions:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key (public)
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (private - for server functions)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_live_REDACTED... or sk_test_...)

**Required for webhook functions:**
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret (whsec_...)

**Required for email functions (optional):**
- `SMTP_HOST` - Your SMTP server host
- `SMTP_PORT` - Your SMTP server port
- `SMTP_USER` - Your SMTP username
- `SMTP_PASSWORD` - Your SMTP password
- `SMTP_SECURE` - Set to "true" for TLS
- `DEFAULT_FROM_EMAIL` - Default sender email

#### 2. Get Your Webhook Secret from Stripe

**Option A: From Stripe Dashboard**
1. Go to https://dashboard.stripe.com/webhooks
2. Find the webhook endpoint: `https://jmefit.com/.netlify/functions/sync-products`
3. Click on it to view details
4. Click "Reveal" next to "Signing secret"
5. Copy the secret (starts with `whsec_`)

**Option B: Create a New Webhook**
If the webhook doesn't exist or you want to recreate it:

1. Delete the old webhook in Stripe dashboard
2. Use the Stripe dashboard to create a new webhook:
   - Endpoint URL: `https://jmefit.com/.netlify/functions/sync-products`
   - Events to send:
     - `product.created`
     - `product.updated`
     - `product.deleted`
     - `price.created`
     - `price.updated`
     - `price.deleted`
3. Copy the signing secret

#### 3. Add the Secret to Netlify

1. Go to Netlify dashboard → Your site → Site settings → Environment variables
2. Click "Add a variable"
3. Key: `STRIPE_WEBHOOK_SECRET`
4. Value: Paste the webhook secret from Stripe (starts with `whsec_`)
5. Click "Create variable"

#### 4. Redeploy Your Site

After adding the environment variable:
```bash
# Trigger a redeploy to pick up the new environment variable
git commit --allow-empty -m "Trigger redeploy for webhook fix"
git push
```

Or use the Netlify dashboard → Deploys → Trigger deploy → Deploy site

#### 5. Test the Webhook

1. Make a small change to a product in Stripe dashboard (e.g., update description)
2. Go to Stripe dashboard → Webhooks → Your webhook endpoint
3. Check the "Recent deliveries" section
4. You should see a successful delivery (HTTP 200)

## 📋 Environment Variables Checklist

### Local Development (.env file)
```env
# Supabase
VITE_SUPABASE_URL=https://jjmaxsmlrcizxfgucvzx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_REDACTED...
STRIPE_SECRET_KEY=sk_live_REDACTED...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_password
SMTP_SECURE=true
DEFAULT_FROM_EMAIL=JME FIT Team <info@jmefit.com>

# Google OAuth (optional)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Netlify Production (Environment Variables)
Set all the same variables above in:
Netlify Dashboard → Site Settings → Environment Variables

⚠️ **Important**: Don't use `VITE_` prefix for secrets in Netlify! The VITE_ prefix exposes variables to the client.

For Netlify functions, use:
- `SUPABASE_URL` (instead of VITE_SUPABASE_URL)
- `SUPABASE_ANON_KEY` (instead of VITE_SUPABASE_ANON_KEY)
- `SUPABASE_SERVICE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 🔐 Security Best Practices

### Never Commit These to Git:
- ❌ API keys or secrets
- ❌ `.env` files (already in .gitignore ✅)
- ❌ Webhook secrets
- ❌ Service role keys
- ❌ SMTP passwords

### Always Use Environment Variables:
- ✅ Read secrets from `process.env`
- ✅ Use different keys for development and production
- ✅ Rotate keys if they're exposed
- ✅ Use service role keys only in server-side code

## 📝 Files That Were Changed

### Modified to Use Environment Variables:
- `run-db-setup.js` - Now requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- `run-db-setup.sh` - Now loads from .env file

### Already Secure:
- `netlify/functions/sync-products.js` - ✅ Uses environment variables
- `netlify/functions/stripe-webhook.js` - ✅ Uses environment variables
- All other Netlify functions - ✅ Use environment variables

## ✅ Verification Steps

After completing the fixes:

1. **Check Netlify Build Logs**
   - Ensure no errors about missing environment variables
   - Functions should deploy successfully

2. **Test Webhook**
   - Update a product in Stripe
   - Check webhook delivery in Stripe dashboard
   - Should see HTTP 200 response

3. **Test Local Development**
   ```bash
   # Make sure .env file has all required variables
   npm run dev
   ```

4. **Verify No Exposed Secrets**
   ```bash
   # Search for any remaining hardcoded secrets
   git grep -i "sk_live\|sk_test\|pk_live\|pk_test" -- '*.js' '*.ts' '*.jsx' '*.tsx'
   ```

## 🆘 Troubleshooting

### Webhook Still Failing?
1. Check Netlify function logs: Netlify Dashboard → Functions → sync-products → Logs
2. Verify environment variables are set correctly
3. Check that webhook secret matches between Stripe and Netlify
4. Ensure webhook URL is exactly: `https://jmefit.com/.netlify/functions/sync-products`

### Environment Variables Not Working?
1. Redeploy after adding variables
2. Check variable names match exactly (case-sensitive)
3. Ensure no extra spaces in variable values
4. For Netlify functions, remove `VITE_` prefix from secret variables

### Still Need Help?
Check the Netlify function logs for specific error messages:
```bash
netlify functions:log sync-products
```
