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
    
    // Debug environment variables (without exposing values)
    const envVars = Object.keys(process.env).filter(key => 
      key.includes('SMTP') || key.includes('EMAIL') || key.includes('MAIL') || key.includes('DEFAULT')
    );
    console.log('📋 Available env vars:', envVars);
    
    // Check specific variables
    console.log('🔍 SMTP_HOST exists:', !!process.env.SMTP_HOST);
    console.log('🔍 SMTP_PORT exists:', !!process.env.SMTP_PORT);
    console.log('🔍 SMTP_USER exists:', !!process.env.SMTP_USER);
    console.log('🔍 SMTP_PASSWORD exists:', !!process.env.SMTP_PASSWORD);
    console.log('🔍 SMTP_SECURE exists:', !!process.env.SMTP_SECURE);

    // Create SMTP transporter using Netlify environment variables
    const transporter = nodemailer.createTransport({
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
      from: from || process.env.DEFAULT_FROM_EMAIL || 'JMEFit Team <info@jmefit.com>',
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