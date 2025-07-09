#!/usr/bin/env node

/**
 * Test Script for JME FIT Welcome Email System
 * 
 * This script sends test emails for all package types to verify:
 * 1. Email templates are loading correctly
 * 2. Template variables are being replaced
 * 3. SMTP configuration is working
 * 4. Correct templates are being selected for each package
 */

import fetch from 'node-fetch';

// Test email configuration
let TEST_EMAIL = 'test@jmefit.com'; // Replace with your test email
const BASE_URL = 'https://jmefit.com'; // Change to http://localhost:8888 for local testing

// Test cases for different packages
const TEST_PACKAGES = [
  {
    name: 'Nutrition Only Program',
    customerName: 'Sarah Johnson',
    packageName: 'Nutrition Only',
    stripeProductId: 'prod_SKFZTSQzWRzlDY',
    expectedTemplate: 'nutrition-programs-welcome.html'
  },
  {
    name: 'Nutrition & Training Program',
    customerName: 'Mike Rodriguez',
    packageName: 'Nutrition & Training',
    stripeProductId: 'prod_SKFZCf3jJcOY2r',
    expectedTemplate: 'nutrition-programs-welcome.html'
  },
  {
    name: 'Self-Led Training Program',
    customerName: 'Emily Chen',
    packageName: 'Self-Led Training',
    stripeProductId: 'prod_SKFZ9bT2D7uuwg',
    expectedTemplate: 'self-led-training-welcome.html'
  },
  {
    name: 'Trainer Feedback Program',
    customerName: 'David Thompson',
    packageName: 'Trainer Feedback',
    stripeProductId: 'prod_SKFYozPo80X30O',
    expectedTemplate: 'self-led-training-welcome.html'
  },
  {
    name: 'SHRED Challenge',
    customerName: 'Jessica Martinez',
    packageName: 'SHRED Challenge',
    stripeProductId: 'prod_SKFYIDF5hBEx3o',
    expectedTemplate: 'shred-challenge-welcome.html'
  },
  {
    name: 'One-Time Macros Calculation',
    customerName: 'Alex Parker',
    packageName: 'One-Time Macros',
    stripeProductId: 'prod_SKFYTOlWTNVH7o',
    expectedTemplate: 'one-time-macros-welcome.html'
  }
];

async function sendTestEmail(testCase) {
  console.log(`\n📧 Testing: ${testCase.name}`);
  console.log(`   Customer: ${testCase.customerName}`);
  console.log(`   Expected Template: ${testCase.expectedTemplate}`);
  
  try {
    const response = await fetch(`${BASE_URL}/.netlify/functions/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerEmail: TEST_EMAIL,
        customerName: testCase.customerName,
        packageName: testCase.packageName,
        stripeProductId: testCase.stripeProductId,
        isTest: true
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`   ✅ SUCCESS: Email sent with template ${result.template}`);
      console.log(`   📧 Message ID: ${result.messageId}`);
      
      // Verify correct template was used
      if (result.template === testCase.expectedTemplate) {
        console.log(`   ✅ TEMPLATE MATCH: Correct template used`);
      } else {
        console.log(`   ⚠️  TEMPLATE MISMATCH: Expected ${testCase.expectedTemplate}, got ${result.template}`);
      }
    } else {
      console.log(`   ❌ FAILED: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runEmailTests() {
  console.log('🚀 Starting JME FIT Welcome Email Tests');
  console.log(`📧 Test emails will be sent to: ${TEST_EMAIL}`);
  console.log(`🌐 Using endpoint: ${BASE_URL}/.netlify/functions/send-welcome-email`);
  console.log('=' * 60);

  const results = [];
  
  for (const testCase of TEST_PACKAGES) {
    const result = await sendTestEmail(testCase);
    results.push({
      package: testCase.name,
      success: result.success,
      template: result.template,
      error: result.error
    });
    
    // Wait 2 seconds between emails to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '=' * 60);
  console.log('📊 TEST SUMMARY');
  console.log('=' * 60);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.package}: ${r.error}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n✅ SUCCESSFUL TESTS:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.package}: ${r.template}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check your email inbox for test emails');
  console.log('2. Verify email formatting and content');
  console.log('3. Test the links in each email');
  console.log('4. Integrate with Stripe webhooks for automatic sending');
  
  return results;
}

// Check if this script is being run directly
if (require.main === module) {
  // Get test email from command line argument or use default
  const testEmail = process.argv[2];
  if (testEmail) {
    TEST_EMAIL = testEmail;
    console.log(`📧 Using custom test email: ${testEmail}`);
  }
  
  runEmailTests()
    .then(() => {
      console.log('\n✅ Email testing completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Email testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runEmailTests, sendTestEmail, TEST_PACKAGES }; 