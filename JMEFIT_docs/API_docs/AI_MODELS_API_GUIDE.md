# JMEFIT AI Models API Guide

## Overview

This document provides comprehensive information about the AI models used in JMEFIT for blog generation, email creation, and image generation.

## Models Configuration

### 1. Gemini 2.5 (Google AI)

**Used for**: Blog content generation

**Models Available**:
- `gemini-2.5-flash` - Fastest, recommended for production
- `gemini-2.5-pro` - More capable but slower

**Features**:
- Structured output with JSON schema
- Native multimodal capabilities
- Excellent at long-form content generation

**API Configuration**:
```javascript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
});

// With structured output
const result = await model.generateContent({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        // ... other fields
      },
      required: ["title", "content"],
      propertyOrdering: ["title", "content"]
    }
  }
});
```

### 2. OpenAI GPT Models

#### GPT-4o-2024-08-06
**Used for**: Email content generation with structured outputs

**Features**:
- Structured output support
- JSON mode for guaranteed formatting
- Excellent instruction following

**API Configuration**:
```javascript
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: "gpt-4o-2024-08-06",
  messages: [{ role: "user", content: prompt }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "email_content",
      schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          preheader: { type: "string" },
          body: { type: "string" }
        },
        required: ["subject", "preheader", "body"]
      }
    }
  }
});
```

### 3. OpenAI Image Generation

#### GPT-Image-1 (Latest Model)
**Used for**: High-quality image generation

**Key Features**:
- Natively multimodal language model
- Superior instruction following
- Text rendering capabilities
- Real-world knowledge
- Transparent background support
- Inpainting (mask-based editing)

**Pricing** (per image):
- Low quality (1024×1024): ~$0.02
- Medium quality (1024×1024): ~$0.07
- High quality (1024×1024): ~$0.19

**API Configuration**:
```javascript
// Image API
const result = await openai.images.generate({
  model: "gpt-image-1",
  prompt: imagePrompt,
  size: "1536x1024", // landscape
  quality: "high",
  background: "transparent", // optional
  output_format: "png",
  n: 1
});

// For editing with mask
const editResult = await openai.images.edit({
  model: "gpt-image-1",
  image: fs.createReadStream("input.png"),
  mask: fs.createReadStream("mask.png"),
  prompt: "Edit description"
});
```

**Supported Sizes**:
- Square: 1024×1024
- Landscape: 1536×1024
- Portrait: 1024×1536
- Auto: Let model decide

**Quality Options**:
- `low` - Fastest, 272-400 tokens
- `medium` - Balanced, 1056-1584 tokens
- `high` - Best quality, 4160-6240 tokens
- `auto` - Model decides

#### DALL-E 3 (Fallback)
**Used as**: Fallback when gpt-image-1 is unavailable

**Supported Sizes**:
- 1024×1024
- 1792×1024
- 1024×1792

## Implementation Examples

### Blog Generation (Gemini 2.5)
```javascript
// netlify/functions/generate-blog-content.js
const responseSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    excerpt: { type: "string" },
    content: { type: "string" },
    metaDescription: { type: "string" },
    category: { 
      type: "string",
      enum: ["workout", "nutrition", "lifestyle", "mindset", "success-stories", "tips"]
    },
    tags: { type: "array", items: { type: "string" } },
    seoKeywords: { type: "array", items: { type: "string" } }
  },
  required: ["title", "slug", "excerpt", "content", "metaDescription", "category", "tags", "seoKeywords"],
  propertyOrdering: ["title", "slug", "excerpt", "content", "metaDescription", "category", "tags", "seoKeywords"]
};
```

### Email Generation (OpenAI)
```javascript
// netlify/functions/generate-email-ai.js
const completion = await openai.chat.completions.create({
  model: "gpt-4o-2024-08-06",
  messages: [{
    role: "system",
    content: "You are an expert email designer..."
  }, {
    role: "user",
    content: prompt
  }],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "email_content",
      schema: emailSchema
    }
  }
});
```

### Image Generation (OpenAI)
```javascript
// netlify/functions/generate-blog-image.js
try {
  // Try gpt-image-1 first
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt: imagePrompt,
    size: "1536x1024",
    quality: "high",
    n: 1
  });
  return result.data[0].url;
} catch (error) {
  // Fallback to DALL-E 3
  const result = await openai.images.generate({
    model: "dall-e-3",
    prompt: imagePrompt,
    size: "1792x1024",
    quality: "hd",
    n: 1
  });
  return result.data[0].url;
}
```

## Best Practices

### 1. Error Handling
Always implement fallbacks:
```javascript
try {
  // Try primary model
} catch (error) {
  if (error.message?.includes('model')) {
    // Try fallback model
  } else {
    throw error;
  }
}
```

### 2. Timeout Management
- Set appropriate timeouts for Netlify functions (28 seconds max)
- Consider splitting image generation into separate API calls
- Use placeholder images when generation fails

### 3. Structured Output
- Always use structured output when available
- Define clear schemas with required fields
- Use propertyOrdering for consistent results

### 4. Cost Optimization
- Use appropriate quality settings
- Consider caching generated content
- Monitor token usage for text models

## Environment Variables

Required in Netlify:
```
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

## Rate Limits

### Gemini
- Varies by model and tier
- Generally generous for production use

### OpenAI GPT-Image-1
| Tier | Tokens/Min | Images/Min |
|------|------------|------------|
| Tier 1 | 100,000 | 5 |
| Tier 2 | 250,000 | 20 |
| Tier 3 | 800,000 | 50 |
| Tier 4 | 3,000,000 | 150 |
| Tier 5 | 8,000,000 | 250 |

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Reduce image quality
   - Remove automatic image generation
   - Use faster models (gemini-2.5-flash)

2. **Model Not Available**
   - Implement fallback models
   - Check API organization verification
   - Verify API keys

3. **Structured Output Errors**
   - Validate schema syntax
   - Ensure all required fields are defined
   - Check propertyOrdering matches schema

## Future Considerations

1. **Responses API Support**
   - GPT-Image-1 will support Responses API soon
   - Enables multi-turn image editing
   - Streaming partial images

2. **Model Updates**
   - Monitor for new model releases
   - Test performance improvements
   - Update fallback strategies

## References

- [Gemini Structured Output](https://ai.google.dev/gemini-api/docs/structured-output)
- [OpenAI Image Generation](https://platform.openai.com/docs/guides/image-generation)
- [GPT-Image-1 Documentation](https://platform.openai.com/docs/models/gpt-image-1) 