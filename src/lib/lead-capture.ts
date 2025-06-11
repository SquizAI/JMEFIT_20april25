/**
 * Lead Capture Utility
 * 
 * Functions for capturing and storing user contact information
 * from the chat interface.
 */

import { supabase } from './supabase';
import { sendLeadEmail } from './email-automation';

// Types
export interface UserPreferences {
  goals: string;
  experienceLevel: string;
  timeAvailable: string;
  budget: string;
  preferredFocus: string;
  interestedProgram?: string;
  [key: string]: any;
}

export interface LeadData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  source: string;
  fitness_goals: string[];
  experience_level: string;
  social_data: any;
  age?: number;
  gender?: string;
  annual_income?: number;
  lead_source?: string;
}

export interface ICPResult {
  score: number;
  segment: 'hot' | 'warm' | 'cold';
  recommended_product: string;
  factors: Record<string, number>;
}

// ICP Scoring Algorithm (0-100 points)
export function calculateICPScore(
  preferences: UserPreferences, 
  socialData?: any
): ICPResult {
  let score = 0;
  const factors: Record<string, number> = {};
  
  // Age Demographics (0-15 points) - Ideal: 30-45
  if (socialData?.age) {
    if (socialData.age >= 30 && socialData.age <= 45) {
      score += 15;
      factors.age = 15;
    } else if (socialData.age >= 25 && socialData.age <= 50) {
      score += 10;
      factors.age = 10;
    } else {
      score += 5;
      factors.age = 5;
    }
  }
  
  // Gender (0-10 points) - Primary target: Female
  if (socialData?.gender === 'female') {
    score += 10;
    factors.gender = 10;
  } else if (socialData?.gender === 'male') {
    score += 7;
    factors.gender = 7;
  }
  
  // Income Level (0-15 points) - Ideal: $50k+
  if (socialData?.annual_income >= 50000) {
    score += 15;
    factors.income = 15;
  } else if (socialData?.annual_income >= 30000) {
    score += 10;
    factors.income = 10;
  } else {
    score += 5;
    factors.income = 5;
  }
  
  // Fitness Goals (0-20 points)
  if (preferences.goals === 'weight_loss') {
    score += 20;
    factors.goals = 20;
  } else if (preferences.goals === 'muscle_gain' || preferences.goals === 'overall_fitness') {
    score += 15;
    factors.goals = 15;
  } else {
    score += 10;
    factors.goals = 10;
  }
  
  // Experience Level (0-10 points) - Ideal: Beginner/Intermediate
  if (preferences.experienceLevel === 'beginner' || preferences.experienceLevel === 'intermediate') {
    score += 10;
    factors.experience = 10;
  } else if (preferences.experienceLevel === 'advanced') {
    score += 7;
    factors.experience = 7;
  }
  
  // Preferred Focus (0-15 points) - Ideal: Both or Nutrition
  if (preferences.preferredFocus === 'both') {
    score += 15;
    factors.focus = 15;
  } else if (preferences.preferredFocus === 'nutrition') {
    score += 12;
    factors.focus = 12;
  } else if (preferences.preferredFocus === 'training') {
    score += 8;
    factors.focus = 8;
  }
  
  // Budget (0-15 points)
  if (preferences.budget === 'high') {
    score += 15;
    factors.budget = 15;
  } else if (preferences.budget === 'medium') {
    score += 10;
    factors.budget = 10;
  } else if (preferences.budget === 'low') {
    score += 5;
    factors.budget = 5;
  }
  
  const finalScore = Math.min(score, 100); // Cap at 100
  const segment = getSegment(finalScore);
  const recommended_product = getRecommendedProduct(preferences, segment);
  
  return {
    score: finalScore,
    segment,
    recommended_product,
    factors
  };
}

// Determine segment based on ICP score
function getSegment(icpScore: number): 'hot' | 'warm' | 'cold' {
  if (icpScore >= 70) return 'hot';
  if (icpScore >= 40) return 'warm';
  return 'cold';
}

