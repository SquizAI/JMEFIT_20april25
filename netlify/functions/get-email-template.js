const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { templateId } = event.queryStringParameters || {};
    
    if (!templateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Template ID is required' })
      };
    }

    // Map template IDs to file names
    const templateMap = {
      'welcome': 'welcome.html',
      'password-reset': 'password-reset.html',
      'verification': 'verification.html',
      'subscription-confirmation': 'subscription-confirmation.html',
      'thank-you': 'thank-you.html',
      'cold-lead-welcome': 'cold-lead-welcome.html',
      'warm-lead-welcome': 'warm-lead-welcome.html',
      'hot-lead-welcome': 'hot-lead-welcome.html',
      'one-time-macros-welcome': 'one-time-macros-welcome.html',
      'self-led-training-welcome': 'self-led-training-welcome.html',
      'shred-challenge-welcome': 'shred-challenge-welcome.html',
      'nutrition-programs-welcome': 'nutrition-programs-welcome.html'
    };

    const filename = templateMap[templateId];
    if (!filename) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Template not found' })
      };
    }

    // Read the HTML file
    const templatePath = path.join(__dirname, '../../src/emails', filename);
    const html = await fs.readFile(templatePath, 'utf8');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/html'
      },
      body: html
    };

  } catch (error) {
    console.error('Error loading template:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to load template' })
    };
  }
}; 