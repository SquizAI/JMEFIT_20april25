/**
 * OpenAI Chat Integration for JMEFit Chatbot
 * 
 * This module provides functions for working with OpenAI's API
 * to power the JMEFit AI assistant with structured responses,
 * interactive buttons, and personalized fitness & nutrition guidance.
 */

import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Only for client-side usage
});

// Structured response schemas
const ChatResponseSchema = z.object({
  message: z.string(),
  type: z.enum(['text', 'program_list', 'recommendation', 'nutrition_guide', 'quick_actions', 'lead_capture', 'workout_info']),
  data: z.optional(z.any()),
  quick_replies: z.optional(z.array(z.object({
    text: z.string(),
    action: z.string(),
    payload: z.optional(z.any())
  }))),
  actions: z.optional(z.array(z.object({
    type: z.enum(['add_to_cart', 'navigate', 'contact']),
    label: z.string(),
    data: z.any()
  })))
});

// Type for the response from the chat
export type ChatResponse = {
  message: string;
  type: 'text' | 'program_list' | 'recommendation' | 'nutrition_guide' | 'quick_actions' | 'lead_capture' | 'workout_info';
  data?: any;
  quick_replies?: QuickReply[];
  actions?: { type: string; data?: any }[];
} | null;

// Type for quick reply buttons
export interface QuickReply {
  text: string;
  action: string;
  payload?: any;
}

// Update the SYSTEM_PROMPT with stage-specific button responses
export const SYSTEM_PROMPT = `You are Jaime's AI assistant for JMEFit, a premium fitness coaching program designed to transform lives through personalized nutrition and training. Your purpose is to guide potential clients through a structured conversation that helps them discover the ideal JMEFit program for their needs and ultimately convert them into customers.

COMMUNICATION APPROACH:
- Be warm, encouraging, and conversational but maintain professional expertise
- Focus on results and transformation, not just features
- Use a problem-solution framework to connect with users' pain points
- Keep messages concise (2-3 sentences maximum) and easy to scan
- Use emojis sparingly to add personality

CONVERSATION STAGES - Follow this structured marketing funnel and DO NOT REPEAT previous stages:

1. WELCOME & ENGAGEMENT: Only introduce yourself ONCE at the start. Ask about their primary fitness goal. ALWAYS provide these specific quick reply buttons: 
   - "💪 Build Muscle" with action "muscle_gain"
   - "🔥 Lose Weight" with action "weight_loss" 
   - "🥗 Improve Nutrition" with action "nutrition"
   - "🏃 Overall Fitness" with action "fitness"

2. QUALIFICATION: Based on their goal, ask about their experience level. USE THESE BUTTONS ONLY:
   - If they chose muscle gain: "🔰 Beginner (0-1 years)" with action "experience_beginner"
   - If they chose muscle gain: "🔄 Intermediate (1-3 years)" with action "experience_intermediate"
   - If they chose muscle gain: "⭐ Advanced (3+ years)" with action "experience_advanced"
   
   - If they chose weight loss: "🆕 Just Starting" with action "experience_beginner" 
   - If they chose weight loss: "🔄 Some Experience" with action "experience_intermediate"
   - If they chose weight loss: "⭐ Very Experienced" with action "experience_advanced"

3. NEEDS ASSESSMENT: Ask about their current routine or specific challenges. USE THESE BUTTONS ONLY:
   - "🏋️ Gym Workouts" with action "gym_workouts"
   - "🏠 Home Workouts" with action "home_workouts" 
   - "🤷 No Current Routine" with action "no_routine"
   - "⏱️ Limited Time" with action "limited_time"

4. SOLUTION PRESENTATION: Present a tailored JMEFit program recommendation based on their answers. USE THESE BUTTONS ONLY:
   - "💳 Add to Cart" with action "add_to_cart"
   - "📋 More Details" with action "more_details"
   - "🔍 See Other Options" with action "show_programs"

5. OBJECTION HANDLING: Address their concerns. USE THESE BUTTONS ONLY:
   - "💰 Payment Options" with action "payment_options"
   - "⏱️ Time Commitment" with action "time_commitment"
   - "❓ Ask Question" with action "ask_questions"

6. CONVERSION: Guide them to take action. USE THESE BUTTONS ONLY:
   - "🛒 Checkout Now" with action "checkout"
   - "💬 Talk to Coach" with action "contact"
   - "🤔 Think About It" with action "remind_later"

IMPORTANT RULES:
- ONLY use the buttons specified for the current conversation stage
- NEVER mix buttons from different stages
- DO NOT repeat welcome messages or restart the conversation flow
- REMEMBER previous user responses and refer back to them
- ADVANCE through the stages in order - never loop back to earlier stages
- After identifying a goal, MOVE FORWARD to qualification, not back to goal selection
- TRACK which stage you're in and proceed to the next logical stage
- If user selects a goal via button, IMMEDIATELY move to qualification stage
- ALWAYS provide fitness goal buttons in stage 1

JMEFIT PROGRAM DETAILS:
1. Nutrition Only Program ($179/month or $1718.40/year): Personalized nutrition coaching with weekly check-ins
2. Nutrition & Training Program ($249/month or $2390.40/year): Comprehensive program with nutrition and custom workouts
3. Self-Led Training Program ($24.99/month or $239.90/year): Access to workout library with minimal guidance
4. Trainer Feedback Program ($49.99/month or $431.90/year): Regular trainer feedback on form and progress
5. SHRED Challenge ($297 one-time): 6-week intensive transformation program
6. One-Time Macro Calculation ($99 one-time): Personalized macro calculation without ongoing coaching

RESPONSE STRUCTURE:
- Always include specific, actionable next steps
- Provide ONLY the quick reply options specified for the current stage
- For program recommendations, include pricing and key benefits

Your ultimate goal is to guide users to the program that best matches their needs and convert them into customers through a natural, conversational experience.`;