// Recommend product based on preferences and segment
function getRecommendedProduct(preferences: UserPreferences, segment: string): string {
  // Hot leads → Nutrition & Training (premium)
  if (segment === 'hot') {
    if (preferences.preferredFocus === 'both' || preferences.goals === 'weight_loss') {
      return 'Nutrition & Training';
    }
  }
  
  // Warm leads → Self-Led Training (entry point)
  if (segment === 'warm') {
    if (preferences.preferredFocus === 'training' || preferences.experienceLevel === 'beginner') {
      return 'Self-Led Training';
    } else if (preferences.preferredFocus === 'nutrition') {
      return 'Nutrition Only';
    }
  }
  
  // Cold leads → SHRED Challenge (low barrier)
  return 'SHRED Challenge';
}

// Extract lead information from user preferences and conversation
export function extractLeadData(
  user: any, 
  preferences: UserPreferences, 
  conversationData?: any
): LeadData {
  return {
    email: user?.email || `chatbot_lead_${Date.now()}@temp.com`,
    first_name: user?.user_metadata?.first_name || user?.user_metadata?.name?.split(' ')[0] || 'Chatbot',
    last_name: user?.user_metadata?.last_name || user?.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Lead',
    phone: user?.user_metadata?.phone || null,
    source: 'chatbot',
    fitness_goals: [preferences.goals].filter(Boolean),
    experience_level: preferences.experienceLevel,
    social_data: {
      platform: 'website_chatbot',
      engagement_level: conversationData?.messageCount || 0,
      time_spent: conversationData?.timeSpent || 0,
      pages_visited: conversationData?.pagesVisited || ['chatbot'],
      ...conversationData
    },
    age: conversationData?.age || null,
    gender: conversationData?.gender || null,
    annual_income: conversationData?.annual_income || null,
    lead_source: 'chatbot'
  };
}

