const fs = require('fs').promises;
const path = require('path');

const emailTemplates = {
  'welcome.html': 'welcome.html',
  'password-reset.html': 'password-reset.html',
  'subscription-confirmation.html': 'subscription-confirmation.html',
  'thank-you.html': 'thank-you.html',
  'verification.html': 'verification.html',
  'cold-lead-welcome.html': 'cold-lead-welcome.html',
  'warm-lead-welcome.html': 'warm-lead-welcome.html',
  'hot-lead-welcome.html': 'hot-lead-welcome.html',
  'one-time-macros-welcome.html': 'one-time-macros-welcome.html',
  'self-led-training-welcome.html': 'self-led-training-welcome.html',
  'shred-challenge-welcome.html': 'shred-challenge-welcome.html',
  'nutrition-programs-welcome.html': 'nutrition-programs-welcome.html'
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const { template } = event.queryStringParameters || {};

  if (!template) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid template name' })
    };
  }

  // For now, return a placeholder HTML that indicates which template was requested
  // In production, these would be stored in a database or CDN
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Email Template: ${template}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 10px;
        }
        .content {
          padding: 30px;
          background: #f8f9fa;
          margin-top: 20px;
          border-radius: 10px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background: #667eea;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>JMEFIT Email Template</h1>
        <p>Template: ${template}</p>
      </div>
      <div class="content">
        <h2>This is a placeholder for the ${template} template</h2>
        <p>The actual email templates are beautifully designed HTML files with:</p>
        <ul>
          <li>Purple gradient headers</li>
          <li>Responsive design</li>
          <li>Call-to-action buttons</li>
          <li>Professional typography</li>
        </ul>
        <p>To view the actual templates, they need to be stored in a database or CDN accessible to Netlify functions.</p>
        <a href="https://jmefit.com" class="button">Visit JMEFIT</a>
      </div>
    </body>
    </html>
  `;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600'
    },
    body: htmlContent
  };
}; 