// Program information with consistent pricing and updated descriptions
const getJMEFitPrograms = () => {
  // Safe wrapper for price formatting with fallbacks
  const safeFormatPrice = (productKey: string, interval?: string): number => {
    // Use actual pricing from your website
    const fallbacks: Record<string, Record<string, number>> = {
      'nutrition-only': { 'month': 179, 'year': 1718.40 }, // CORRECT: $179/month, $1718.40/year
      'nutrition-training': { 'month': 249, 'year': 2390.40 }, // CORRECT: $249/month, $2390.40/year
      'self-led-training': { 'month': 24.99, 'year': 239.90 }, // CORRECT: $24.99/month, $239.90/year
      'trainer-feedback': { 'month': 49.99, 'year': 431.90 }, // CORRECT: $49.99/month, $431.90/year
      'one-time-macros': { 'default': 99 },
      'shred-challenge': { 'default': 297 }
    };
    
    // Return appropriate fallback price
    if (interval && fallbacks[productKey]?.[interval]) {
      return fallbacks[productKey][interval];
    }
    return fallbacks[productKey]?.['default'] || 0;
  };
  
  // Safe wrapper for getting price IDs with fallbacks
  const safePriceId = (productKey: string, interval?: string): string => {
    // Fallback price IDs
    const fallbacks: Record<string, Record<string, string>> = {
      'nutrition-only': { 
        'month': 'price_nutrition_monthly', 
        'year': 'price_nutrition_yearly' 
      },
      'nutrition-training': { 
        'month': 'price_training_monthly', 
        'year': 'price_training_yearly' 
      },
      'self-led-training': { 
        'month': 'price_selfled_monthly', 
        'year': 'price_selfled_yearly' 
      },
      'trainer-feedback': { 
        'month': 'price_feedback_monthly', 
        'year': 'price_feedback_yearly' 
      },
      'one-time-macros': { 'default': 'price_macros_onetime' },
      'shred-challenge': { 'default': 'price_shred_onetime' }
    };
    
    // Return appropriate fallback price ID
    if (interval && fallbacks[productKey]?.[interval]) {
      return fallbacks[productKey][interval];
    }
    return fallbacks[productKey]?.['default'] || '';
  };

  // Return programs with CONSISTENT pricing and improved descriptions
  return [
  {
    id: 'nutrition-only',
      name: 'Nutrition Only',
    price: {
        monthly: safeFormatPrice('nutrition-only', 'month'),
        yearly: safeFormatPrice('nutrition-only', 'year')
    },
      description: 'Custom nutrition plan, guidance & anytime support',
    features: [
        'Personalized macro calculations',
        'Weekly check-ins and adjustments',
        'Custom meal planning guidance',
        '24/7 chat support with Jaime'
      ],
      commitment: '3-month minimum commitment',
    stripePriceIds: {
        monthly: safePriceId('nutrition-only', 'month'),
        yearly: safePriceId('nutrition-only', 'year')
    }
  },
  {
    id: 'nutrition-training',
      name: 'Nutrition & Training',
    price: {
        monthly: safeFormatPrice('nutrition-training', 'month'),
        yearly: safeFormatPrice('nutrition-training', 'year')
    },
      description: 'Complete transformation package with nutrition and custom workouts',
    features: [
        'Everything in Nutrition Only',
        'Customized training program',
      'Form check videos & feedback',
        'Premium app features'
    ],
      commitment: '3-month minimum commitment',
    stripePriceIds: {
        monthly: safePriceId('nutrition-training', 'month'),
        yearly: safePriceId('nutrition-training', 'year')
      },
      popular: true
  },
  {
    id: 'self-led-training',
      name: 'Self-Led Training',
    price: {
        monthly: safeFormatPrice('self-led-training', 'month'),
        yearly: safeFormatPrice('self-led-training', 'year')
    },
      description: 'Complete app access with monthly workout plans',
    features: [
        'Full access to JmeFit app',
        'New monthly workout plans (3-5 days)',
        'Structured progressions',
        'Exercise video library',
        'Detailed workout logging'
      ],
      commitment: 'Cancel anytime',
    stripePriceIds: {
        monthly: safePriceId('self-led-training', 'month'),
        yearly: safePriceId('self-led-training', 'year')
    }
  },
  {
    id: 'trainer-feedback',
      name: 'Trainer Feedback',
    price: {
        monthly: safeFormatPrice('trainer-feedback', 'month'),
        yearly: safeFormatPrice('trainer-feedback', 'year')
    },
      description: 'Personal guidance & form checks',
    features: [
        'Everything in Self-Led plan',
        'Form check video reviews',
        'Direct messaging with Jaime',
        'Workout adaptations & swaps',
        'Access to previous workouts',
        'Premium support access'
      ],
      commitment: 'Cancel anytime',
    stripePriceIds: {
        monthly: safePriceId('trainer-feedback', 'month'),
        yearly: safePriceId('trainer-feedback', 'year')
    },
    popular: true
  },
  {
    id: 'shred-challenge',
      name: 'SHRED with JmeFit!',
    price: {
        oneTime: safeFormatPrice('shred-challenge')
    },
      description: 'Transform your body with our intensive 6-week program',
    features: [
        'Custom Macros & meal plans',
        'Interactive check-ins with Jaime',
        'MyPTHub App access included',
        'Exclusive 5 workouts per week',
        'Home and gym options',
        'Educational content & tips'
      ],
      commitment: 'One-time payment',
    stripePriceIds: {
        oneTime: safePriceId('shred-challenge')
    }
  },
  {
      id: 'one-time-macros',
      name: 'One-Time Macros Calculation',
    price: {
        oneTime: safeFormatPrice('one-time-macros')
    },
      description: 'Complete macro calculation with comprehensive guides',
    features: [
        'Personalized macros',
        'Detailed guides',
        'Meal templates'
      ],
      commitment: 'One-time payment',
    stripePriceIds: {
        oneTime: safePriceId('one-time-macros')
      }
    }
  ];
};