// Main lead capture function
export async function captureLeadDirectly(leadData: LeadData): Promise<{
  success: boolean;
  error?: string;
  data?: any;
}> {
  try {
    console.log('🎯 Capturing lead directly to Supabase:', leadData);
    
    // Calculate ICP score
    const icpResult = calculateICPScore({
      goals: leadData.fitness_goals[0] || '',
      experienceLevel: leadData.experience_level,
      timeAvailable: '',
      budget: leadData.social_data?.budget || 'medium',
      preferredFocus: leadData.social_data?.preferredFocus || 'both'
    }, {
      age: leadData.age,
      gender: leadData.gender,
      annual_income: leadData.annual_income
    });
    
    // Prepare data for database
    const prospectData = {
      email: leadData.email,
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      phone: leadData.phone,
      lead_source: leadData.source,
      fitness_goals: leadData.fitness_goals,
      experience_level: leadData.experience_level,
      social_data: leadData.social_data,
      age: leadData.age,
      gender: leadData.gender,
      annual_income: leadData.annual_income,
      icp_score: icpResult.score,
      segment: icpResult.segment,
      recommended_product: icpResult.recommended_product,
      icp_factors: icpResult.factors
    };
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('prospects')
      .upsert(prospectData, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Lead saved to database:', data);
    
    // Send email automation based on segment
    try {
      await sendLeadEmail(prospectData);
      console.log('📧 Email automation triggered');
    } catch (emailError) {
      console.error('📧 Email error (non-fatal):', emailError);
      // Don't fail the lead capture if email fails
    }
    
    return {
      success: true,
      data: {
        ...data,
        icp_score: icpResult.score,
        segment: icpResult.segment,
        recommended_product: icpResult.recommended_product
      }
    };
    
  } catch (error) {
    console.error('❌ Lead capture error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 

// Lead information type
export interface LeadInfo {
  email?: string;
  phone?: string;
  name?: string;
  source: string;
  timestamp: number;
  context?: {
    interests?: string[];
    goals?: string[];
    programInterest?: string;
    conversation?: string[];
  };
}

// Save lead information to local storage
export const saveLeadToLocalStorage = (leadInfo: LeadInfo): void => {
  try {
    // Get existing leads
    const existingLeadsJSON = localStorage.getItem('jmefit_leads');
    const existingLeads = existingLeadsJSON ? JSON.parse(existingLeadsJSON) : [];
    
    // Add new lead
    existingLeads.push(leadInfo);
    
    // Save back to local storage
    localStorage.setItem('jmefit_leads', JSON.stringify(existingLeads));
    
    console.log('✅ Lead saved to local storage:', leadInfo);
  } catch (error) {
    console.error('❌ Error saving lead to local storage:', error);
  }
};

// Save lead to database using Supabase
export const saveLeadToDatabase = async (leadInfo: LeadInfo): Promise<{ success: boolean, error?: string }> => {
  try {
    // Check if Supabase client is available
    if (!supabase) {
      console.warn('⚠️ Supabase client not available, falling back to local storage only');
      return { success: false, error: 'Supabase client not available' };
    }
    
    // Insert lead into the leads table
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          email: leadInfo.email || null,
          phone: leadInfo.phone || null,
          name: leadInfo.name || null,
          source: leadInfo.source,
          context: leadInfo.context || {},
          created_at: new Date().toISOString()
        }
      ]);
    
    if (error) {
      console.error('❌ Error saving lead to database:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Lead saved to database:', data);
    return { success: true };
  } catch (error) {
    console.error('❌ Error in saveLeadToDatabase:', error);
    return { success: false, error: 'Unknown error saving lead' };
  }
};

// Main function to save lead information
export const saveLeadInfo = async (leadInfo: LeadInfo): Promise<{ success: boolean, error?: string }> => {
  // Always save to local storage first
  saveLeadToLocalStorage(leadInfo);
  
  // Try to save to database
  try {
    return await saveLeadToDatabase(leadInfo);
  } catch (error) {
    console.error('❌ Error saving lead:', error);
    return { success: false, error: 'Error saving lead' };
  }
};

// Get conversation context for lead information
export const getConversationContext = (messages: any[]): string[] => {
  return messages
    .slice(-8) // Get last 8 messages
    .map(msg => `${msg.role}: ${msg.content?.substring(0, 100)}...`)
    .filter(Boolean);
};

// Extract user interests from conversation
export const extractInterests = (messages: any[]): string[] => {
  const interests: string[] = [];
  const keywords = [
    'weight loss', 'lose weight', 'diet', 'nutrition', 
    'workout', 'muscle', 'strength', 'training',
    'fitness', 'health', 'transformation', 'coach'
  ];
  
  // Analyze user messages
  messages
    .filter(msg => msg.role === 'user')
    .forEach(msg => {
      const content = msg.content?.toLowerCase() || '';
      keywords.forEach(keyword => {
        if (content.includes(keyword) && !interests.includes(keyword)) {
          interests.push(keyword);
        }
      });
    });
  
  return interests;
};

// Extract program interest from conversation
export const extractProgramInterest = (messages: any[]): string | undefined => {
  const programKeywords: Record<string, string> = {
    'nutrition only': 'Nutrition Only',
    'nutrition and training': 'Nutrition & Training',
    'nutrition & training': 'Nutrition & Training',
    'self-led': 'Self-Led Training',
    'self led': 'Self-Led Training',
    'trainer feedback': 'Trainer Feedback',
    'shred challenge': 'SHRED Challenge',
    'macros calculation': 'One-Time Macros Calculation'
  };
  
  // Check last 10 messages
  const recentMessages = messages.slice(-10);
  
  for (const msg of recentMessages) {
    const content = msg.content?.toLowerCase() || '';
    
    for (const [keyword, program] of Object.entries(programKeywords)) {
      if (content.includes(keyword)) {
        return program;
      }
    }
  }
  
  return undefined;
};

export default {
  saveLeadInfo,
  saveLeadToLocalStorage,
  saveLeadToDatabase,
  getConversationContext,
  extractInterests,
  extractProgramInterest
}; 