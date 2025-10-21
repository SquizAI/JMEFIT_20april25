# Gemini Structured Output API Documentation

**Last Updated:** October 21, 2025
**Official Docs:** https://ai.google.dev/gemini-api/docs/structured-output

---

## 📋 Overview

Gemini's structured output feature constrains model responses to follow predefined JSON schemas rather than generating unstructured text. This ensures consistent, machine-readable output formats.

### Primary Use Cases

- **Data extraction** - Parse resumes, forms, and documents into standardized databases
- **Classification** - Categorize items into predefined categories
- **API responses** - Ensure consistent, type-safe JSON output
- **Form filling** - Populate structured fields with validated data
- **E-commerce** - Extract product details, pricing, specifications

---

## 🎯 Quick Start

### Basic JSON Generation

```javascript
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "List 3 cookie recipes with ingredients and baking time.",
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          recipeName: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          bakingTimeMinutes: { type: Type.INTEGER }
        },
        required: ["recipeName", "ingredients"],
        propertyOrdering: ["recipeName", "ingredients", "bakingTimeMinutes"]
      }
    }
  }
});

const recipes = JSON.parse(response.text);
console.log(recipes);
```

### Enum Classification

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "What type of instrument is a piano?",
  config: {
    responseMimeType: "text/x.enum",
    responseSchema: {
      type: Type.STRING,
      enum: ["Percussion", "String", "Woodwind", "Brass", "Keyboard"]
    }
  }
});

console.log(response.text); // "Keyboard"
```

---

## 🏗️ JSON Schema Definition

Schemas use a subset of OpenAPI 3.0 Schema specification with custom extensions.

### Supported Types

| Type | Description | Example |
|------|-------------|---------|
| `Type.STRING` | Text values | `"Hello World"` |
| `Type.INTEGER` | Whole numbers | `42` |
| `Type.NUMBER` | Decimals | `3.14` |
| `Type.BOOLEAN` | true/false | `true` |
| `Type.ARRAY` | Lists | `["a", "b", "c"]` |
| `Type.OBJECT` | Key-value pairs | `{"name": "John"}` |

### Schema Components

```javascript
{
  type: Type.OBJECT,           // Data type
  properties: {                // Field definitions
    fieldName: {
      type: Type.STRING,
      description: "Field purpose" // Optional but recommended
    }
  },
  required: ["fieldName"],     // Mandatory fields (optional by default)
  propertyOrdering: ["fieldName"], // Order of properties (IMPORTANT!)
  enum: ["option1", "option2"] // Limited choices (for STRING/INTEGER)
}
```

### Important: Property Ordering

**Always set `propertyOrdering`** to maintain consistency:

```javascript
// ✅ CORRECT
{
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    age: { type: Type.INTEGER },
    email: { type: Type.STRING }
  },
  propertyOrdering: ["name", "age", "email"] // Explicit order
}

// ❌ WRONG - May produce inconsistent ordering
{
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    age: { type: Type.INTEGER },
    email: { type: Type.STRING }
  }
  // Missing propertyOrdering!
}
```

---

## 💼 Real-World Examples

### Example 1: Product Information Extraction

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: `Extract product details:
    "Premium Wireless Headphones - Noise cancelling, 30hr battery, $199.99"`,
  config: {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING },
        features: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        price: { type: Type.NUMBER },
        currency: { type: Type.STRING }
      },
      required: ["productName", "price"],
      propertyOrdering: ["productName", "features", "price", "currency"]
    }
  }
});

// Output:
// {
//   "productName": "Premium Wireless Headphones",
//   "features": ["Noise cancelling", "30hr battery"],
//   "price": 199.99,
//   "currency": "USD"
// }
```

### Example 2: Email Content Generation

