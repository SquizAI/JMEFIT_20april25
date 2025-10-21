const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in Netlify environment variables'
      })
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topic, tone, length, keywords, brand, generateImage } = JSON.parse(event.body);

    if (!topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic is required' })
      };
    }

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

Generate a complete blog post with all necessary metadata for SEO and content management.`;

    // Define the response schema for structured output
    const responseSchema = {
      type: "object",
      properties: {
        title: { 
          type: "string",
          description: "An engaging blog post title"
        },
        slug: { 
          type: "string",
          description: "URL-friendly slug based on the title"
        },
        excerpt: { 
          type: "string",
          description: "A compelling 2-3 sentence excerpt"
        },
        content: { 
          type: "string",
          description: "Full blog post content in HTML format with proper tags like <p>, <h2>, <h3>, <ul>, <li>"
        },
        metaDescription: { 
          type: "string",
          description: "SEO meta description (150-160 characters)"
        },
        category: { 
          type: "string",
          enum: ["workout", "nutrition", "lifestyle", "mindset", "success-stories", "tips"],
          description: "Blog post category"
        },
        tags: { 
          type: "array",
          items: { type: "string" },
          description: "5-8 relevant tags for the post"
        },
        seoKeywords: { 
          type: "array",
          items: { type: "string" },
          description: "3-5 SEO keywords different from tags"
        }
      },
      required: ["title", "slug", "excerpt", "content", "metaDescription", "category", "tags", "seoKeywords"],
      propertyOrdering: ["title", "slug", "excerpt", "content", "metaDescription", "category", "tags", "seoKeywords"]
    };

    // Use gemini-2.5-flash with structured output
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    });
    
    // Configure generation with structured output
    const result = await model.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let blogData;
    try {
      blogData = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Failed to parse blog content',
          details: parseError.message 
        })
      };
    }

    // For now, always use placeholder image to avoid timeouts
    // Image generation can be done separately if needed
    const generatedImage = {
      url: 'https://jmefit.com/images/JMEFIT_photo.png',
      prompt: 'Using placeholder image - generate separately if needed',
      size: "1536x1024",
      model: 'placeholder'
    };

    // Add the image to the response
    const responseData = {
      ...blogData,
      generatedImage,
      status: 'draft' // Always start as draft
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseData)
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