// Add stage-specific cached responses
export const CACHED_RESPONSES: Record<string, ChatResponse> = {
  // Welcome response stays the same
  welcome: {
    message: "Welcome to JMEFit! I'm Jaime's AI assistant, here to help you find the perfect fitness program for your goals. What's your primary fitness goal?",
    type: 'text',
    quick_replies: [
      { text: '💪 Build Muscle', action: 'muscle_gain' },
      { text: '🔥 Lose Weight', action: 'weight_loss' },
      { text: '🥗 Improve Nutrition', action: 'nutrition' },
      { text: '🏃 Overall Fitness', action: 'fitness' }
    ]
  },
  
  // Add stage 2 responses - qualification
  muscle_gain_qualification: {
    message: "Building muscle is a great goal! To recommend the best program for you, I'd like to know your experience level with weight training.",
    type: 'text',
    quick_replies: [
      { text: '🔰 Beginner (0-1 years)', action: 'experience_beginner' },
      { text: '🔄 Intermediate (1-3 years)', action: 'experience_intermediate' },
      { text: '⭐ Advanced (3+ years)', action: 'experience_advanced' }
    ]
  },
  
  weight_loss_qualification: {
    message: "Weight loss is one of our specialties at JMEFit! To help you achieve the best results, could you share your current experience level with fitness and nutrition?",
    type: 'text',
    quick_replies: [
      { text: '🆕 Just Starting', action: 'experience_beginner' },
      { text: '🔄 Some Experience', action: 'experience_intermediate' },
      { text: '⭐ Very Experienced', action: 'experience_advanced' }
    ]
  },
  
  nutrition_qualification: {
    message: "Improving your nutrition is a fantastic goal and the foundation of all our programs! What's your current knowledge level with nutrition planning?",
    type: 'text',
    quick_replies: [
      { text: '🆕 Beginner', action: 'experience_beginner' },
      { text: '🔄 Intermediate', action: 'experience_intermediate' },
      { text: '⭐ Advanced', action: 'experience_advanced' }
    ]
  },
  
  fitness_qualification: {
    message: "Overall fitness is a great goal! To help you find the best program, what's your current fitness level?",
    type: 'text',
    quick_replies: [
      { text: '🆕 Just Starting', action: 'experience_beginner' },
      { text: '🔄 Somewhat Active', action: 'experience_intermediate' },
      { text: '⭐ Very Active', action: 'experience_advanced' }
    ]
  },
  
  // Add stage 3 response - needs assessment
  needs_assessment: {
    message: "Thanks for sharing! Now I'd like to understand your workout preferences to better tailor our recommendation.",
    type: 'text',
    quick_replies: [
      { text: '🏋️ Gym Workouts', action: 'gym_workouts' },
      { text: '🏠 Home Workouts', action: 'home_workouts' },
      { text: '🤷 No Current Routine', action: 'no_routine' },
      { text: '⏱️ Limited Time', action: 'limited_time' }
    ]
  },
  
  // Create the cached response for show_programs with consistent pricing
  show_programs: {
    message: "Here are our JMEFit programs designed to help you reach your fitness goals:",
    type: 'program_list',
    data: {
      programs: getJMEFitPrograms()
    },
    quick_replies: [
      { text: '💪 Get Personalized Recommendation', action: 'get_recommendation' },
      { text: '❓ Ask Questions', action: 'ask_questions' },
      { text: '🏆 See Success Stories', action: 'success_stories' }
    ]
  },
  
  // New qualification flow for goal: weight loss
  weight_loss_experience: {
    message: "Great goal! Losing fat and getting leaner is something Jaime has helped hundreds of clients achieve with sustainable approaches. To help find your perfect program, I'd like to understand your experience level. Where are you at in your fitness journey?",
    type: "text",
    quick_replies: [
      { text: "🌱 Beginner (just starting out)", action: "experience_beginner" },
      { text: "🏃‍♀️ Intermediate (some experience)", action: "experience_intermediate" },
      { text: "💪 Advanced (very experienced)", action: "experience_advanced" }
    ]
  },
  
  // New qualification flow for time availability
  time_availability: {
    message: "Thanks! Time is precious, and we want to make sure your program fits your schedule. How much time can you realistically commit to working out each week?",
    type: "text",
    quick_replies: [
      { text: "⏱️ Limited (2-3 days, 30 min)", action: "availability_limited" },
      { text: "⏱️ Moderate (3-4 days, 45-60 min)", action: "availability_moderate" },
      { text: "⏱️ Flexible (5+ days available)", action: "availability_flexible" }
    ]
  },
  
  // Personalized recommendation example
  personalized_recommendation: {
    message: "Based on your goals and situation, I have the perfect program for you! Nutrition & Training is designed specifically for people like you who want to lose weight while fitting workouts into a busy schedule.",
    type: "recommendation",
    data: {
      id: "nutrition-training",
      name: "Nutrition & Training",
      popular: true,
      price: {
        monthly: 249,
        yearly: 2390.40
      },
      description: "Complete transformation package with nutrition and custom workouts tailored to your schedule and goals.",
      features: [
        "Custom meal plans that fit your preferences and lifestyle",
        "Time-efficient workouts designed for maximum fat loss",
        "Weekly adjustments based on your progress",
        "Access to supportive community for motivation",
        "Mobile app for tracking and workouts on-the-go"
      ],
      reasoning: "I'm recommending this program because it addresses both nutrition and training, which is essential for effective and sustainable weight loss. The workouts are specifically designed to fit into your limited schedule while maximizing fat burning, and the nutrition guidance will help you make sustainable changes without restrictive dieting. Our clients with similar goals and time constraints see an average of 10-12 pounds of fat loss in the first month alone!"
    },
    quick_replies: [
      { text: "🛒 Add to cart ($249/month)", action: "add_to_cart", payload: { id: "nutrition-training", name: "Nutrition & Training", price: 249, description: "Nutrition & Training", billingInterval: "month" } },
      { text: "🤔 See a success story", action: "success_story_weight_loss" },
      { text: "💰 Show me a more affordable option", action: "budget_option" }
    ]
  },
  
  // Social proof - success story
  success_story_weight_loss: {
    message: "Here's Maria's incredible transformation with the program I recommended to you:",
    type: "text",
    data: {
      testimonials: [
        {
          name: "Maria S.",
          program: "Nutrition & Training",
          results: "Lost 34 pounds in 4 months",
          quote: "I tried so many diets before finding JMEFit. The difference was the personalized approach and accountability. The workouts fit perfectly into my busy mom schedule, and the nutrition plan was flexible enough that I could still enjoy meals with my family. I've never felt better or more confident!"
        }
      ]
    },
    quick_replies: [
      { text: "🛒 I'm ready to start", action: "add_to_cart", payload: { id: "nutrition-training", name: "Nutrition & Training", price: 249, description: "Nutrition & Training", billingInterval: "month" } },
      { text: "❓ I have a question", action: "ask_questions" },
      { text: "🔄 Show me other options", action: "show_programs" }
    ]
  },
  
  // Objection handling - budget concerns
  budget_option: {
    message: "I completely understand budget considerations! Self-Led Training gives you excellent structure and resources at a more accessible price point. Many of our successful transformations started with this option:",
    type: "recommendation",
    data: {
      id: "self-led-training",
      name: "Self-Led Training",
      price: {
        monthly: 24.99,
        yearly: 19.99 * 12
      },
      description: "Complete app access with monthly workout plans you can follow independently.",
      features: [
        "Progressive workout plans based on your experience level",
        "Video demonstrations of all exercises",
        "Access to community forum for questions and motivation",
        "Monthly program updates with fresh workouts",
        "Mobile app access for convenient training"
      ],
      reasoning: "This program offers excellent value while still providing the structure you need for consistent progress. You'll get the same quality workout programming as our premium options, just without the personalized coaching elements. It's perfect if you're self-motivated but need expert guidance on what exactly to do for your goals."
    },
    quick_replies: [
      { text: "🛒 Add to cart ($24.99/month)", action: "add_to_cart", payload: { id: "self-led-training", name: "Self-Led Training", price: 24.99, description: "Self-Led Training", billingInterval: "month" } },
      { text: "📊 Compare all programs", action: "show_programs" },
      { text: "💡 Tell me about payment plans", action: "payment_options" }
    ]
  },
  
  // Lead capture for those not ready to buy
  lead_capture_incentive: {
    message: "I'd love to help you get started on your fitness journey! Many people find it helpful to start with our free resources. Can I send you a quick guide on nutrition basics and our program comparison?",
    type: 'lead_capture',
    data: {
      incentive: "Free Nutrition Guide + Program Comparison",
      benefits: [
        "Personalized macro calculations",
        "Sample meal plans and recipes", 
        "Detailed program feature comparison",
        "Success stories from real clients"
      ]
    },
    quick_replies: [
      { text: '📧 Send me the guide', action: 'capture_email' },
      { text: '📊 Just show programs', action: 'show_programs' },
      { text: '💬 I have questions', action: 'ask_questions' }
    ]
  },

  // Nutrition guide response
  nutrition_guide: {
    message: "Here are some essential nutrition tips to get you started on the right track:",
    type: 'nutrition_guide',
    data: {
      tips: [
        "Eat protein with every meal (aim for 0.8-1g per lb of body weight)",
        "Fill half your plate with vegetables at lunch and dinner",
        "Stay hydrated - aim for half your body weight in ounces of water daily",
        "Time your carbs around your workouts for better energy and recovery",
        "Don't skip meals - consistent eating supports metabolism"
      ],
      programs: [
        "Nutrition Mastery Program - Personalized meal planning",
        "Complete Transformation Bundle - Nutrition + Training combined",
        "One-Time Macro Calculation - Quick start option"
      ]
    },
    quick_replies: [
      { text: '🥗 Get Personal Plan', action: 'nutrition-only' },
      { text: '📊 View All Programs', action: 'show_programs' },
      { text: '❓ Ask Specific Question', action: 'ask_questions' }
    ]
  },

  // Workout examples response
  workout_examples: {
    message: "Here are some effective workout examples from our programs:",
    type: 'workout_info',
    data: {
      beginner_workout: {
        name: "Beginner Full Body",
        exercises: [
          "Goblet Squats - 3 sets of 8-12 reps",
          "Push-ups (modified if needed) - 3 sets of 5-10 reps", 
          "Bent-over Rows - 3 sets of 8-12 reps",
          "Plank - 3 sets of 15-30 seconds"
        ]
      },
      equipment: "Minimal equipment needed - can be done at home or gym"
    },
    quick_replies: [
      { text: '💪 Get Full Program', action: 'nutrition-training' },
      { text: '🏠 Home Workouts', action: 'self-led-training' },
      { text: '🏋️ Gym Programs', action: 'trainer-feedback' }
    ]
  },

  // Timeline response
  timeline: {
    message: "Here's what you can typically expect with our programs:",
    type: 'text',
    data: {
      phases: [
        {
          title: "Week 1-2: Foundation",
          description: "Getting into routine, initial energy improvements, learning proper form"
        },
        {
          title: "Week 3-4: Momentum",
          description: "Habits forming, strength gains, clothes fitting better"
        },
        {
          title: "Week 5-8: Visible Changes", 
          description: "Noticeable body composition changes, significant strength gains"
        },
        {
          title: "Month 3+: Transformation",
          description: "Major physique changes, lifestyle becomes second nature"
        }
      ]
    },
    quick_replies: [
      { text: '🚀 Start My Transformation', action: 'get_recommendation' },
      { text: '📊 See Programs', action: 'show_programs' },
      { text: '🏆 Success Stories', action: 'success_stories' }
    ]
  },

  // Pricing response
  pricing: {
    message: "Here's our current pricing for all JMEFit programs:",
    type: 'program_list',
    data: {
      programs: getJMEFitPrograms()
    },
    quick_replies: [
      { text: '💡 Get Recommendation', action: 'get_recommendation' },
      { text: '💰 Payment Plans Available', action: 'payment_options' },
      { text: '❓ Ask Questions', action: 'ask_questions' }
    ]
  },

  // Get recommendation response
  get_recommendation: {
    message: "I'd love to recommend the perfect program for you! Let me ask a few quick questions to personalize my recommendation:",
    type: 'text',
    quick_replies: [
      { text: '💪 Build Muscle', action: 'muscle_gain' },
      { text: '🔥 Lose Weight', action: 'weight_loss' },
      { text: '🥗 Improve Nutrition', action: 'nutrition' },
      { text: '🏃 Overall Fitness', action: 'fitness' }
    ]
  },

  // Success stories response
  success_stories: {
    message: "Here are some amazing transformations from our JMEFit community:",
    type: 'text',
    data: {
      stories: [
        {
          name: "Sarah M.",
          program: "Complete Transformation Bundle", 
          result: "Lost 28 pounds in 4 months",
          quote: "Finally found a sustainable approach that fits my busy lifestyle!"
        },
        {
          name: "Mike T.",
          program: "Nutrition & Training",
          result: "Gained 15 lbs of muscle in 6 months",
          quote: "The personalized approach made all the difference."
        },
        {
          name: "Lisa K.",
          program: "Nutrition Only",
          result: "Lost 22 pounds, improved energy",
          quote: "Learning proper nutrition changed everything for me."
        }
      ]
    },
    quick_replies: [
      { text: '🚀 Start My Journey', action: 'get_recommendation' },
      { text: '📊 View Programs', action: 'show_programs' },
      { text: '💬 Talk to Coach', action: 'contact' }
    ]
     },

   // Additional existing lead capture response (alternative version)
   lead_capture_alternative: {
     message: "Not quite ready to start today? I completely understand! Would you like to receive Jaime's free Fat-Loss Starter Guide plus a special discount code for when you're ready to begin?",
    type: "lead_capture",
    data: {
      reason: "Get Jaime's Fat-Loss Starter Guide + 20% discount code"
    },
    quick_replies: [
      { text: "✉️ Yes, send me the guide", action: "share_email" },
      { text: "📱 Send via text", action: "share_phone" },
      { text: "🙂 No thanks", action: "decline_share" }
    ]
  },
  
  // Updated FAQ with marketing focus
  faq: {
    message: "Here are answers to our most common questions about JMEFit programs:",
    type: "text",
    data: {
      questions: [
        {
          question: "How quickly will I see results?",
          answer: "Most clients notice changes within the first 2 weeks, with significant transformations visible by 4-6 weeks. Consistency is key, and those who follow their personalized plans see the best results. We've had clients lose up to 12 pounds in their first month!"
        },
        {
          question: "Do I need special equipment or a gym membership?",
          answer: "Not at all! Our programs can be customized for home workouts with minimal or no equipment. We provide modifications for every exercise based on what you have available. Many of our most successful clients train entirely at home."
        },
        {
          question: "How is this different from other fitness programs?",
          answer: "Unlike one-size-fits-all approaches, JMEFit provides truly personalized plans adapted to your goals, preferences, and lifestyle. We focus on sustainable changes rather than quick fixes, and our supportive community provides the accountability that's missing from most programs."
        },
        {
          question: "Can I cancel if it's not for me?",
          answer: "Absolutely. While we have a 95% retention rate because clients love their results, all monthly programs can be canceled anytime. We also offer a 14-day satisfaction guarantee for new members."
        }
      ]
    },
    quick_replies: [
      { text: "🎯 Get my recommendation", action: "get_recommendation" },
      { text: "📊 Show all programs", action: "show_programs" },
      { text: "❓ Ask another question", action: "ask_questions" }
    ]
  },
  
  // Update the macro_calculation response
  macro_calculation: {
    message: "Based on your height and weight, here's a starting point for your macros to build muscle. At 5'8\" and 180 lbs, I'd recommend:",
    type: 'nutrition_guide',
    data: {
      macros: {
        title: "Recommended Macros for Muscle Building",
        values: [
          "Protein: 180g (1g per pound of bodyweight)",
          "Carbs: 270-360g (1.5-2g per pound)",
          "Fats: 60-70g (0.3-0.4g per pound)",
          "Total Calories: ~2,400-2,900 daily"
        ],
        note: "These are starting values - adjust based on results and activity level. For optimal results, consider our Nutrition Only Program for personalized guidance."
      },
      mealExample: {
        title: "Sample Daily Meal Plan",
        meals: [
          "Breakfast: 4 eggs, 1 cup oatmeal, 1 banana (P: 30g, C: 60g, F: 18g)",
          "Lunch: 8oz chicken breast, 1 cup rice, 1 cup vegetables (P: 50g, C: 45g, F: 8g)",
          "Pre-workout: Protein shake with 1 scoop whey, 1 apple (P: 25g, C: 25g, F: 2g)",
          "Post-workout: Protein shake with 1 scoop whey, 1 banana (P: 25g, C: 30g, F: 2g)",
          "Dinner: 8oz lean beef, 1 large sweet potato, 2 cups vegetables (P: 50g, C: 50g, F: 20g)"
        ]
      },
      tips: [
        "Eat protein with every meal to maximize muscle protein synthesis",
        "Time most of your carbs around your workouts",
        "Stay hydrated with 3-4 liters of water daily",
        "Consider creatine monohydrate (5g daily) to support muscle growth",
        "For optimal results, get personalized macros and meal plans through our Nutrition Program"
      ]
    },
    quick_replies: [
      { text: "🍽️ Tell me more about nutrition", action: "nutrition_guide" },
      { text: "💪 View Nutrition Program", action: "nutrition-only" },
      { text: "❓ Ask another question", action: "ask_questions" }
    ]
  }
};

