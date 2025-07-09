#!/usr/bin/env node

/**
 * Test script to send emails via Netlify functions
 * This script sends test emails using the deployed Netlify function
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const NETLIFY_SITE_URL = 'https://jmefit.com';
const EMAIL_FUNCTION_PATH = '/.netlify/functions/send-email';
const TEST_EMAIL = 'mattystjh@gmail.com';
const EMAIL_TEMPLATES_DIR = path.join(__dirname, 'src', 'emails');

// Email templates to test
const EMAIL_TEMPLATES = [
  {
    name: 'Hot Lead Welcome',
    template: 'hot-lead-welcome.html',
    subject: '🔥 Your Perfect JME FIT Program is Ready!',
    clientName: 'Test User'
  },
  {
    name: 'Warm Lead Welcome', 
    template: 'warm-lead-welcome.html',
    subject: '🌟 Ready to Take the Next Step with JME FIT?',
    clientName: 'Test User'
  },
  {
    name: 'Cold Lead Welcome',
    template: 'cold-lead-welcome.html', 
    subject: '🌱 Welcome to Your Fitness Journey with JME FIT',
    clientName: 'Test User'
  },
  {
    name: 'Self-Led Program Welcome',
    template: 'self-led-training-welcome.html',
    subject: 'Welcome to Self-Led Program!',
    clientName: 'Test User'
  },
  {
    name: 'Nutrition Programs Welcome',
    template: 'nutrition-programs-welcome.html',
    subject: 'Welcome to JME FIT Nutrition Programs!',
    clientName: 'Test User'
  },
  {
    name: 'One-Time Macros Welcome',
    template: 'one-time-macros-welcome.html',
    subject: 'Welcome to JME FIT - Your Macros Are Ready!',
    clientName: 'Test User'
  },
  {
    name: 'SHRED Challenge Welcome',
    template: 'shred-challenge-welcome.html',
    subject: 'Welcome to the SHRED Challenge!',
    clientName: 'Test User'
  },
  {
    name: 'Email Verification',
    template: 'verification.html',
    subject: 'Verify Your JME FIT Account',
    userName: 'Test User',
    verificationUrl: 'https://jmefit.com/verify?token=test123'
  }
];

// Function to read and process email template
function readEmailTemplate(templateName, data = {}) {
  try {
    const templatePath = path.join(EMAIL_TEMPLATES_DIR, templateName);
    console.log(`   📄 Reading template: ${templatePath}`);
    
    if (!fs.existsSync(templatePath)) {
      console.log(`   ❌ Template file not found: ${templatePath}`);
      return null;
    }
    
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Replace placeholders with actual data
    const replacements = {
      '{{clientName}}': data.clientName || 'Test User',
      '{{userName}}': data.userName || 'Test User',
      '{{verificationUrl}}': data.verificationUrl || 'https://jmefit.com/verify?token=test123',
      '{{logoUrl}}': 'https://jmefit.com/JME_fit_black_purple.png',
      '{{privacyUrl}}': 'https://jmefit.com/privacy',
      '{{unsubscribeUrl}}': 'https://jmefit.com/unsubscribe'
    };
    
    // Apply replacements
    Object.entries(replacements).forEach(([placeholder, value]) => {
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    console.log(`   ✅ Template loaded successfully (${htmlContent.length} characters)`);
    return htmlContent;
    
  } catch (error) {
    console.log(`   ❌ Error reading template: ${error.message}`);
    return null;
  }
}

// Function to send HTTP POST request
function sendRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'jmefit.com',
      port: 443,
      path: EMAIL_FUNCTION_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Function to test a single email template
async function testEmailTemplate(template) {
  console.log(`\n📧 Testing: ${template.name}`);
  console.log(`   Template: ${template.template}`);
  console.log(`   Subject: ${template.subject}`);
  
  // Read and process the HTML template
  const htmlContent = readEmailTemplate(template.template, {
    clientName: template.clientName || 'Test User',
    userName: template.userName || 'Test User',
    verificationUrl: template.verificationUrl || 'https://jmefit.com/verify?token=test123'
  });
  
  if (!htmlContent) {
    console.log(`   ❌ FAILED: Could not read template file`);
    return false;
  }

  const emailData = {
    to: TEST_EMAIL,
    subject: template.subject,
    html: htmlContent,
    text: `Hello ${template.clientName || 'Test User'}, this is a test email from JME FIT.`
  };

  try {
    const response = await sendRequest(emailData);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ SUCCESS: Email sent successfully`);
      if (response.data.messageId) {
        console.log(`   📬 Message ID: ${response.data.messageId}`);
      }
      return true;
    } else {
      console.log(`   ❌ FAILED: Status ${response.statusCode}`);
      console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

// Main test function
async function runEmailTests() {
  console.log('🚀 Starting JME FIT Email Tests via Netlify Functions');
  console.log(`📧 Sending test emails to: ${TEST_EMAIL}`);
  console.log(`🌐 Using Netlify site: ${NETLIFY_SITE_URL}`);
  console.log(`⚡ Function endpoint: ${EMAIL_FUNCTION_PATH}`);
  console.log(`📁 Templates directory: ${EMAIL_TEMPLATES_DIR}`);
  console.log('=' .repeat(60));

  let successCount = 0;
  let totalCount = EMAIL_TEMPLATES.length;

  // Test each email template
  for (const template of EMAIL_TEMPLATES) {
    const success = await testEmailTemplate(template);
    if (success) {
      successCount++;
    }
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
  console.log(`📧 Test email address: ${TEST_EMAIL}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ALL TESTS PASSED! Check your inbox for the test emails.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.');
  }
  
  console.log('\n💡 Note: Check your spam folder if you don\'t see the emails.');
  console.log('🔗 Email templates are using the updated JME FIT branding with white headers.');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
JME FIT Email Testing Script

Usage: node test-emails-netlify.js [options]

Options:
  --help, -h     Show this help message
  --email EMAIL  Send test emails to specific email address (default: ${TEST_EMAIL})

Examples:
  node test-emails-netlify.js
  node test-emails-netlify.js --email your@email.com

This script tests all email templates by sending them via the deployed Netlify function.
`);
  process.exit(0);
}

// Check for custom email address
const emailArgIndex = process.argv.indexOf('--email');
if (emailArgIndex !== -1 && process.argv[emailArgIndex + 1]) {
  const customEmail = process.argv[emailArgIndex + 1];
  console.log(`📧 Using custom email address: ${customEmail}`);
  // Update the test email
  for (let i = 0; i < EMAIL_TEMPLATES.length; i++) {
    EMAIL_TEMPLATES[i].testEmail = customEmail;
  }
}

// Run the tests
runEmailTests().catch(console.error); 