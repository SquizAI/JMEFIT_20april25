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

  if (!template || !emailTemplates[template]) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid template name' })
    };
  }

  try {
    // In development, read from src/emails
    // In production, these would be bundled or stored elsewhere
    const templatePath = path.join(__dirname, '../../src/emails', emailTemplates[template]);
    const htmlContent = await fs.readFile(templatePath, 'utf-8');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      },
      body: htmlContent
    };
  } catch (error) {
    console.error('Error reading template:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load template' })
    };
  }
}; 