// Expanded query patterns to match against cached responses
const QUERY_PATTERNS = {
  compare_features: [
    /compare/i, /difference/i, /versus/i, /vs/i, /which is better/i, 
    /what.+include/i, /what.+offer/i, /features/i, /benefits/i
  ],
  
  show_programs: [
    /show programs/i, /what programs/i, /all programs/i, /list programs/i,
    /options/i, /available/i, /offerings/i, /what do you have/i, /packages/i
  ],
  
  nutrition_guide: [
    /nutrition/i, /diet/i, /food/i, /eat/i, /meal/i, /macros/i, 
    /calories/i, /protein/i, /carbs/i, /fat/i, /weight loss/i
  ],
  
  get_recommendation: [
    /recommend/i, /suggestion/i, /best for me/i, /which program/i, 
    /best fit/i, /what should i/i, /help me choose/i, /not sure/i
  ],
  
  pricing: [
    /price/i, /cost/i, /how much/i, /pricing/i, /fee/i, /pay/i,
    /expensive/i, /cheap/i, /affordable/i, /discount/i, /money/i
  ],
  
  how_it_works: [
    /how does it work/i, /how it works/i, /process/i, /steps/i, 
    /what to expect/i, /what happens/i, /journey/i, /experience/i
  ],
  
  results: [
    /results/i, /outcome/i, /success/i, /testimonial/i, /before after/i,
    /transformation/i, /achieve/i, /progress/i, /timeline/i, /how fast/i,
    /how long/i, /how quickly/i, /what can i expect/i
  ],
  
  // Additional comprehensive matching patterns
  program_details: [
    /tell me more/i, /more details/i, /more information/i, /learn more/i,
    /program details/i, /how does the program work/i, /what's included/i, /whats included/i
  ],
  
  success_stories: [
    /success stories/i, /testimonials/i, /reviews/i, /results/i, /before after/i,
    /transformations/i, /case studies/i, /client results/i, /who has this worked for/i
  ],
  
  timeline: [
    /timeline/i, /how long/i, /how quickly/i, /how soon/i, /when will I see/i,
    /results timeline/i, /what to expect/i, /expectations/i, /weekly progress/i
  ],
  
  workout_examples: [
    /workout examples/i, /sample workout/i, /example workout/i, /workout plan/i,
    /exercise/i, /training/i, /sample program/i, /what exercises/i
  ],
  
  equipment_needs: [
    /equipment/i, /what do I need/i, /weights/i, /machines/i, /gym access/i,
    /home workout/i, /workout at home/i, /no equipment/i, /minimal equipment/i
  ],
  
  nutrition_examples: [
    /meal plan/i, /diet example/i, /eating plan/i, /food/i, /menu/i,
    /sample diet/i, /what should I eat/i, /nutrition plan/i, /macros example/i
  ],
  
  faq: [
    /faq/i, /frequently asked/i, /common questions/i, /questions about/i,
    /how does it work/i, /cancel/i, /refund/i, /guarantee/i
  ],
  
  home_workouts: [
    /home workout/i, /workout at home/i, /home gym/i, /no gym/i,
    /workout from home/i, /home exercise/i, /home training/i
  ],
  
  gym_workouts: [
    /gym workout/i, /workout at gym/i, /commercial gym/i, /gym access/i,
    /gym membership/i, /fitness center/i, /health club/i
  ],
  
  workout_access: [
    /access workouts/i, /view workouts/i, /workout app/i, /mobile app/i,
    /how do I see/i, /where are the workouts/i, /workout platform/i
  ],
  
  app_preview: [
    /app/i, /screenshot/i, /what does it look like/i, /interface/i,
    /platform/i, /software/i, /mobile app/i, /tracking app/i
  ]
};