```javascript
const emailSchema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: "Email subject line (max 60 characters)"
    },
    preheader: {
      type: Type.STRING,
      description: "Preview text shown in inbox"
    },
    greeting: { type: Type.STRING },
    bodyParagraphs: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      minItems: 2,
      maxItems: 4
    },
    ctaText: { type: Type.STRING },
    ctaUrl: { type: Type.STRING },
    signoff: { type: Type.STRING }
  },
  required: ["subject", "greeting", "bodyParagraphs", "ctaText"],
  propertyOrdering: ["subject", "preheader", "greeting", "bodyParagraphs", "ctaText", "ctaUrl", "signoff"]
};

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Create a welcome email for JMEFIT fitness app",
  config: {
    responseMimeType: "application/json",
    responseSchema: emailSchema
  }
});

const emailContent = JSON.parse(response.text);
```

### Example 3: Workout Plan Generation

```javascript
const workoutSchema = {
  type: Type.OBJECT,
  properties: {
    planName: { type: Type.STRING },
    difficulty: {
      type: Type.STRING,
      enum: ["Beginner", "Intermediate", "Advanced"]
    },
    durationWeeks: { type: Type.INTEGER },
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sets: { type: Type.INTEGER },
          reps: { type: Type.STRING },
          restSeconds: { type: Type.INTEGER },
          muscleGroup: { type: Type.STRING }
        },
        propertyOrdering: ["name", "sets", "reps", "restSeconds", "muscleGroup"]
      }
    }
  },
  required: ["planName", "difficulty", "exercises"],
  propertyOrdering: ["planName", "difficulty", "durationWeeks", "exercises"]
};

const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Create a beginner upper body workout plan with 5 exercises",
  config: {
    responseMimeType: "application/json",
    responseSchema: workoutSchema
  }
});
```

---

## ⚙️ Configuration Options

### Response MIME Types

| Mode | MIME Type | Use Case |
|------|-----------|----------|
| JSON | `application/json` | Structured objects and arrays |
| Enum | `text/x.enum` | Single categorical choice |

### Advanced Schema Constraints

```javascript
{
  type: Type.STRING,
  minLength: 10,        // Minimum string length
  maxLength: 100,       // Maximum string length
  pattern: "^[A-Z].*",  // Regex pattern

  type: Type.INTEGER,
  minimum: 0,           // Min value (inclusive)
  maximum: 100,         // Max value (inclusive)

  type: Type.ARRAY,
  minItems: 1,          // Minimum array length
  maxItems: 10,         // Maximum array length
  uniqueItems: true     // No duplicates
}
```

---

## ✅ Best Practices

### 1. Schema Size Management

**Schema size counts towards input token limit!**

Optimization strategies:
- Use short, clear property names (`name` not `productNameString`)
- Limit nested depths (max 2-3 levels)
- Reduce number of optional fields
- Keep enum lists concise

```javascript
// ✅ GOOD - Concise schema
{
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    price: { type: Type.NUMBER }
  }
}

// ❌ AVOID - Bloated schema
{
  type: Type.OBJECT,
  properties: {
    productNameStringValue: { type: Type.STRING },
    productPriceNumericValue: { type: Type.NUMBER }
  }
}
```

### 2. Required Fields

Mark critical fields as `required`:

```javascript
{
  type: Type.OBJECT,
  properties: {
    email: { type: Type.STRING },
    name: { type: Type.STRING },
    phone: { type: Type.STRING } // Optional
  },
  required: ["email", "name"] // Phone is optional
}
```

### 3. Descriptive Prompts

Provide context to improve accuracy:

```javascript
// ✅ GOOD
"Extract product details from this description: 'XYZ Laptop - 16GB RAM, 512GB SSD, $1299'"

// ❌ VAGUE
"Extract product info"
```

### 4. Error Recovery

Handle parsing errors gracefully:

```javascript
try {
  const response = await ai.models.generateContent({...});
  const data = JSON.parse(response.text);
  return data;
} catch (error) {
  console.error('Failed to parse structured output:', error);
  // Fallback or retry logic
  return null;
}
```

---

## 🚨 Common Errors & Solutions

### Error 1: InvalidArgument 400 - Schema Too Complex

**Problem:** Schema exceeds complexity limits

