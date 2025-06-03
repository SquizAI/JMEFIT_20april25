// Netlify Function for sending emails via SMTP
// This endpoint will be available at /.netlify/functions/send-email

const nodemailer = require('nodemailer');

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
    const { to, subject, html, text, from } = JSON.parse(event.body);

    console.log(`📧 Sending email: ${subject} to ${to}`);
    
    // Debug: Log available environment variables (without exposing values)
    const envKeys = Object.keys(process.env).filter(key => 
      key.includes('SMTP') || key.includes('MAIL') || key.includes('EMAIL')
    );
    console.log('Available email-related env vars:', envKeys);

    // Check for various possible environment variable names
    const smtpConfig = {
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || process.env.MAIL_HOST || 'gtxm1016.siteground.biz',
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || process.env.MAIL_PORT || '465'),
      secure: (process.env.SMTP_SECURE || process.env.EMAIL_SECURE || 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.SMTP_USERNAME || process.env.EMAIL_USER || process.env.EMAIL_USERNAME || process.env.MAIL_USER || process.env.MAIL_USERNAME,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || process.env.MAIL_PASS || process.env.MAIL_PASSWORD,
      },
    };

    console.log('SMTP Config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      hasUser: !!smtpConfig.auth.user,
      hasPass: !!smtpConfig.auth.pass,
    });

    // Validate required credentials
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'SMTP credentials not found in environment variables',
          debug: {
            availableKeys: envKeys,
            hasUser: !!smtpConfig.auth.user,
            hasPass: !!smtpConfig.auth.pass,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Email options
    const mailOptions = {
      from: from || process.env.SMTP_FROM || process.env.EMAIL_FROM || 'JMEFit Team <info@jmefit.com>',
      to: to,
      subject: subject,
      text: text,
      html: html,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      }),
    };

  } catch (error) {
    console.error('❌ Email sending error:', error);

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