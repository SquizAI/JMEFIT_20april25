#!/usr/bin/env node

/**
 * This script registers a Stripe webhook for product and price synchronization.
 * It calls the webhook registration endpoint in the sync-products function.
 */

import fetch from 'node-fetch';
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
    // Determine the base URL - default to production URL for webhook registration
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://jmefit.com';
    const webhookUrl = `${baseUrl}/.netlify/functions/sync-products/register-webhook`;
    
    console.log(`Registering webhook at: ${webhookUrl}`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook registered successfully!');
      console.log('Webhook ID:', result.webhookId);
      console.log('Webhook URL:', result.webhookUrl);
      console.log('\n🔑 IMPORTANT: Save the webhook secret in your .env file as STRIPE_WEBHOOK_SECRET');
      console.log('Secret:', result.secret);
      
      // Instructions for updating the .env file
      console.log('\nAdd this line to your .env file:');
      console.log(`STRIPE_WEBHOOK_SECRET=${result.secret}`);
      
      // Instructions for Netlify
      console.log('\nIf deploying to Netlify, add this environment variable in the Netlify dashboard:');
      console.log(`STRIPE_WEBHOOK_SECRET=${result.secret}`);
    } else {
      console.error('❌ Failed to register webhook:', result.error);
    }
  } catch (error) {
    console.error('❌ Error registering webhook:', error.message);
  }
}

registerWebhook();
