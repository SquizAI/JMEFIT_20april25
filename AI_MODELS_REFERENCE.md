# AI Models Reference Guide
**Last Updated:** October 21, 2025

This document outlines all AI models used in the JMEFIT application with their latest versions and configurations.

---

## 🤖 Google Gemini Models

### Text Generation

#### Primary Model: `gemini-2.5-flash`
- **Status:** ✅ Latest (October 2025)
- **Best for:** General text generation, chat, content creation
- **Speed:** Fastest Gemini model
- **Context window:** Large
- **Used in:**
  - `generate-blog-content.js`
  - `generate-email-content.js`
  - `generate-email-ai.js`

**Example Usage:**
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048,
  }
});

const result = await model.generateContent(prompt);
const text = result.response.text();
```

#### Alternative: `gemini-2.0-flash`
- **Status:** ✅ Supported
- **Best for:** Similar to 2.5-flash but slightly older
- **Speed:** Very fast
- **Use case:** Fallback or specific features

### Image Generation

#### Primary Model: `imagen-4.0-fast-generate-001`
- **Status:** ✅ Latest Imagen 4 (October 2025)
- **Best for:** Fast, high-quality image generation
- **Aspect Ratios:** 1:1, 3:4, 4:3, 9:16, 16:9
- **Output Formats:** JPEG, PNG
- **Used in:**
  - `generate-blog-image.js`

**Features:**
- Prompt enhancement
- Safety filtering
- Person generation controls
- High compression quality (up to 100)

**Example Usage:**
```javascript
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateImages({
  model: 'imagen-4.0-fast-generate-001',
  prompt: 'A serene mountain landscape at sunset',
  config: {
    numberOfImages: 1,
    aspectRatio: '16:9',
    outputMimeType: 'image/jpeg',
    outputCompressionQuality: 90,
    personGeneration: 'allow_adult',
    safetyFilterLevel: 'block_few',
    enhancePrompt: true
  }
});

const base64Image = response.generatedImages[0].image.imageBytes;
```

#### Alternative Models

**`imagen-3.0-generate-002`**
- Status: ⚠️ Previous generation
- Best for: Compatibility, specific features
- Still supported but Imagen 4 is recommended

**`gemini-2.5-flash-image-preview`**
- Status: ⚠️ Experimental
- Best for: Image editing and generation via Gemini
- Use case: Editing existing images

**`gemini-2.0-flash-preview-image-generation`**
- Status: ❌ **DEPRECATED** - Retiring October 31, 2025
- **DO NOT USE** - Switch to Imagen 4

---

## 🖼️ OpenAI Models (Optional)

### Image Generation (If needed as fallback)

#### `dall-e-3`
- **Status:** ✅ Latest OpenAI image model
- **Best for:** High-quality, creative image generation
- **Sizes:** 1024x1024, 1792x1024, 1024x1792
- **Quality:** Standard or HD
- **Style:** Vivid or Natural
- **Currently:** Not used (switched to Imagen 4)

**Example Usage:**
```javascript
const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await client.images.generate({
  model: 'dall-e-3',
  prompt: 'A serene mountain landscape at sunset',
  n: 1,
  size: '1024x1024',
  quality: 'hd',
  style: 'vivid',
  response_format: 'url'
});
```

#### `dall-e-2`
- **Status:** ⚠️ Previous generation
- **Best for:** Image variations and editing
- **Features:** Supports variations and mask-based editing
- **Use case:** Legacy or specific editing needs

---

## 📊 Model Comparison

### Text Generation

| Model | Speed | Quality | Cost | Context | Best Use |
|-------|-------|---------|------|---------|----------|
| `gemini-2.5-flash` | ⚡⚡⚡ | ⭐⭐⭐⭐ | $ | Large | Production |
| `gemini-2.0-flash` | ⚡⚡⚡ | ⭐⭐⭐⭐ | $ | Large | Alternative |
| `gemini-pro` | ⚡⚡ | ⭐⭐⭐⭐⭐ | $$ | Medium | ❌ Deprecated |

### Image Generation

| Model | Speed | Quality | Features | Best Use |
|-------|-------|---------|----------|----------|
| `imagen-4.0-fast` | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | All | **Recommended** |
| `imagen-3.0` | ⚡⚡ | ⭐⭐⭐⭐ | Most | Legacy |
| `gemini-2.5-flash-image` | ⚡⚡⚡ | ⭐⭐⭐⭐ | Editing | Experimental |
| `dall-e-3` | ⚡ | ⭐⭐⭐⭐⭐ | Creative | Optional fallback |
| `dall-e-2` | ⚡⚡ | ⭐⭐⭐ | Editing | Legacy |

---

## 🔧 Configuration Guide

### Environment Variables Required

```bash
# Gemini (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI (Optional - only if using DALL-E)
OPENAI_API_KEY=your_openai_api_key_here
```

### Generation Parameters

#### Text Generation
```javascript
{
  temperature: 0.7,        // 0.0 = Deterministic, 1.0 = Creative
  maxOutputTokens: 2048,   // Max length of response
  topP: 0.95,              // Nucleus sampling
  topK: 40,                // Top-k sampling
}
```

#### Image Generation (Imagen 4)
```javascript
{
  numberOfImages: 1,                    // 1-4 images
  aspectRatio: '16:9',                  // '1:1', '3:4', '4:3', '9:16', '16:9'
  outputMimeType: 'image/jpeg',         // 'image/jpeg' or 'image/png'
  outputCompressionQuality: 90,         // 1-100 (JPEG only)
  personGeneration: 'allow_adult',      // 'allow_adult', 'dont_allow'
  safetyFilterLevel: 'block_few',       // 'block_few', 'block_some', 'block_most'
  enhancePrompt: true,                  // Let AI enhance your prompt
  negativePrompt: 'text, watermark'     // What to avoid
}
```

---

## 📝 Function Reference

### Updated Functions

| Function | Model | Version | Status |
|----------|-------|---------|--------|
| `generate-blog-content.js` | `gemini-2.5-flash` | Latest | ✅ Updated |
| `generate-email-content.js` | `gemini-2.5-flash` | Latest | ✅ Updated |
| `generate-email-ai.js` | `gemini-2.5-flash` | Latest | ✅ Updated |
| `generate-blog-image.js` | `imagen-4.0-fast-generate-001` | Latest | ✅ Updated |

### Deprecated Functions

| Function | Old Model | Action Required |
|----------|-----------|-----------------|
| `generate-email-ai-openai.js.backup` | OpenAI GPT-4 | ⚠️ Backup only |

---

## 🚀 Migration Guide

### From OpenAI to Gemini (Completed ✅)

**Text Generation:**
```javascript
// ❌ OLD (OpenAI)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }]
});