**Solutions:**
```javascript
// Reduce property names
properties: {
  n: { type: Type.STRING },  // Instead of "productName"
  p: { type: Type.NUMBER }   // Instead of "productPrice"
}

// Flatten nested arrays
// Instead of: Type.ARRAY of Type.ARRAY of Type.OBJECT
// Use: Type.ARRAY of Type.OBJECT with comma-separated values

// Reduce enum options
enum: ["S", "M", "L", "XL"]  // Instead of 20 size options
```

### Error 2: Unexpected Output

**Problem:** Generated JSON doesn't match expectations

**Solutions:**
1. Add more context to the prompt
2. Make descriptions more specific
3. Use `required` fields for critical data
4. Test schema separately without structured output first

```javascript
// Before: Vague
contents: "Create a workout"

// After: Specific
contents: `Create a 30-minute beginner HIIT workout with:
- Warm-up exercises
- 5 main exercises with timing
- Cool-down routine`
```

### Error 3: Empty or Null Values

**Problem:** Some fields are unexpectedly null

**Cause:** Fields are optional by default

**Solution:**
```javascript
{
  properties: {
    name: { type: Type.STRING },
    email: { type: Type.STRING }
  },
  required: ["name", "email"] // Enforce non-null
}
```

---

## 🔧 Integration with JMEFIT

### Use Cases in JMEFIT App

1. **Email Campaign Generation** - Generate structured email content
2. **Workout Plan Creation** - AI-generated workout routines
3. **Meal Plan Extraction** - Parse nutrition data into database format
4. **User Onboarding** - Extract user goals and preferences
5. **Blog Content** - Generate SEO metadata with structured fields

### Example: JMEFIT Email Generator

```javascript
// netlify/functions/generate-email-structured.js
const { GoogleGenAI, Type } = require('@google/genai');

exports.handler = async (event) => {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const { emailType, userPrompt } = JSON.parse(event.body);

  const emailSchema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      headerText: { type: Type.STRING },
      introText: { type: Type.STRING },
      ctaText: { type: Type.STRING },
      ctaUrl: { type: Type.STRING },
      bodyText: { type: Type.STRING }
    },
    required: ["subject", "headerText", "ctaText"],
    propertyOrdering: ["subject", "headerText", "introText", "ctaText", "ctaUrl", "bodyText"]
  };

  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Create a ${emailType} email for JMEFIT: ${userPrompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: emailSchema
    }
  });

  return {
    statusCode: 200,
    body: response.text // Already valid JSON
  };
};
```

---

## 📊 Performance & Cost

### Token Optimization

- **Schema tokens:** Large schemas increase input token count
- **Output tokens:** Structured output is typically more concise than unstructured
- **Net benefit:** Usually reduces total tokens for consistent format needs

### Speed

- Structured output has **negligible latency increase** vs unstructured
- Use `gemini-2.5-flash` for fastest structured generation
- Expect ~2-5 second response times for typical schemas

---

## 📚 Additional Resources

- [Official Gemini Structured Output Docs](https://ai.google.dev/gemini-api/docs/structured-output)
- [OpenAPI 3.0 Schema Spec](https://spec.openapis.org/oas/v3.0.0#schema-object)
- [Google GenAI JavaScript SDK](https://github.com/googleapis/js-genai)
- [JSON Schema Validation](https://json-schema.org/)

---

## 🎓 Summary

**Key Takeaways:**

1. ✅ Always set `propertyOrdering` for consistent output
2. ✅ Use `required` array for mandatory fields
3. ✅ Keep schemas concise to avoid token limits
4. ✅ Provide descriptive prompts for better accuracy
5. ✅ Use `gemini-2.5-flash` for best speed/cost ratio
6. ✅ Handle parsing errors gracefully
7. ✅ Test schemas with real prompts before production

**When to Use Structured Output:**
- ✅ Database insertion/updates
- ✅ API integrations
- ✅ Consistent UI rendering
- ✅ Form validation
- ✅ Classification tasks

**When NOT to Use:**
- ❌ Creative writing (poetry, stories)
- ❌ Long-form content generation
- ❌ Conversational responses
- ❌ When format flexibility is needed
