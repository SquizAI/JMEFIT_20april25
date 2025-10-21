/**
 * Netlify Function: GPT-5 Chatbot
 *
 * Server-side function to handle chat requests using OpenAI's GPT-5 model.
 * This keeps the API key secure on the server side.
 */

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    const { messages, model, temperature, max_tokens } = JSON.parse(event.body);

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'OpenAI API key not configured',
          useFallback: true
        })
      };
    }

    console.log(`Making request to OpenAI with model: ${model || 'gpt-5-mini'}`);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: model || 'gpt-5-mini', // Default to gpt-5-mini for cost efficiency
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1500,
      response_format: { type: 'json_object' }
    });

    // Extract response
    const responseContent = completion.choices[0].message.content;

    console.log('OpenAI response received successfully');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: responseContent,
        model: completion.model,
        usage: completion.usage
      })
    };

  } catch (error) {
    console.error('Error calling OpenAI:', error);

    // Handle specific error types
    if (error.code === 'insufficient_quota') {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'API quota exceeded',
          useFallback: true
        })
      };
    }

    if (error.code === 'model_not_found') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Model not available. Falling back to default model.',
          useFallback: true
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        useFallback: true
      })
    };
  }
};
