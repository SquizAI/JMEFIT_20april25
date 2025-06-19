# JMEFIT Netlify Setup Documentation

## Project Overview
- **Project Name**: JMEFIT
- **Framework**: React + Vite
- **Site URL**: https://jmefit.com

## Netlify Configuration

### Build Settings
- **Base directory**: Not set (root of the repository)
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node.js version**: 18.x (LTS)

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
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
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