// ✅ NEW (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const result = await model.generateContent(prompt);
const text = result.response.text();
```

**Image Generation:**
```javascript
// ❌ OLD (DALL-E 3)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const response = await openai.images.generate({
  model: 'dall-e-3',
  prompt: imagePrompt,
  size: '1024x1024'
});

// ✅ NEW (Imagen 4)
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await genAI.models.generateImages({
  model: 'imagen-4.0-fast-generate-001',
  prompt: imagePrompt,
  config: { aspectRatio: '1:1' }
});
```

---

## ⚡ Performance Tips

### Text Generation
1. **Use `gemini-2.5-flash`** for speed and quality balance
2. Set appropriate `maxOutputTokens` to avoid waste
3. Use `temperature: 0.7-0.9` for creative content
4. Use `temperature: 0.1-0.3` for factual content

### Image Generation
1. **Use `imagen-4.0-fast`** for best speed/quality
2. Enable `enhancePrompt: true` for better results
3. Set appropriate `outputCompressionQuality` (80-90 is good)
4. Use specific aspect ratios for your use case
5. Always check `raiFilteredReason` for safety blocks

---

## 🔒 Security Best Practices

1. **Never expose API keys in client code**
   - ❌ `VITE_GEMINI_API_KEY` (exposed to client)
   - ✅ `GEMINI_API_KEY` (server-side only)

2. **Always use environment variables**
   ```javascript
   const apiKey = process.env.GEMINI_API_KEY;
   if (!apiKey) throw new Error('API key not configured');
   ```

3. **Implement rate limiting** for API calls
4. **Monitor costs** in Google Cloud Console
5. **Set reasonable token limits** to prevent abuse

---

## 📊 Cost Optimization

### Gemini Pricing (As of Oct 2025)

**Text Generation (gemini-2.5-flash):**
- Input: ~$0.075 per 1M tokens
- Output: ~$0.30 per 1M tokens
- **Very cost-effective for production**

**Image Generation (imagen-4.0-fast):**
- ~$0.02 per image (fast model)
- ~$0.04 per image (standard model)

### Tips to Reduce Costs
1. Use Flash models instead of Pro
2. Set appropriate `maxOutputTokens`
3. Cache responses when possible
4. Use structured output to reduce tokens
5. Batch requests when possible

---

## 🆘 Troubleshooting

### Common Issues

**"API key not configured"**
```javascript
// Solution: Check environment variable
console.log('GEMINI_API_KEY is set:', !!process.env.GEMINI_API_KEY);
```

**"Model not found"**
- Ensure you're using the correct model name
- Check for typos: `gemini-2.5-flash` not `gemini-2-5-flash`

**Image generation blocked by safety filters**
```javascript
if (generatedImage.raiFilteredReason) {
  console.log('Filtered:', generatedImage.raiFilteredReason);
  // Adjust prompt or safety settings
}
```

**Rate limit errors**
- Implement exponential backoff
- Consider request batching
- Monitor your quota in Google Cloud Console

---

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Imagen 4 Guide](https://cloud.google.com/vertex-ai/generative-ai/docs/image/overview)
- [Google GenAI JavaScript SDK](https://github.com/googleapis/js-genai)
- [OpenAI API Documentation](https://platform.openai.com/docs) (if using as fallback)

---

## ✅ Summary of Updates (October 2025)

- ✅ All text generation updated to `gemini-2.5-flash`
- ✅ Image generation migrated from OpenAI DALL-E to `imagen-4.0-fast-generate-001`
- ✅ Removed dependency on `OPENAI_API_KEY` for core functionality
- ✅ Updated all function configurations for latest models
- ✅ Improved error handling and safety filtering
- ✅ Enhanced prompt quality with Imagen 4's prompt enhancement

**Result:** Faster, more cost-effective, and higher quality AI generation across the entire platform.
