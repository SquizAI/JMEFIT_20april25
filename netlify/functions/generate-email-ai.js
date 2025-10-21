const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  exports.handler = async (event, context) => {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Gemini API key not configured',
        details: 'Please set GEMINI_API_KEY in Netlify environment variables'
      })
    };
  };
  return;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Email content templates for different types
const EMAIL_TEMPLATES = {
  welcome: {
    structure: 'warm welcome with clear next steps',
    tone: 'friendly and encouraging',
    elements: ['personalized greeting', 'program benefits', 'getting started guide', 'primary CTA']
  },
  hero: {
    structure: 'hero banner with single CTA',
    tone: 'bold and impactful',
    elements: ['logo', 'hero image', 'headline', 'subheadline', 'primary CTA button']
  },
  newsletter: {
    structure: 'multi-section newsletter',
    tone: 'informative and engaging',
    elements: ['header with date', 'featured article', 'content sections', 'footer with links']
  },
  promotional: {
    structure: 'product-focused promotion',
    tone: 'urgent and persuasive',
    elements: ['discount banner', 'product showcase', 'benefits', 'testimonial', 'dual CTAs']
  },
  'abandoned-cart': {
    structure: 'cart recovery message',
    tone: 'helpful and incentivizing',
    elements: ['cart reminder', 'product images', 'special offer', 'urgency message', 'checkout CTA']
  },
  'follow-up': {
    structure: 'personalized follow-up',
    tone: 'caring and supportive',
    elements: ['check-in message', 'helpful resources', 'success tips', 'support CTA']
  },
  announcement: {
    structure: 'important update or news',
    tone: 'exciting and informative',
    elements: ['announcement banner', 'key details', 'what it means', 'action items']
  },
  transactional: {
    structure: 'clean transactional message',
    tone: 'clear and professional',
    elements: ['minimal header', 'personalized greeting', 'message content', 'action button', 'support info']
  }
};

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Handle both old and new parameter names
    const {
      prompt,
      template,
      emailType,
      tone = 'professional',
      length = 'medium',
      brand = 'JMEFIT',
      customizations = {},
      brandVoice
    } = body;

    // Use emailType if template is not provided (backward compatibility)
    const selectedTemplate = template || emailType || 'hero';

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing prompt' })
      };
    }

    const templateInfo = EMAIL_TEMPLATES[selectedTemplate] || EMAIL_TEMPLATES.hero;

    // Create a comprehensive prompt for the AI
    const systemPrompt = `You are an expert email designer and copywriter for ${brand}, a premium fitness brand.
    You create compelling, conversion-focused email content that follows email best practices.
    Your emails are mobile-responsive, accessible, and optimized for engagement.
    Brand voice: ${brandVoice || 'motivational, empowering, and results-driven'}
    Tone: ${tone}
    Length: ${length}

    IMPORTANT: Return ONLY a valid JSON object with this exact structure:
    {
      "subject": "string",
      "preheader": "string",
      "body": "string (complete HTML)",
      "sections": [{"type": "string", "content": "string"}],
      "metadata": {"tone": "string", "length": "string", "emailType": "string"}
    }`;

    const userPrompt = `Create email content based on this request: "${prompt}"

    Email Type: ${selectedTemplate}
    Structure: ${templateInfo.structure}
    Tone: ${templateInfo.tone}
    Required Elements: ${templateInfo.elements.join(', ')}

    Generate a complete HTML email with:
    - Compelling subject line
    - Engaging preheader text
    - Well-structured HTML body with inline styles
    - Mobile-responsive design
    - Clear call-to-action
    - Brand colors: Primary ${customizations.primaryColor || '#8B5CF6'}

    The HTML should be complete and ready to send.
    Return ONLY the JSON object, no other text.`;

    // Use Gemini 2.5 Flash (latest model - Oct 2025)
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (Gemini might include markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const aiResponse = JSON.parse(jsonText);

    // Generate the complete HTML email
    const htmlEmail = generateCompleteHTML(aiResponse, customizations, brand);

    // Return the response in the expected format
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: aiResponse.subject,
        preheader: aiResponse.preheader,
        body: htmlEmail,
        metadata: {
          ...aiResponse.metadata,
          template: selectedTemplate,
          generatedAt: new Date().toISOString()
        }
      })
    };

  } catch (error) {
    console.error('Error generating email content:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate email content',
        message: error.message
      })
    };
  }
};

function generateCompleteHTML(content, customizations, brand) {
  const { primaryColor = '#8B5CF6', fontFamily = 'Arial, sans-serif' } = customizations;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.subject}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content { padding: 20px !important; }
            .button { width: 100% !important; text-align: center !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: ${fontFamily}; background-color: #f4f4f4;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                        <td class="content" style="padding: 40px;">
                            ${content.body}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}
