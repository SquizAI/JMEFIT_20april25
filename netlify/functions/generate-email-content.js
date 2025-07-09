const { GoogleGenerativeAI } = require('@google/generative-ai');

// Sample content from existing JMEFIT emails
const brandVoice = {
  greetings: ['Hey there!', 'Welcome!', 'Hi Friend!', 'Hello!'],
  signoffs: ['Your coach,', 'In your corner,', 'Cheering you on,', 'Stay strong,'],
  motivational: [
    'You\'ve got this!',
    'Every journey starts with a single step.',
    'Your transformation starts now.',
    'It\'s time to become the best version of yourself.',
    'Let\'s crush those goals together!'
  ],
  cta: {
    welcome: ['Get Started', 'Begin Your Journey', 'Start Now', 'Join Us'],
    promotional: ['Claim Your Discount', 'Save Now', 'Get This Deal', 'Shop Now'],
    newsletter: ['Read More', 'Learn More', 'Discover More', 'Continue Reading'],
    reminder: ['Complete Setup', 'Take Action', 'Don\'t Miss Out', 'Act Now'],
    'thank-you': ['Explore More', 'Visit Dashboard', 'Share Your Story', 'Join Community']
  }
};

const discountCodes = [
  'SHRED20', 'TRANSFORM25', 'JMEFIT15', 'NEWSTART30', 'FITFAM20',
  'NUTRITION25', 'SUMMER30', 'WELCOME15', 'STRONGER20', 'GOALS25'
];

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

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

  try {
    const { systemPrompt, userPrompt, emailType, tone, includeDiscount } = JSON.parse(event.body);

    const fullPrompt = `${systemPrompt}

Generate email content for JMEFIT. Return a JSON object with these fields:
- subject: Email subject line (compelling and under 60 characters)
- headerText: Main header text
- introText: Opening paragraph (2-3 sentences)
- ctaText: Call-to-action button text
- ctaUrl: Relevant URL (use https://jmefit.com or appropriate path)
- bodyText: Additional body content (1-2 paragraphs)
${includeDiscount ? '- discountCode: A discount code (uppercase, 6-10 characters)\n- discountDescription: What the discount offers\n- discountExpiry: When it expires (e.g., "Valid until December 31, 2024")' : ''}

Email type: ${emailType}
User request: ${userPrompt}

Make the content engaging, personal, and focused on transformation and results. Use "you" language and be conversational.

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`;

    // Use Gemini Pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let generatedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        generatedContent = JSON.parse(text);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      throw new Error('Failed to parse AI response');
    }

    // Add brand-appropriate defaults if needed
    if (!generatedContent.headerText) {
      generatedContent.headerText = emailType === 'welcome' ? 'Welcome to JMEFIT!' : 'Important Update from JMEFIT';
    }

    if (!generatedContent.ctaUrl) {
      generatedContent.ctaUrl = 'https://jmefit.com';
    }

    if (includeDiscount && !generatedContent.discountCode) {
      generatedContent.discountCode = discountCodes[Math.floor(Math.random() * discountCodes.length)];
      generatedContent.discountDescription = 'Special offer just for you';
      generatedContent.discountExpiry = 'Limited time only';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generatedContent)
    };

  } catch (error) {
    console.error('Error generating email content:', error);
    
    // Fallback content if AI fails
    const fallbackContent = {
      subject: `${emailType.charAt(0).toUpperCase() + emailType.slice(1)} from JMEFIT`,
      headerText: 'Welcome to JMEFIT!',
      introText: 'We\'re excited to have you join our community of fitness enthusiasts.',
      ctaText: brandVoice.cta[emailType]?.[0] || 'Get Started',
      ctaUrl: 'https://jmefit.com',
      bodyText: 'At JMEFIT, we believe in empowering you to reach your full potential through personalized nutrition and training programs.',
    };

    if (JSON.parse(event.body).includeDiscount) {
      fallbackContent.discountCode = 'WELCOME20';
      fallbackContent.discountDescription = 'Save 20% on your first month';
      fallbackContent.discountExpiry = 'Valid for 7 days';
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fallbackContent)
    };
  }
}; 