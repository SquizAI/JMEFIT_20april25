const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
  // Check if API key is available
  if (!process.env.VITE_GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Gemini API key not configured',
        details: 'Please set VITE_GEMINI_API_KEY in Netlify environment variables'
      })
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topic, tone, length, keywords, brand } = JSON.parse(event.body);

    // Determine word count based on length
    const wordCounts = {
      short: '300-500',
      medium: '600-800',
      long: '1000-1500'
    };
    const targetWords = wordCounts[length] || wordCounts.medium;

    // Create the prompt
    const prompt = `Create a compelling blog post for ${brand || 'JMEFIT'}, a fitness and nutrition coaching company.

Topic: ${topic}
Tone: ${tone}
Length: ${targetWords} words
Keywords to include: ${keywords?.join(', ') || 'fitness, health, wellness'}

Brand Voice: JMEFIT empowers individuals to transform their lives through personalized fitness and nutrition guidance. We focus on sustainable lifestyle changes, not quick fixes.

Please generate:
1. An engaging title
2. A compelling excerpt (2-3 sentences)
3. The full blog post content in HTML format (use proper HTML tags like <p>, <h2>, <h3>, <ul>, <li>, etc.)
4. A meta description for SEO (150-160 characters)

Format the response as JSON with these fields:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "metaDescription": "..."
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`;

    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let blogData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        blogData = JSON.parse(jsonMatch[0]);
      } else {
        blogData = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Fallback response if parsing fails
      blogData = {
        title: topic,
        excerpt: `Learn about ${topic} with JMEFIT's expert guidance.`,
        content: `<p>Content generation failed. Please try again.</p>`,
        metaDescription: `${topic} - JMEFIT Fitness & Nutrition Guide`
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blogData)
    };
  } catch (error) {
    console.error('Error generating blog content:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate blog content',
        details: error.message 
      })
    };
  }
}; 