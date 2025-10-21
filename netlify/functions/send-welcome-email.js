// Netlify Function for sending package-specific welcome emails
// This endpoint will be available at /.netlify/functions/send-welcome-email

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

// Email template mapping
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
    const { customerEmail, customerName, packageName, stripeProductId, isTest } = JSON.parse(event.body);

    if (!customerEmail || !customerName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer email and name are required' }),
      };
    }

    console.log(`📧 Sending welcome email to: ${customerEmail}`);
    console.log(`📦 Package: ${packageName}`);
    console.log(`🆔 Product ID: ${stripeProductId}`);
    console.log(`🧪 Test mode: ${isTest}`);

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

    // Load email template - try multiple paths
    let emailTemplate;
    const possiblePaths = [
      path.join(__dirname, 'emails', templateFile),
      path.join(process.cwd(), 'src', 'emails', templateFile),
      path.join(__dirname, '..', '..', 'src', 'emails', templateFile),
      path.join('/opt/build/repo/src/emails', templateFile),
      path.join('/var/task/src/emails', templateFile)
    ];
    
    console.log(`🔍 Trying to load template: ${templateFile}`);
    console.log(`📁 Working directory: ${process.cwd()}`);
    console.log(`📁 Function directory: ${__dirname}`);
    
    for (const templatePath of possiblePaths) {
      try {
        console.log(`🔍 Trying path: ${templatePath}`);
        emailTemplate = await fs.readFile(templatePath, 'utf8');
        console.log(`✅ Template loaded successfully from: ${templatePath}`);
        break;
      } catch (pathError) {
        console.log(`❌ Path failed: ${templatePath} - ${pathError.message}`);
        continue;
      }
    }
    
    if (!emailTemplate) {
      console.error(`❌ Could not find template: ${templateFile}`);
      // Fallback to a simple HTML template
      emailTemplate = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="{{LOGO_URL}}" alt="JME FIT" style="max-width: 200px; height: auto;">
            </div>
            <h1 style="color: #8B5CF6; text-align: center;">Welcome to JME FIT!</h1>
            <p>Hi {{CUSTOMER_NAME}},</p>
            <p>Welcome to your fitness journey with JME FIT! We're excited to have you on board.</p>
            <p>Your package: <strong>{{PACKAGE_NAME}}</strong></p>
            <p>We'll be in touch soon with more details about your program.</p>
            <p>Best regards,<br>The JME FIT Team</p>
          </body>
        </html>
      `;
      console.log(`📧 Using fallback template`);
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Replace template variables
    const logoUrl = 'https://jmefit.com/JME_fit_black_purple.png';
    const unsubscribeUrl = `https://jmefit.com/unsubscribe?email=${encodeURIComponent(customerEmail)}`;
    const privacyUrl = 'https://jmefit.com/privacy';
    
    let processedTemplate = emailTemplate
      .replace(/{{CUSTOMER_NAME}}/g, customerName)
      .replace(/{{PACKAGE_NAME}}/g, packageName || 'JME FIT Program')
      .replace(/{{LOGO_URL}}/g, logoUrl)
      .replace(/{{UNSUBSCRIBE_URL}}/g, unsubscribeUrl)
      .replace(/{{PRIVACY_URL}}/g, privacyUrl);

    // Get subject line
    const subject = EMAIL_SUBJECTS[templateFile] || 'Welcome to JME FIT! 🎉';

    // Email options
    const mailOptions = {
      from: process.env.DEFAULT_FROM_EMAIL || 'JME FIT Team <info@jmefit.com>',
      to: customerEmail,
      subject: isTest ? `[TEST] ${subject}` : subject,
      html: processedTemplate,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Welcome email sent successfully to ${customerEmail}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Welcome email sent successfully',
        messageId: info.messageId,
        templateUsed: templateFile,
        recipient: customerEmail,
      }),
    };

  } catch (error) {
    console.error('❌ Error sending welcome email:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
}; 