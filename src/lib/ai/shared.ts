// Shared AI Configuration and Types
export interface AIGenerationConfig {
  prompt: string;
  tone: 'professional' | 'friendly' | 'casual' | 'urgent' | 'inspirational' | 'educational';
  length: 'short' | 'medium' | 'long';
  brand: string;
  customizations?: {
    primaryColor?: string;
    fontFamily?: string;
    headerImage?: string;
    footerText?: string;
  };
}

export interface GeneratedContent {
  id: string;
  type: 'email' | 'blog';
  subject?: string;
  title?: string;
  content: string;
  metadata: any;
  generatedAt: Date;
  generatedBy: 'gemini' | 'openai';
}

// Shared prompting strategies
export const TONE_DESCRIPTIONS = {
  professional: 'formal, authoritative, and business-focused',
  friendly: 'warm, conversational, and approachable',
  casual: 'relaxed, informal, and easy-going',
  urgent: 'time-sensitive, action-oriented, and compelling',
  inspirational: 'motivating, uplifting, and empowering',
  educational: 'informative, clear, and instructional'
};

export const LENGTH_GUIDELINES = {
  short: { words: '150-300', paragraphs: '2-3' },
  medium: { words: '300-600', paragraphs: '4-6' },
  long: { words: '600-1200', paragraphs: '7-10' }
};

// Shared API endpoints
export const AI_ENDPOINTS = {
  email: '/.netlify/functions/generate-email-ai',
  blog: '/.netlify/functions/generate-blog-content',
  image: '/.netlify/functions/generate-blog-image'
};

// Shared error handling
export class AIGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AIGenerationError';
  }
}

// Shared API client
export async function generateContent(
  type: 'email' | 'blog',
  config: AIGenerationConfig & Record<string, any>
): Promise<GeneratedContent> {
  const endpoint = AI_ENDPOINTS[type];
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new AIGenerationError(
        error.error || 'Generation failed',
        'API_ERROR',
        error
      );
    }

    const data = await response.json();
    
    return {
      id: `${type}-${Date.now()}`,
      type,
      subject: data.subject || data.content?.subject_line,
      title: data.title || data.content?.headline,
      content: data.body || data.content || data,
      metadata: data,
      generatedAt: new Date(),
      generatedBy: type === 'blog' ? 'gemini' : 'openai'
    };
  } catch (error) {
    if (error instanceof AIGenerationError) {
      throw error;
    }
    
    throw new AIGenerationError(
      'Failed to generate content',
      'NETWORK_ERROR',
      error
    );
  }
}

// Shared content formatting utilities
export function formatHTMLContent(content: string, customizations: any): string {
  const { primaryColor, fontFamily } = customizations;
  
  return `
    <div style="font-family: ${fontFamily || 'Arial, sans-serif'};">
      ${content}
    </div>
  `;
}

// Shared validation
export function validateGenerationConfig(config: Partial<AIGenerationConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.prompt || config.prompt.trim().length < 10) {
    errors.push('Prompt must be at least 10 characters');
  }
  
  if (!config.tone || !TONE_DESCRIPTIONS[config.tone]) {
    errors.push('Invalid tone selected');
  }
  
  if (!config.length || !LENGTH_GUIDELINES[config.length]) {
    errors.push('Invalid length selected');
  }
  
  return errors;
} 