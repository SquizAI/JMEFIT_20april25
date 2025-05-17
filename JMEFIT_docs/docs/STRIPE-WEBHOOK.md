# Stripe Webhook Integration for JMEFIT

This document explains how the Stripe webhook integration works to automatically synchronize products and prices between Stripe and Supabase.

## Overview

The integration uses Stripe webhooks to listen for product and price changes in Stripe and automatically update the corresponding data in Supabase. This ensures that the pricing displayed in the JMEFIT application is always up-to-date with the latest pricing in Stripe.

## How It Works

1. When a product or price is created, updated, or deleted in Stripe, Stripe sends a webhook event to the JMEFIT application.
2. The webhook endpoint (`/.netlify/functions/sync-products`) receives the event and processes it based on the event type.
3. The webhook handler updates the corresponding product or price in Supabase.

## Supported Events

The webhook handles the following Stripe events:

- `product.created`: When a new product is created in Stripe
- `product.updated`: When a product is updated in Stripe
- `product.deleted`: When a product is deleted in Stripe
- `price.created`: When a new price is created in Stripe
- `price.updated`: When a price is updated in Stripe
- `price.deleted`: When a price is deleted in Stripe

## Setup Instructions

### 1. Register the Webhook

Use the provided script to register the webhook with Stripe:

```bash
node scripts/register-webhook.js
```

This script will:
- Create a new webhook endpoint in Stripe
- Configure it to listen for the supported events
- Return a webhook secret that you need to save

### 2. Save the Webhook Secret

After registering the webhook, save the webhook secret in your environment variables:

- For local development, add it to your `.env` file:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
  ```

- For production, add it to your Netlify environment variables in the Netlify dashboard.

### 3. Test the Webhook

To test the webhook:

1. Make a change to a product or price in the Stripe dashboard.
2. Check the Netlify function logs to see if the webhook event was received and processed.
3. Verify that the change was reflected in Supabase.

## Troubleshooting

### Webhook Not Receiving Events

- Ensure the webhook URL is publicly accessible.
- Check that the webhook secret is correctly set in your environment variables.
- Verify that the webhook is enabled in the Stripe dashboard.

### Events Not Processing Correctly

- Check the Netlify function logs for any errors.
- Ensure the Supabase connection is working correctly.
- Verify that the product or price exists in Stripe.

## Manual Synchronization

If needed, you can manually trigger a synchronization by calling:

```
/.netlify/functions/sync-products
```

This will fetch all products and prices from Stripe and update Supabase accordingly.
