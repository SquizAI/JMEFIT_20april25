#!/usr/bin/env node

/**
 * This script directly registers a Stripe webhook for product and price synchronization.
 * It uses the Stripe API directly instead of going through the Netlify function.
 */

import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name using ES modules pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

async function registerWebhook() {
  try {
    // Initialize Stripe with the secret key
    const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('VITE_STRIPE_SECRET_KEY is not set in your .env file');
    }
    
    const stripe = new Stripe(stripeSecretKey);
    
    // Determine the base URL - default to production URL for webhook registration
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://jmefit.com';
    const webhookUrl = `${baseUrl}/.netlify/functions/sync-products`;
    
    console.log(`Registering webhook at: ${webhookUrl}`);
    
    // Create a webhook endpoint in Stripe
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: [
        'product.created',
        'product.updated',
        'product.deleted',
        'price.created',
        'price.updated',
        'price.deleted'
      ],
      description: 'JMEFIT Supabase Sync Webhook'
    });
    
    console.log('\n✅ Webhook registered successfully!');
    console.log('Webhook ID:', webhookEndpoint.id);
    console.log('Webhook URL:', webhookUrl);
    console.log('\n🔑 IMPORTANT: Save the webhook secret in your .env file as STRIPE_WEBHOOK_SECRET');
    console.log('Secret:', webhookEndpoint.secret);
    
    // Instructions for updating the .env file
    console.log('\nAdd this line to your .env file:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);
    
    // Instructions for Netlify
    console.log('\nIf deploying to Netlify, add this environment variable in the Netlify dashboard:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);
    
  } catch (error) {
    console.error('\n❌ Error registering webhook:', error.message);
    
    if (error.message.includes('URL must be publicly accessible')) {
      console.log('\nTo test webhooks locally, you can use the Stripe CLI:');
      console.log('1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli');
      console.log('2. Run: stripe listen --forward-to http://localhost:8888/.netlify/functions/sync-products');
      console.log('3. Copy the webhook signing secret and add it to your .env file as STRIPE_WEBHOOK_SECRET');
    }
  }
}

registerWebhook();