// Update the findCachedResponse function
export const findCachedResponse = (message: string): ChatResponse | null => {
    const lowerMessage = message.toLowerCase();
    
  // Check for exact matches in cached responses
    if (lowerMessage.includes('compare') && lowerMessage.includes('feature')) {
      return CACHED_RESPONSES.compare_features;
    }
  
  // Return welcome response for 'get new recommendation'
  if (lowerMessage.includes('get new recommendation') || 
      lowerMessage.includes('get recommendation') || 
      lowerMessage.includes('start over')) {
    return CACHED_RESPONSES.welcome;
    }
    
    if ((lowerMessage.includes('show') && lowerMessage.includes('program')) || 
        lowerMessage.includes('view programs') || lowerMessage.includes('all programs')) {
      return CACHED_RESPONSES.show_programs;
    }
    
    if (lowerMessage.includes('nutrition') && (lowerMessage.includes('help') || lowerMessage.includes('guide') || lowerMessage.includes('advice'))) {
      return CACHED_RESPONSES.nutrition_guide;
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('best program') || lowerMessage.includes('which program')) {
      return CACHED_RESPONSES.get_recommendation;
    }

  // Check for macro-related questions
  if ((lowerMessage.includes('macro') || lowerMessage.includes('macros')) && 
      (lowerMessage.includes('need') || lowerMessage.includes('calculate') || 
       lowerMessage.includes('what') || lowerMessage.includes('how much'))) {
    return CACHED_RESPONSES.macro_calculation;
  }
  
  // Handle specific phrases like "get buff" as muscle gain goals
  if ((lowerMessage === 'get buff' || lowerMessage === 'buff' || lowerMessage === 'build muscle') && 
      getConversationContext().includes('macros')) {
    return CACHED_RESPONSES.macro_calculation;
  }
  
  // Calculate pattern matches for each response type
  const matchScores: Record<string, number> = {};
  
  Object.entries(QUERY_PATTERNS).forEach(([responseType, patterns]) => {
    matchScores[responseType] = 0;
    patterns.forEach(pattern => {
      if (pattern.test(lowerMessage)) {
        matchScores[responseType]++;
      }
    });
  });
  
  // Find the best match (if any meet the threshold)
  const bestMatch = Object.entries(matchScores)
    .filter(([_, score]) => score > 0)
    .sort(([_, scoreA], [__, scoreB]) => scoreB - scoreA)[0];
    
  if (bestMatch && bestMatch[1] >= 1) {
    const responseType = bestMatch[0] as keyof typeof CACHED_RESPONSES;
    return CACHED_RESPONSES[responseType];
  }
  
  // Special cases for lead generation opportunities
  const messageWordCount = message.split(' ').length;
  const isDetailedQuestion = messageWordCount > 8; 
  const containsPersonalKeywords = /\b(my|i|me|goal|want|need|looking)\b/i.test(message);
  
  // Trigger lead capture for detailed, personal questions after a few messages
  if (isDetailedQuestion && containsPersonalKeywords) {
    // 30% chance of showing lead capture for qualifying messages
    // This prevents showing it for every message
    if (Math.random() < 0.3) {
      return CACHED_RESPONSES.lead_capture_incentive;
    }
  }
  
  return null;
};

