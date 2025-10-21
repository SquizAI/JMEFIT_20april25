const fs = require('fs').promises;
const path = require('path');

// Map of template IDs to HTML file names
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

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { templateId, variables } = event.httpMethod === 'GET' 
      ? event.queryStringParameters || {}
      : JSON.parse(event.body || '{}');
    
    if (!templateId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Template ID is required' })
      };
    }

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
    let html = await fs.readFile(templatePath, 'utf8');

    // If variables are provided, replace them
    if (variables) {
      const vars = typeof variables === 'string' ? JSON.parse(variables) : variables;
      
      // Set default values
      const defaults = {
        logoUrl: 'https://jmefit.com/JME_fit_black_purple.png',
        privacyUrl: 'https://jmefit.com/privacy',
        unsubscribeUrl: 'https://jmefit.com/unsubscribe',
        dashboardUrl: 'https://jmefit.com/dashboard',
        ...vars
      };
      
      // Replace all variables
      Object.entries(defaults).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, value || '');
      });
    }

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
      body: JSON.stringify({ error: 'Failed to load template', details: error.message })
    };
  }
}; 