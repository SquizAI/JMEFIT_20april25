# JMEFIT Netlify Setup Documentation

## Project Overview
- **Project Name**: JMEFIT
- **Framework**: React + Vite
- **Site URL**: https://jmefit.com

## Netlify Configuration

### Build Settings
- **Base directory**: Not set (root of the repository)
- **Build command**: `npm run build:netlify && node netlify-image-fix.js`
- **Publish directory**: `dist`
- **Node.js version**: 20.x

### Environment Variables
The following environment variables are in netlify 
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXX
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXX
VITE_SUPABASE_URL=https://XXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=XXXXXXXXXX
```

### Netlify Functions
This project uses Netlify Functions for serverless backend operations. The functions are located in the `/netlify/functions/` directory:

1. **create-checkout.js**
   - Purpose: Handles one-time payment checkout sessions with Stripe
   - Endpoint: `/.netlify/functions/create-checkout`

2. **create-subscription-checkout.js**
   - Purpose: Handles subscription-based checkout sessions with Stripe
   - Endpoint: `/.netlify/functions/create-subscription-checkout`

### Netlify.toml Configuration
```toml
[build]
  command = "npm run build:netlify && node netlify-image-fix.js"
  publish = "dist"
  functions = "netlify/functions"
  ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF ./public/"

[build.processing]
  skip_processing = false

[build.processing.images]
  compress = true

[build.environment]
  NODE_VERSION = "20"
  NODE_ENV = "production"

# Exclude Google verification file from SPA redirect
[[redirects]]
  from = "/googlea7b0d1994a9c267c.html"
  to = "/googlea7b0d1994a9c267c.html"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Origin, X-Requested-With, Content-Type, Accept"
    Content-Security-Policy = "default-src 'self' https: http:; img-src 'self' https: data: http:; style-src 'self' 'unsafe-inline' https: http:; font-src 'self' https: http:; script-src 'self' https: 'unsafe-inline';"
```

## Deployment Process

### Manual Deployment
1. Push changes to the main branch
2. Netlify automatically builds and deploys the site

### Continuous Deployment
- Netlify is configured to automatically deploy when changes are pushed to the main branch
- Build logs can be viewed in the Netlify dashboard

## Post-Deployment Verification
After deployment, verify the following:
1. The main site loads correctly
2. Stripe checkout functions work for both one-time payments and subscriptions
3. Authentication with Supabase is functioning properly

## Troubleshooting
If you encounter issues with Netlify Functions:
1. Check the function logs in the Netlify dashboard
2. Verify that environment variables are correctly set
3. Ensure the Stripe API keys are valid and have the necessary permissions

## Contact
For issues with the Netlify deployment, contact the site administrator.