// Helper function to get conversation context
const getConversationContext = (): string => {
  // This could be enhanced to read from actual conversation history
  // For now, just return a simple string with recent keywords
  return localStorage.getItem('jmefit-conversation-context') || '';
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Generate a unique ID for chat sessions
const generateId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Types for our chat sessions
export interface ChatSession {
  id: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  context: {
    userGoals?: string[];
    experienceLevel?: string;
    interestedPrograms?: string[];
    programViews?: string[];
    lastInteractionTime?: number;
  };
  endpoint: string; // OpenAI API endpoint
  apiKey: string;   // OpenAI API key
  model: string;    // OpenAI model to use
}

// Create a new chat session with properly configured model
export const createChatSession = (): ChatSession => {
      return {
    id: generateId(),
    messages: [],
    context: {
      userGoals: [],
      programViews: [],
      lastInteractionTime: Date.now()
    },
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-3.5-turbo' // Changed from o4-mini to gpt-3.5-turbo for better compatibility
  };
};

// Process the raw response content into our expected format
const processResponse = (responseContent: string, originalMessage: string): ChatResponse => {
  try {
    // Try to parse as JSON first
    const parsedResponse = JSON.parse(responseContent);
    
    // If it's a valid JSON response with our expected fields, use it
    if (parsedResponse.message && typeof parsedResponse.message === 'string') {
        return {
        message: parsedResponse.message,
        type: parsedResponse.type || 'text',
        data: parsedResponse.data,
        quick_replies: parsedResponse.quick_replies
      };
    }
    
    // If JSON doesn't have our format, treat as text
        return {
      message: responseContent,
          type: 'text',
      quick_replies: getDefaultQuickReplies(originalMessage)
    };
  } catch (e) {
    // If not valid JSON, treat as regular text
        return {
      message: responseContent,
          type: 'text',
      quick_replies: getDefaultQuickReplies(originalMessage)
    };
  }
};

// Get default quick replies based on the message content
const getDefaultQuickReplies = (message: string): QuickReply[] => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('program') || lowerMessage.includes('pricing')) {
    return [
      { text: '📊 Compare Features', action: 'compare_features' },
      { text: '🛒 Add to Cart', action: 'quick_checkout' },
      { text: '❓ More Questions', action: 'ask_questions' }
    ];
  }
  
  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet')) {
    return [
      { text: '🥗 Nutrition Plan', action: 'recommend_nutrition' },
      { text: '📊 View Programs', action: 'show_programs' },
      { text: '❓ Ask Questions', action: 'ask_questions' }
    ];
  }
  
  return [
    { text: '📊 View Programs', action: 'show_programs' },
    { text: '🎯 Get Recommendation', action: 'get_recommendation' },
    { text: '❓ Ask Questions', action: 'ask_questions' }
  ];
};

