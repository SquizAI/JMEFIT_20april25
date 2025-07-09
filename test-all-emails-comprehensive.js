#!/usr/bin/env node

/**
 * COMPREHENSIVE JME FIT EMAIL SYSTEM TEST
 * 
 * Tests ALL emails in the system:
 * 1. All 9 HTML email templates from src/emails/
 * 2. All conversion-optimized emails from test-final-emails.js
 * 3. Lead capture and segmentation emails
 * 4. System verification emails
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const TEST_EMAIL = process.argv[2] || 'mattysquarzoni@gmail.com';
const BASE_URL = 'https://jmefit.com';

console.log('🚀 COMPREHENSIVE JME FIT EMAIL SYSTEM TEST');
console.log(`📧 All emails will be sent to: ${TEST_EMAIL}`);
console.log(`🌐 Using endpoint: ${BASE_URL}/.netlify/functions/send-email`);
console.log('=' + '='.repeat(80));

// ALL HTML EMAIL TEMPLATES from src/emails/
const HTML_EMAIL_TEMPLATES = [
  {
    name: 'Nutrition Programs Welcome',
    file: 'nutrition-programs-welcome.html',
    customerName: 'Sarah Johnson',
    description: 'Welcome email for Nutrition Only & Nutrition+Training programs'
  },
  {
    name: 'Self-Led Training Welcome',
    file: 'self-led-training-welcome.html',
    customerName: 'Emily Chen',
    description: 'Welcome email for Self-Led Training program'
  },
  {
    name: 'SHRED Challenge Welcome',
    file: 'shred-challenge-welcome.html',
    customerName: 'Jessica Martinez',
    description: 'Welcome email for SHRED Challenge program'
  },
  {
    name: 'One-Time Macros Welcome',
    file: 'one-time-macros-welcome.html',
    customerName: 'Alex Parker',
    description: 'Welcome email for One-Time Macros Calculation'
  },
  {
    name: 'Email Verification',
    file: 'verification.html',
    customerName: 'New User',
    description: 'Email verification for new account signups'
  },
  {
    name: 'General Welcome',
    file: 'welcome.html',
    customerName: 'Welcome User',
    description: 'General welcome email for new users'
  },
  {
    name: 'Password Reset',
    file: 'password-reset.html',
    customerName: 'Reset User',
    description: 'Password reset instructions email'
  },
  {
    name: 'Subscription Confirmation',
    file: 'subscription-confirmation.html',
    customerName: 'Subscriber',
    description: 'Subscription confirmation and receipt email'
  },
  {
    name: 'Thank You',
    file: 'thank-you.html',
    customerName: 'Valued Customer',
    description: 'Thank you email after purchase or interaction'
  }
];

// CONVERSION-OPTIMIZED EMAILS (from test-final-emails.js)
const CONVERSION_EMAILS = [
  {
    name: 'Hot Lead - High Interest',
    segment: 'hot',
    customerName: 'Hot Prospect',
    description: 'High-converting email for hot leads (ICP 70-100)'
  },
  {
    name: 'Warm Lead - Interested',
    segment: 'warm',
    customerName: 'Warm Prospect',
    description: 'Risk-free trial email for warm leads (ICP 40-69)'
  },
  {
    name: 'Cold Lead - Educational',
    segment: 'cold',
    customerName: 'Cold Prospect',
    description: 'Educational content for cold leads (ICP 0-39)'
  },
  {
    name: 'System Test',
    segment: 'system_test',
    customerName: 'System Admin',
    description: 'Technical verification email'
  }
];

// Helper function to load and personalize HTML templates
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
      .replace(/\{\{privacyUrl\}\}/g, 'https://jmefit.com/privacy')
      .replace(/\{\{verificationUrl\}\}/g, 'https://jmefit.com/verify?token=test123')
      .replace(/\{\{resetUrl\}\}/g, 'https://jmefit.com/reset-password?token=test456');
    
    return template;
  } catch (error) {
    console.error(`❌ Error loading template ${templateFile}:`, error.message);
    return null;
  }
}

// Conversion-optimized email generator (from test-final-emails.js)
function generateConversionEmail(segment, customerName) {
  const jmefitStyles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      
      * { box-sizing: border-box; }
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        margin: 0; 
        padding: 0; 
        background: #ffffff;
        line-height: 1.6;
        color: #1a1a1a;
      }
      
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        background: #ffffff; 
      }
      
      .header { 
        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f1 100%); 
        padding: 30px 20px; 
        text-align: center; 
        color: white;
      }
      
      .logo-img { 
        height: 50px;
        margin-bottom: 15px;
      }
      
      .content { 
        padding: 40px 20px; 
      }
      
      .greeting { 
        font-size: 28px; 
        font-weight: 700; 
        margin-bottom: 20px; 
        color: #1a1a1a;
      }
      
      .main-text { 
        font-size: 16px; 
        margin-bottom: 24px; 
        color: #4a4a4a;
        line-height: 1.7;
      }
      
      .cta-button { 
        display: inline-block; 
        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); 
        color: white !important; 
        padding: 18px 36px; 
        border-radius: 8px; 
        text-decoration: none; 
        font-weight: 600; 
        font-size: 16px;
      }
      
      .cta-container {
        text-align: center;
        margin: 32px 0;
      }
      
      .benefits-list {
        background: #f8fafc;
        padding: 24px;
        border-radius: 8px;
        margin: 24px 0;
      }
      
      .benefit-item {
        margin: 12px 0;
        font-size: 15px;
      }
      
      .benefit-item::before {
        content: "✓";
        color: #10b981;
        font-weight: bold;
        margin-right: 12px;
      }
    </style>
  `;

  let subject, htmlContent;
  
  switch(segment) {
    case 'hot':
      subject = `${customerName}, Your Transformation Program is Ready (Limited Spots)`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${jmefitStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://jmefit.com/JME_fit_black_purple.png" alt="JMEFit Logo" class="logo-img">
              <div>Transform Mind & Body, Elevate Life</div>
            </div>
            <div class="content">
              <div class="greeting">Hi ${customerName}!</div>
              <div class="main-text">
                Based on our conversation, I've identified the <strong>perfect program</strong> for your fitness goals. 
                You're clearly ready to see real results!
              </div>
              <div class="benefits-list">
                <div class="benefit-item">Personalized nutrition plan designed for your specific needs</div>
                <div class="benefit-item">Expert training system that fits your busy schedule</div>
                <div class="benefit-item">Direct access to certified coaches whenever you need support</div>
                <div class="benefit-item">Proven system that's helped 10,000+ women succeed</div>
              </div>
              <div class="cta-container">
                <a href="https://jmefit.com/programs" class="cta-button">Claim My Spot Now</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case 'warm':
      subject = `${customerName}, Ready to Start Your Transformation? (Risk-Free)`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${jmefitStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://jmefit.com/JME_fit_black_purple.png" alt="JMEFit Logo" class="logo-img">
              <div>Your Fitness Journey Starts Here</div>
            </div>
            <div class="content">
              <div class="greeting">Hey ${customerName}!</div>
              <div class="main-text">
                Starting a new fitness program can feel overwhelming, so I'm making this 
                <strong>completely risk-free</strong> for you.
              </div>
              <div class="benefits-list">
                <div class="benefit-item">7-day FREE trial - no payment required upfront</div>
                <div class="benefit-item">Join our supportive community of 2,500+ women</div>
                <div class="benefit-item">Beginner-friendly nutrition guidance that actually works</div>
                <div class="benefit-item">Cancel anytime with one click - no hassle</div>
              </div>
              <div class="cta-container">
                <a href="https://jmefit.com/programs" class="cta-button">Start My FREE Trial</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case 'cold':
      subject = `${customerName}, The #1 Mistake That's Sabotaging Your Results`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${jmefitStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://jmefit.com/JME_fit_black_purple.png" alt="JMEFit Logo" class="logo-img">
              <div>Evidence-Based Fitness for Real Women</div>
            </div>
            <div class="content">
              <div class="greeting">Hi ${customerName},</div>
              <div class="main-text">
                After working with thousands of women, I've discovered the <strong>#1 mistake</strong> 
                that's sabotaging their fitness results...
              </div>
              <div class="main-text">
                <strong>It's trying to change everything at once.</strong>
              </div>
              <div class="benefits-list">
                <div class="benefit-item">Focus on ONE habit at a time (sustainable progress)</div>
                <div class="benefit-item">Start with 15-minute workouts (yes, they work!)</div>
                <div class="benefit-item">Make small nutrition changes that stick</div>
                <div class="benefit-item">Build momentum before adding complexity</div>
              </div>
              <div class="cta-container">
                <a href="https://jmefit.com/programs" class="cta-button">Get My FREE Foundation Guide</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      break;

    case 'system_test':
      subject = `JMEFit Email System Test - ${new Date().toLocaleDateString()}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>${jmefitStyles}</head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://jmefit.com/JME_fit_black_purple.png" alt="JMEFit Logo" class="logo-img">
              <div>System Status Check</div>
            </div>
            <div class="content">
              <div class="greeting">Email System Test</div>
              <div class="main-text">
                Technical verification of the JMEFit email system using 2025 conversion principles.
              </div>
              <div class="benefits-list">
                <div class="benefit-item">SMTP connection and authentication working</div>
                <div class="benefit-item">Mobile-first responsive design rendering correctly</div>
                <div class="benefit-item">Proper JMEFit logo display</div>
                <div class="benefit-item">Clean white background as requested</div>
              </div>
              <div class="main-text">
                <strong>Test completed:</strong> ${new Date().toLocaleString()}<br>
                <strong>Status:</strong> All systems operational
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      break;
  }

  return { subject, html: htmlContent };
}

// Test HTML email templates
async function testHtmlTemplate(template) {
  console.log(`\n📧 Testing HTML Template: ${template.name}`);
  console.log(`   File: ${template.file}`);
  console.log(`   Customer: ${template.customerName}`);
  console.log(`   Description: ${template.description}`);
  
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
        subject: `[TEST] ${template.name} - JME FIT`,
        html: emailHtml,
        text: `Test email for ${template.name}. Customer: ${template.customerName}`,
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

// Test conversion-optimized emails
async function testConversionEmail(email) {
  console.log(`\n🎯 Testing Conversion Email: ${email.name}`);
  console.log(`   Segment: ${email.segment}`);
  console.log(`   Customer: ${email.customerName}`);
  console.log(`   Description: ${email.description}`);
  
  try {
    const { subject, html } = generateConversionEmail(email.segment, email.customerName);
    
    const response = await fetch(`${BASE_URL}/.netlify/functions/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: TEST_EMAIL,
        subject: `[TEST] ${subject}`,
        html: html,
        text: `Conversion test email for ${email.name}. Segment: ${email.segment}`,
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

// Main test function
async function runComprehensiveTests() {
  const results = [];
  
  console.log('\n🔥 PHASE 1: HTML EMAIL TEMPLATES');
  console.log('Testing all 9 HTML templates from src/emails/');
  console.log('-'.repeat(80));
  
  for (const template of HTML_EMAIL_TEMPLATES) {
    const result = await testHtmlTemplate(template);
    results.push({
      type: 'HTML Template',
      name: template.name,
      success: result.success,
      error: result.error
    });
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎯 PHASE 2: CONVERSION-OPTIMIZED EMAILS');
  console.log('Testing lead segmentation and conversion emails');
  console.log('-'.repeat(80));
  
  for (const email of CONVERSION_EMAILS) {
    const result = await testConversionEmail(email);
    results.push({
      type: 'Conversion Email',
      name: email.name,
      success: result.success,
      error: result.error
    });
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(80));
  
  const totalTests = results.length;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`✅ Successful: ${successful}/${totalTests} (${Math.round(successful/totalTests*100)}%)`);
  console.log(`❌ Failed: ${failed}/${totalTests} (${Math.round(failed/totalTests*100)}%)`);
  
  // Break down by type
  const htmlResults = results.filter(r => r.type === 'HTML Template');
  const conversionResults = results.filter(r => r.type === 'Conversion Email');
  
  console.log(`\n📧 HTML TEMPLATES: ${htmlResults.filter(r => r.success).length}/${htmlResults.length} successful`);
  console.log(`🎯 CONVERSION EMAILS: ${conversionResults.filter(r => r.success).length}/${conversionResults.length} successful`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.type}: ${r.name} - ${r.error}`);
    });
  }
  
  if (successful > 0) {
    console.log('\n✅ SUCCESSFUL TESTS:');
    results.filter(r => r.success).forEach(r => {
      console.log(`   • ${r.type}: ${r.name}`);
    });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check your email inbox for ALL test emails');
  console.log('2. Verify email formatting and mobile responsiveness');
  console.log('3. Test all links in each email template');
  console.log('4. Verify logo displays correctly (not inverted)');
  console.log('5. Check conversion emails for proper segmentation');
  console.log('6. Integrate with Stripe webhooks for automatic sending');
  
  console.log(`\n📧 Total emails sent to ${TEST_EMAIL}: ${successful}`);
  
  return results;
}

// Run the comprehensive tests
runComprehensiveTests()
  .then(() => {
    console.log('\n✅ COMPREHENSIVE EMAIL TESTING COMPLETED!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ COMPREHENSIVE EMAIL TESTING FAILED:', error);
    process.exit(1);
  }); 