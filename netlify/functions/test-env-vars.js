// Netlify Function to Test Environment Variables Configuration
// This function checks if all required environment variables are properly set

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Define all required environment variables
  const requiredVars = {
    // Stripe
    'STRIPE_SECRET_KEY': {
      required: true,
      description: 'Stripe secret key for API calls',
      sensitive: true
    },
    'STRIPE_WEBHOOK_SECRET': {
      required: true,
      description: 'Stripe webhook signing secret',
      sensitive: true
    },
    'VITE_STRIPE_PUBLISHABLE_KEY': {
      required: true,
      description: 'Stripe publishable key (public)',
      sensitive: false
    },

    // Supabase
    'VITE_SUPABASE_URL': {
      required: true,
      description: 'Supabase project URL',
      sensitive: false
    },
    'VITE_SUPABASE_ANON_KEY': {
      required: true,
      description: 'Supabase anon key (public)',
      sensitive: false
    },
    'SUPABASE_SERVICE_KEY': {
      required: true,
      description: 'Supabase service role key (private)',
      sensitive: true
    },

    // Google AI (Gemini)
    'GEMINI_API_KEY': {
      required: true,
      description: 'Google Gemini API key for AI content generation',
      sensitive: true
    },

    // Email (SMTP)
    'SMTP_HOST': {
      required: false,
      description: 'SMTP server host',
      sensitive: false
    },
    'SMTP_PORT': {
      required: false,
      description: 'SMTP server port',
      sensitive: false
    },
    'SMTP_USER': {
      required: false,
      description: 'SMTP username',
      sensitive: false
    },
    'SMTP_PASSWORD': {
      required: false,
      description: 'SMTP password',
      sensitive: true
    },
    'SMTP_SECURE': {
      required: false,
      description: 'SMTP secure connection (true/false)',
      sensitive: false
    },
    'DEFAULT_FROM_EMAIL': {
      required: false,
      description: 'Default email sender address',
      sensitive: false
    },

    // Netlify
    'URL': {
      required: false,
      description: 'Production URL (auto-set by Netlify)',
      sensitive: false
    },
    'DEPLOY_URL': {
      required: false,
      description: 'Deploy URL (auto-set by Netlify)',
      sensitive: false
    }
  };

  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.CONTEXT || 'unknown',
    status: 'checking',
    required: {
      total: 0,
      present: 0,
      missing: []
    },
    optional: {
      total: 0,
      present: 0,
      missing: []
    },
    variables: {}
  };

  // Check each variable
  for (const [varName, config] of Object.entries(requiredVars)) {
    const isSet = !!process.env[varName];
    const value = process.env[varName];

    const varStatus = {
      set: isSet,
      description: config.description,
      required: config.required
    };

    // Show partial value for non-sensitive vars, mask sensitive ones
    if (isSet) {
      if (config.sensitive) {
        varStatus.value = '***' + (value?.slice(-4) || '****');
      } else {
        varStatus.value = value?.length > 50 ? value.substring(0, 50) + '...' : value;
      }
    }

    results.variables[varName] = varStatus;

    // Track statistics
    if (config.required) {
      results.required.total++;
      if (isSet) {
        results.required.present++;
      } else {
        results.required.missing.push(varName);
      }
    } else {
      results.optional.total++;
      if (isSet) {
        results.optional.present++;
      } else {
        results.optional.missing.push(varName);
      }
    }
  }

  // Determine overall status
  if (results.required.missing.length === 0) {
    results.status = 'healthy';
    results.message = 'All required environment variables are set';
  } else {
    results.status = 'error';
    results.message = `Missing ${results.required.missing.length} required environment variable(s)`;
  }

  // Test actual connectivity to services
  results.connectivity = await testConnectivity();

  return {
    statusCode: results.status === 'healthy' ? 200 : 500,
    headers,
    body: JSON.stringify(results, null, 2)
  };
};

async function testConnectivity() {
  const tests = {
    stripe: { status: 'unknown', message: '' },
    supabase: { status: 'unknown', message: '' },
    gemini: { status: 'unknown', message: '' }
  };

  // Test Stripe
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      await stripe.balance.retrieve();
      tests.stripe = { status: 'ok', message: 'Successfully connected to Stripe API' };
    } catch (error) {
      tests.stripe = { status: 'error', message: error.message };
    }
  } else {
    tests.stripe = { status: 'skipped', message: 'No API key configured' };
  }

  // Test Supabase
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );
      const { error } = await supabase.from('profiles').select('count').limit(1);
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows" which is ok
        throw error;
      }
      tests.supabase = { status: 'ok', message: 'Successfully connected to Supabase' };
    } catch (error) {
      tests.supabase = { status: 'error', message: error.message };
    }
  } else {
    tests.supabase = { status: 'skipped', message: 'No credentials configured' };
  }

  // Test Gemini (just check if key is set, no actual API call to save quota)
  if (process.env.GEMINI_API_KEY) {
    tests.gemini = {
      status: 'ok',
      message: 'API key is configured (not tested to save quota)'
    };
  } else {
    tests.gemini = { status: 'skipped', message: 'No API key configured' };
  }

  return tests;
}
