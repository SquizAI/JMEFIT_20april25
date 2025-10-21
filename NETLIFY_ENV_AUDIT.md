# Netlify Environment Variables Audit

**Site:** jmefitlanding (https://jmefit.com)
**Project ID:** 5c4f81a6-054b-4c2a-a7a5-70c161a11c30
**Audit Date:** 2025-10-21

## ✅ Correctly Configured Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `GEMINI_API_KEY` | ✅ Set | Correct - Used in Netlify functions |
| `STRIPE_SECRET_KEY` | ✅ Set | Correct - Used in Netlify functions |
| `STRIPE_WEBHOOK_SECRET` | ✅ Set | **WEBHOOK FIXED!** Set for all contexts |
| `SUPABASE_SERVICE_KEY` | ✅ Set | Correct - Used in server functions |
| `VITE_SUPABASE_URL` | ✅ Set | Correct - Public, can use VITE_ |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ Set | Correct - Public key, can use VITE_ |
| `VITE_GOOGLE_CLIENT_ID` | ✅ Set | Correct - Public, can use VITE_ |
| `VITE_API_URL` | ✅ Set | Correct |
| `SMTP_HOST` | ✅ Set | Correct |
| `SMTP_PORT` | ✅ Set | Correct (465) |
| `SMTP_USER` | ✅ Set | Correct |
| `SMTP_PASSWORD` | ✅ Set | Correct |
| `SMTP_SECURE` | ✅ Set | Correct (true) |
| `DEFAULT_FROM_EMAIL` | ✅ Set | Correct |

## 🚨 CRITICAL - Security Issue

| Variable | Issue | Action Required |
|----------|-------|-----------------|
| `VITE_SUPABASE_ANON_KEY` | **STILL THE EXPOSED KEY!** Ends with `...gl4BX2tyGkzby5mkDG0OHUkpa2qV5owYfEjJt0JZYWs` | **ROTATE IMMEDIATELY** in Supabase dashboard |

## ⚠️ Issues - Incorrect Configuration

| Variable | Problem | Recommendation |
|----------|---------|----------------|
| `VITE_STRIPE_SECRET_KEY` | ❌ Duplicate - Secrets shouldn't use VITE_ prefix | **DELETE** - Use `STRIPE_SECRET_KEY` instead |
| `VITE_GOOGLE_CLIENT_SECRET` | ❌ Secret using VITE_ prefix (exposed to client) | **DELETE and recreate as** `GOOGLE_CLIENT_SECRET` |
| `VITE_GEMINI_API_KEY` | ❌ Duplicate - Secret using VITE_ prefix | **DELETE** - Use `GEMINI_API_KEY` instead |

## ℹ️ Optional - Keep for Now

| Variable | Status | Notes |
|----------|--------|-------|
| `OPENAI_API_KEY` | ⚠️ Legacy | Keep for image generation (`generate-blog-image.js`) since Gemini doesn't do images. Can remove if you switch to a different image API. |

## 📋 Required Actions

### 1. CRITICAL - Rotate Supabase Key (Do This First!)

**The VITE_SUPABASE_ANON_KEY is still the exposed key from git!**

Steps:
1. Go to https://supabase.com/dashboard/project/jjmaxsmlrcizxfgucvzx/settings/api
2. Click "Reset" next to the `anon` key
3. Copy the new key
4. Update in Netlify:
   - Delete old `VITE_SUPABASE_ANON_KEY`
   - Add new `VITE_SUPABASE_ANON_KEY` with the new key
5. Update your local `.env` file with the new key
6. Redeploy

### 2. Remove Duplicate/Incorrect Variables

Delete these from Netlify (they're duplicates or incorrectly prefixed):
- ❌ `VITE_STRIPE_SECRET_KEY` (use `STRIPE_SECRET_KEY` instead)
- ❌ `VITE_GOOGLE_CLIENT_SECRET` (recreate as `GOOGLE_CLIENT_SECRET`)
- ❌ `VITE_GEMINI_API_KEY` (use `GEMINI_API_KEY` instead)

### 3. Add Missing Variable (if using Google OAuth server-side)

If you need Google OAuth in Netlify functions:
- ✅ Add `GOOGLE_CLIENT_SECRET` (without VITE_ prefix)

## 🎯 Final Required Variables

After cleanup, you should have these environment variables in Netlify:

### Supabase
- `VITE_SUPABASE_URL` - Public
- `VITE_SUPABASE_ANON_KEY` - Public (⚠️ ROTATE THIS!)
- `SUPABASE_SERVICE_KEY` - Secret

### Stripe
- `VITE_STRIPE_PUBLISHABLE_KEY` - Public
- `STRIPE_SECRET_KEY` - Secret
- `STRIPE_WEBHOOK_SECRET` - Secret ✅

### Google
- `VITE_GOOGLE_CLIENT_ID` - Public
- `GOOGLE_CLIENT_SECRET` - Secret (if needed for server-side OAuth)

### AI
- `GEMINI_API_KEY` - Secret ✅
- `OPENAI_API_KEY` - Secret (optional, for image generation)

### Email
- `SMTP_HOST` - Config ✅
- `SMTP_PORT` - Config ✅
- `SMTP_USER` - Config ✅
- `SMTP_PASSWORD` - Secret ✅
- `SMTP_SECURE` - Config ✅
- `DEFAULT_FROM_EMAIL` - Config ✅

### Other
- `VITE_API_URL` - Public ✅

## 🔐 Security Best Practices

### VITE_ Prefix Rules
- ✅ **USE VITE_** for: Public URLs, public keys, client IDs, anything exposed to the browser
- ❌ **DON'T USE VITE_** for: API secrets, service keys, passwords, webhook secrets

Variables with `VITE_` prefix are **bundled into your client code** and visible to anyone!

### Examples
```env
# ✅ CORRECT
VITE_SUPABASE_URL=https://xxx.supabase.co          # Public, OK to expose
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_REDACTED           # Public, OK to expose
STRIPE_SECRET_KEY=sk_live_REDACTED                     # Secret, stays server-side

# ❌ WRONG
VITE_STRIPE_SECRET_KEY=sk_live_REDACTED               # SECRET EXPOSED TO CLIENT!
VITE_GOOGLE_CLIENT_SECRET=xxx                     # SECRET EXPOSED TO CLIENT!
```

## ✅ Code Updates Already Made

These functions have been updated to use correct environment variables:

1. ✅ `generate-email-content.js` - Now uses `GEMINI_API_KEY` (was `VITE_GEMINI_API_KEY`)
2. ✅ `generate-email-ai.js` - Converted from OpenAI to Gemini, uses `GEMINI_API_KEY`
3. ✅ `generate-blog-content.js` - Already using `GEMINI_API_KEY` ✅
4. ⚠️ `generate-blog-image.js` - Still uses OpenAI for DALL-E image generation (intentional)

## 🚀 Deployment Checklist

After making changes:

1. ✅ Rotate Supabase anon key
2. ✅ Remove duplicate/incorrect variables from Netlify
3. ✅ Commit code changes (already done)
4. ✅ Push to git
5. ✅ Deploy triggers automatically
6. ✅ Test webhook: Update a product in Stripe dashboard
7. ✅ Verify webhook delivery in Stripe dashboard → Webhooks → Recent deliveries

## 📊 Environment Variable Count

- **Total Variables:** 19
- **Correct:** 14
- **Need Rotation:** 1 (CRITICAL!)
- **To Delete:** 3
- **Missing:** 0-1 (optional GOOGLE_CLIENT_SECRET)

## 🔗 Quick Links

- Netlify Project: https://app.netlify.com/projects/jmefitlanding
- Stripe Webhooks: https://dashboard.stripe.com/webhooks
- Supabase API Settings: https://supabase.com/dashboard/project/jjmaxsmlrcizxfgucvzx/settings/api
- GitHub Repo: https://github.com/SquizAI/JMEFIT_20april25
