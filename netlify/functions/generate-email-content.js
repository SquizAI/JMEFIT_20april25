const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

Make the content engaging, personal, and focused on transformation and results. Use "you" language and be conversational.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness and nutrition email copywriter. Generate compelling, conversion-focused email content that motivates and inspires action.'
        },
        {
          role: 'user',
          content: fullPrompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const generatedContent = JSON.parse(completion.choices[0].message.content);

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