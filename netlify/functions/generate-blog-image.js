const { GoogleGenAI } = require('@google/genai');

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

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { topic, style, keywords, aspectRatio } = JSON.parse(event.body);

    if (!topic) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Topic is required' })
      };
    }

    // Map aspect ratio to supported sizes for Imagen 4
    let imageAspectRatio = '1:1'; // Default square
    switch (aspectRatio) {
      case 'landscape':
        imageAspectRatio = '16:9';
        break;
      case 'portrait':
        imageAspectRatio = '9:16';
        break;
      case 'square':
      default:
        imageAspectRatio = '1:1';
        break;
    }

    // Create a comprehensive prompt for the image
    const imagePrompt = `Create a professional blog header image for JME FIT fitness and nutrition blog.

    Topic: ${topic}
    Style: ${style || 'Modern, clean, professional fitness photography'}
    Keywords to incorporate visually: ${keywords?.join(', ') || 'fitness, health, wellness'}

    Requirements:
    - High-quality, photorealistic or stylized based on context
    - Include subtle JME FIT branding elements
    - Use purple (#8B5CF6) as an accent color where appropriate
    - Suitable for a professional fitness blog
    - Eye-catching and motivational
    - No text or typography in the image`;

    // Generate the image using Imagen 4.0 Fast (latest model)
    const response = await genAI.models.generateImages({
      model: 'imagen-4.0-fast-generate-001', // Latest Imagen 4, fastest generation
      prompt: imagePrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: imageAspectRatio,
        outputMimeType: 'image/jpeg',
        outputCompressionQuality: 90, // High quality
        personGeneration: 'allow_adult', // Allow people in fitness images
        safetyFilterLevel: 'block_few', // Balanced safety filtering
        enhancePrompt: true // Let Imagen enhance the prompt for better results
      }
    });

    // Check if we got a valid response
    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('No images generated');
    }

    const generatedImage = response.generatedImages[0];

    // Check for safety filtering
    if (generatedImage.raiFilteredReason) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Image generation blocked by safety filters',
          reason: generatedImage.raiFilteredReason
        })
      };
    }

    // Extract base64 image data
    const base64ImageBytes = generatedImage.image?.imageBytes;
    if (!base64ImageBytes) {
      throw new Error('No image data in response');
    }

    // Create data URL for the image
    const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

    // Return the image data
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        image: {
          base64: base64ImageBytes,
          url: imageUrl,
          prompt: imagePrompt,
          enhancedPrompt: generatedImage.enhancedPrompt,
          aspectRatio: imageAspectRatio,
          model: 'imagen-4.0-fast-generate-001',
          mimeType: 'image/jpeg'
        }
      })
    };

  } catch (error) {
    console.error('Error generating blog image:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate blog image',
        message: error.message
      })
    };
  }
};
