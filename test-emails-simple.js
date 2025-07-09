#!/usr/bin/env node

/**
 * Simple Email Test Script for JME FIT Welcome Emails
 * Uses the existing /.netlify/functions/send-email endpoint
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const TEST_EMAIL = process.argv[2] || 'mattysquarzoni@gmail.com';
const BASE_URL = 'https://jmefit.com';

// Email templates to test
const EMAIL_TEMPLATES = [
  {
    name: 'Self-Led Training',
    file: 'self-led-training-welcome.html',
    customerName: 'Emily Chen'
  },
  {
    name: 'One-Time Macros',
    file: 'one-time-macros-welcome.html',
    customerName: 'Alex Parker'
  },
  {
    name: 'SHRED Challenge',
    file: 'shred-challenge-welcome.html',
    customerName: 'Jessica Martinez'
  },
  {
    name: 'Nutrition Programs',
    file: 'nutrition-programs-welcome.html',
    customerName: 'Sarah Johnson'
  }
];

async function loadEmailTemplate(templateFile, customerName) {
  try {
    const templatePath = path.join(process.cwd(), 'src', 'emails', templateFile);
    let template = await fs.readFile(templatePath, 'utf8');
    
    // Replace template variables
    template = template
      .replace(/\{\{clientName\}\}/g, customerName)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{logoUrl\}\}/g, 'https://jmefit.com/JME_fit_black_purple.png')
      .replace(/\{\{unsubscribeUrl\}\}/g, `https://jmefit.com/unsubscribe?email=${encodeURIComponent(TEST_EMAIL)}`)
      .replace(/\{\{privacyUrl\}\}/g, 'https://jmefit.com/privacy');
    
    return template;
  } catch (error) {
    console.error(`❌ Error loading template ${templateFile}:`, error.message);
    return null;
  }
}

async function sendTestEmail(template) {
  console.log(`\n📧 Testing: ${template.name}`);
  console.log(`   File: ${template.file}`);
  console.log(`   Customer: ${template.customerName}`);
  
  try {
    const emailHtml = await loadEmailTemplate(template.file, template.customerName);
    
    if (!emailHtml) {
      console.log(`   ❌ FAILED: Could not load template`);
      return { success: false, error: 'Template not found' };
    }
    
    const response = await fetch(`${BASE_URL}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: `[TEST] Welcome to JME FIT - ${template.name}`,
        html: emailHtml,
        text: `Welcome to JME FIT, ${template.customerName}! This is a test email for the ${template.name} package.`,
        from: 'Jaime from JME FIT <jaime@jmefit.com>'
      })
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`   ✅ SUCCESS: Email sent`);
      console.log(`   📧 Message ID: ${result.messageId}`);
    } else {
      console.log(`   ❌ FAILED: ${result.error || 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing JME FIT Welcome Email System');
  console.log(`📧 Test emails will be sent to: ${TEST_EMAIL}`);
  console.log(`🌐 Using endpoint: ${BASE_URL}/.netlify/functions/send-email`);
  console.log('=' + '='.repeat(60));

  const results = [];
  
  for (const template of EMAIL_TEMPLATES) {
    const result = await sendTestEmail(template);
    results.push({
      template: template.name,
      success: result.success,
      error: result.error
    });
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' + '='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.template}: ${r.error}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n✅ SUCCESSFUL TESTS:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.template}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check your email inbox for test emails');
  console.log('2. Verify email formatting and content');
  console.log('3. Test the links in each email');
  
  return results;
}

// Run the tests
runTests()
  .then(() => {
    console.log('\n✅ Email testing completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Email testing failed:', error);
    process.exit(1);
  }); 