// Send a message to OpenAI and get a response
export const sendMessage = async (session: ChatSession, message: string): Promise<ChatResponse> => {
  try {
    console.log('Sending message to OpenAI:', message);
    
    // First check if we have a cached response
    const cachedResponse = findCachedResponse(message);
    if (cachedResponse) {
      console.log('Using cached response');
      return cachedResponse;
    }
    
    // API retry system with exponential backoff
    const apiCallWithRetry = async (retryCount = 0): Promise<ChatResponse> => {
      try {
        // Set a more reliable timeout
        const timeout = setTimeout(() => {
          throw new Error('API request timed out');
        }, 10000); // 10 second timeout
        
        // Build messages array in the format expected by OpenAI
        // Add explicit mention of JSON in system prompt if using JSON response format
        const systemPromptWithJson = SYSTEM_PROMPT + 
          "\n\nPlease respond with a JSON object following this structure:\n" +
          "{\n" +
          '  "message": "Your helpful response text",\n' +
          '  "type": "text|program_list|recommendation|nutrition_guide|quick_actions|lead_capture|workout_info",\n' +
          '  "data": { "optional": "additional data for the response type" },\n' +
          '  "quick_replies": [\n' +
          '    { "text": "Button text", "action": "action_type", "payload": "optional data" }\n' +
          '  ]\n' +
          "}";
        
        const formattedMessages = [
          { role: 'system' as const, content: systemPromptWithJson },
          ...session.messages.map(msg => ({ 
            role: msg.role as 'system' | 'user' | 'assistant', 
            content: msg.content 
          })),
          { role: 'user' as const, content: message }
        ];
        
        // Check if API key is missing or empty
        if (!session.apiKey || session.apiKey === '') {
          console.warn('API key is missing, using fallback response');
          clearTimeout(timeout);
          return getFallbackResponse(message);
        }
        
        // Only use DEV fallback if explicitly in development mode AND the API key is not available
        if (import.meta.env.DEV && (!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === '')) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeout);
          
          // Return a structured fallback response in development mode
          console.log('DEV mode: Using structured fallback response');
          return getFallbackResponse(message);
        }
        
        // In production or if API key is available, make the real API call
        const openai = new OpenAI({
          apiKey: session.apiKey,
          dangerouslyAllowBrowser: true
        });
        
        try {
    const completion = await openai.chat.completions.create({
            model: session.model || 'gpt-3.5-turbo',
            messages: formattedMessages,
            max_completion_tokens: 1500,
            temperature: 0.7,
            presence_penalty: 0.6,
            response_format: { type: 'json_object' }
          });
          
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeout);
          
          // Extract the response content
          const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
            console.warn('Empty response from OpenAI');
            return getFallbackResponse(message);
          }
          
          // Process the response
          return processResponse(responseContent, message);
        } catch (jsonFormatError) {
          // Clear the timeout to prevent memory leaks
          clearTimeout(timeout);
          
          // If we get a JSON format error, try again without the response_format parameter
          if (jsonFormatError && typeof jsonFormatError === 'object' && 'message' in jsonFormatError && 
              typeof jsonFormatError.message === 'string' && 
              (jsonFormatError.message.includes('json') || jsonFormatError.message.includes('response_format'))) {
            
            console.warn('JSON format error, retrying without structured response format');
            
            try {
              // Retry without response_format
              const retryCompletion = await openai.chat.completions.create({
                model: session.model || 'gpt-3.5-turbo',
                messages: formattedMessages,
                max_completion_tokens: 1500,
                temperature: 0.7,
                presence_penalty: 0.6
              });
              
              const retryContent = retryCompletion.choices[0].message.content;
              if (!retryContent) {
                return getFallbackResponse(message);
              }
              
              return processResponse(retryContent, message);
            } catch (retryError) {
              console.error('Retry failed:', retryError);
              return getFallbackResponse(message);
            }
          }
          
          // For other API errors, log and rethrow
          console.error('API error:', jsonFormatError);
          throw jsonFormatError;
        }
      } catch (error) {
        console.error(`API attempt ${retryCount + 1} failed:`, error);
        
        // If we haven't reached max retries, try again with exponential backoff
        if (retryCount < 2) {
          const backoffTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
          console.log(`Retrying in ${backoffTime}ms...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return apiCallWithRetry(retryCount + 1);
        }
        
        // Max retries reached, return fallback response
        console.log('Max retries reached, using fallback response');
        return getFallbackResponse(message);
      }
    };
    
    // Start the API call with retry logic
    return await apiCallWithRetry();

  } catch (error) {
    console.error('Error in OpenAI chat:', error);
    
    // Return a structured fallback response if anything fails
    return getFallbackResponse(message);
  }
};

// Enhanced fallback response system with structured content based on message context
const getFallbackResponse = (message: string): ChatResponse => {
    const lowerMessage = message.toLowerCase();
    
  // Classify the message by topic for contextual fallbacks
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
    // Pricing related questions
    return CACHED_RESPONSES.pricing;
  } 
  
  if (lowerMessage.includes('program') || lowerMessage.includes('option') || lowerMessage.includes('plan')) {
    // Program related questions
    return CACHED_RESPONSES.show_programs;
  }
  
  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
    // Nutrition related questions
    return CACHED_RESPONSES.nutrition_guide;
  }
  
  if (lowerMessage.includes('workout') || lowerMessage.includes('exercise') || lowerMessage.includes('training')) {
    // Workout related questions
    return CACHED_RESPONSES.workout_examples;
  }
  
  if (lowerMessage.includes('result') || lowerMessage.includes('timeline') || lowerMessage.includes('how long')) {
    // Results/timeline related questions
    return CACHED_RESPONSES.timeline;
  }
  
  if (lowerMessage.includes('cancel') || lowerMessage.includes('refund') || lowerMessage.includes('policy')) {
    // Policy related questions
    return CACHED_RESPONSES.faq;
  }
  
  // Generic fallback with program recommendations
    return {
    message: "I understand you're interested in fitness programs. Here are our top options designed to help you reach your goals:",
    type: 'program_list',
    data: {
      programs: getJMEFitPrograms()
    },
      quick_replies: [
      { text: '💪 Get Personalized Recommendation', action: 'get_recommendation' },
      { text: '❓ Ask Another Question', action: 'ask_questions' },
      { text: '🏆 See Success Stories', action: 'success_stories' }
    ]
  };
};

// Helper functions for context extraction
export const extractGoals = (message: string): string[] => {
  const goals: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('lose weight') || lowerMessage.includes('fat loss') || lowerMessage.includes('cut')) {
    goals.push('weight_loss');
  }
  if (lowerMessage.includes('build muscle') || lowerMessage.includes('gain muscle') || lowerMessage.includes('bulk')) {
    goals.push('muscle_gain');
  }
  if (lowerMessage.includes('get fit') || lowerMessage.includes('fitness') || lowerMessage.includes('health')) {
    goals.push('general_fitness');
  }
  if (lowerMessage.includes('strength') || lowerMessage.includes('stronger')) {
    goals.push('strength');
  }
  if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('eating')) {
    goals.push('nutrition');
  }
  
  return goals;
};

export const extractExperienceLevel = (message: string): string | undefined => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('beginner') || lowerMessage.includes('new to') || lowerMessage.includes('just started')) {
    return 'beginner';
  }
  if (lowerMessage.includes('intermediate') || lowerMessage.includes('some experience')) {
    return 'intermediate';
  }
  if (lowerMessage.includes('advanced') || lowerMessage.includes('experienced') || lowerMessage.includes('years')) {
    return 'advanced';
  }
  
  return undefined;
};

const extractProgramInterest = (message: string): string[] => {
  const programs: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('nutrition only')) {
    programs.push('nutrition-only');
  }
  if (lowerMessage.includes('nutrition') && lowerMessage.includes('training')) {
    programs.push('nutrition-training');
  }
  if (lowerMessage.includes('self-led') || lowerMessage.includes('self led')) {
    programs.push('self-led-training');
  }
  if (lowerMessage.includes('trainer feedback') || lowerMessage.includes('feedback')) {
    programs.push('trainer-feedback');
  }
  if (lowerMessage.includes('shred') || lowerMessage.includes('challenge')) {
    programs.push('shred-challenge');
  }
  
  return programs;
};

const createContextualPrompt = (context: ChatSession['context'], message: string): string => {
  let prompt = `User message: "${message}"\n\n`;
  
  if (context.userGoals && context.userGoals.length > 0) {
    prompt += `User goals: ${context.userGoals.join(', ')}\n`;
  }
  if (context.experienceLevel) {
    prompt += `Experience level: ${context.experienceLevel}\n`;
  }
  if (context.interestedPrograms && context.interestedPrograms.length > 0) {
    prompt += `Previously interested in: ${context.interestedPrograms.join(', ')}\n`;
  }
  
  prompt += `\nPlease respond with a JSON object following this exact structure:
{
  "message": "Your helpful response text",
  "type": "text|program_list|recommendation|nutrition_guide|quick_actions|lead_capture|workout_info",
  "data": { optional: "additional data for the response type" },
  "quick_replies": [
    { "text": "Button text", "action": "action_type", "payload": "optional data" }
  ],
  "actions": [
    { "type": "add_to_cart|navigate|contact", "label": "Button label", "data": {} }
  ]
}

Guidelines:
- Keep messages conversational and encouraging
- Include relevant quick replies for common next steps
- Use type "program_list" when showing multiple programs
- Use type "recommendation" when suggesting a specific program
- Include action buttons when users show purchase intent
- Always include current pricing and accurate program details
- For navigate actions, use RELATIVE URLs only (e.g., "/programs", "/nutrition-only", NOT "https://jmefit.com/programs")
- Never include full domain URLs for internal pages to prevent duplication`;

  return prompt;
};

export const getProgramRecommendation = async (userPreferences: any): Promise<any> => {
  const programs = getJMEFitPrograms();
  
  // Simple recommendation logic based on preferences
  let recommendedProgram = programs[1]; // Default to Nutrition & Training
  
  if (userPreferences.goals?.includes('nutrition') && !userPreferences.goals?.includes('training')) {
    recommendedProgram = programs[0]; // Nutrition Only
  } else if (userPreferences.budget === 'low' || userPreferences.timeAvailable === 'limited') {
    recommendedProgram = programs[2]; // Self-Led Training
  } else if (userPreferences.goals?.includes('weight-loss') || userPreferences.goals?.includes('challenge')) {
    recommendedProgram = programs[4]; // SHRED Challenge
  }
  
  return {
    program: recommendedProgram.name,
    reasoning: `Based on your preferences, this program offers the best combination of features and value for your goals.`,
    features: recommendedProgram.features,
    price: recommendedProgram.price.monthly || recommendedProgram.price.oneTime,
    id: recommendedProgram.id
  };
};

// Export utility functions 
export { getJMEFitPrograms }; 