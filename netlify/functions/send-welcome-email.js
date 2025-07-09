// Netlify Function for sending package-specific welcome emails
// This endpoint will be available at /.netlify/functions/send-welcome-email

const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Email template mapping based on package names and Stripe product IDs
const EMAIL_TEMPLATE_MAP = {
  // Stripe Product IDs to email templates
  'prod_SKFZTSQzWRzlDY': 'nutrition-programs-welcome.html', // Nutrition Only
  'prod_SKFZCf3jJcOY2r': 'nutrition-programs-welcome.html', // Nutrition & Training
  'prod_SKFZ9bT2D7uuwg': 'self-led-training-welcome.html',  // Self-Led Training
  'prod_SKFYozPo80X30O': 'self-led-training-welcome.html',  // Trainer Feedback (uses same template as self-led)
  'prod_SKFYIDF5hBEx3o': 'shred-challenge-welcome.html',    // SHRED Challenge
  'prod_SKFYTOlWTNVH7o': 'one-time-macros-welcome.html',   // One-Time Macros
  
  // Package name fallbacks
  'nutrition only': 'nutrition-programs-welcome.html',
  'nutrition & training': 'nutrition-programs-welcome.html',
  'nutrition and training': 'nutrition-programs-welcome.html',
  'self-led training': 'self-led-training-welcome.html',
  'trainer feedback': 'self-led-training-welcome.html',
  'shred challenge': 'shred-challenge-welcome.html',
  'one-time macros': 'one-time-macros-welcome.html',
  'macros calculation': 'one-time-macros-welcome.html'
};

// Subject line mapping
const EMAIL_SUBJECTS = {
  'nutrition-programs-welcome.html': 'Welcome to JME FIT - Your Nutrition Journey Starts Now! 🎉',
  'self-led-training-welcome.html': 'Welcome to JME FIT - Let\'s Get You Moving! 💪',
  'shred-challenge-welcome.html': 'Welcome to the SHRED Challenge - Time to Transform! 🔥',
  'one-time-macros-welcome.html': 'Welcome to JME FIT - Your Macro Blueprint is Coming! 📊'
};

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { 
      customerEmail, 
      customerName, 
      packageName, 
      stripeProductId,
      isTest = false 
    } = JSON.parse(event.body);

    console.log(`📧 Welcome email request: ${packageName} for ${customerEmail}`);
    
    if (!customerEmail || !customerName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer email and name are required' }),
      };
    }

    // Determine which email template to use
    let templateFile = null;
    
    // First try by Stripe product ID
    if (stripeProductId && EMAIL_TEMPLATE_MAP[stripeProductId]) {
      templateFile = EMAIL_TEMPLATE_MAP[stripeProductId];
      console.log(`📧 Using template by product ID: ${templateFile}`);
    }
    // Then try by package name
    else if (packageName) {
      const packageKey = packageName.toLowerCase();
      templateFile = EMAIL_TEMPLATE_MAP[packageKey];
      console.log(`📧 Using template by package name: ${templateFile}`);
    }
    
    if (!templateFile) {
      // Default to nutrition programs template
      templateFile = 'nutrition-programs-welcome.html';
      console.log(`📧 Using default template: ${templateFile}`);
    }

    // Load email template
    const templatePath = path.join(process.cwd(), 'src', 'emails', templateFile);
    let emailTemplate;
    
    try {
      emailTemplate = await fs.readFile(templatePath, 'utf8');
    } catch (fileError) {
      console.error(`❌ Error loading template ${templateFile}:`, fileError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Email template not found: ${templateFile}` }),
      };
    }

    // Replace template variables
    const logoUrl = 'https://jmefit.com/JME_fit_black_purple.png';
    const unsubscribeUrl = `https://jmefit.com/unsubscribe?email=${encodeURIComponent(customerEmail)}`;
    const privacyUrl = 'https://jmefit.com/privacy';
    
    const personalizedEmail = emailTemplate
      .replace(/\{\{clientName\}\}/g, customerName)
      .replace(/\{\{customerName\}\}/g, customerName)
      .replace(/\{\{logoUrl\}\}/g, logoUrl)
      .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl)
      .replace(/\{\{privacyUrl\}\}/g, privacyUrl);

    // Get subject line
    const subject = isTest 
      ? `[TEST] ${EMAIL_SUBJECTS[templateFile] || 'Welcome to JME FIT!'}`
      : EMAIL_SUBJECTS[templateFile] || 'Welcome to JME FIT!';

    // Create SMTP transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || 'Jaime from JME FIT <jaime@jmefit.com>',
      to: customerEmail,
      subject: subject,
      html: personalizedEmail,
      text: `Welcome to JME FIT, ${customerName}! Please enable HTML email to view the full welcome message.`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Welcome email sent successfully to ${customerEmail}: ${info.messageId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: info.messageId,
        template: templateFile,
        recipient: customerEmail,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('❌ Welcome email error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
}; 