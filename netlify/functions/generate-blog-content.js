const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.handler = async (event, context) => {
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
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional fitness and nutrition content writer with expertise in creating engaging, SEO-optimized blog posts. Always format your response as valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    
    // Parse the JSON response
    let blogData;
    try {
      blogData = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        blogData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
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