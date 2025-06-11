/**
 * User Preferences Management
 * 
 * Utilities for storing and retrieving user preferences in browser storage
 * to enable personalized chat experiences.
 */

export interface UserPreferences {
  goals?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  viewedPrograms?: string[];
  interestedPrograms?: string[];
  lastInteraction?: number;
  conversationHistory?: {
    query: string;
    response: string;
    timestamp: number;
  }[];
  personalInfo?: {
    email?: string;
    phone?: string;
    name?: string;
  };
  // Enhanced user preference tracking
  equipment?: {
    type: 'home' | 'gym' | 'minimal' | 'travel';
    details?: string[];
  };
  availability?: {
    daysPerWeek?: number;
    timePerSession?: number;
  };
  dietaryPreferences?: {
    restrictions?: string[];
    preferredDiet?: 'standard' | 'keto' | 'vegetarian' | 'vegan' | 'paleo';
  };
  analyticsData?: {
    visitsCount: number;
    pagesViewed: string[];
    buttons: {
      clicked: string[];
      lastClicked: string;
    };
    programsViewed: {
      id: string;
      viewCount: number;
      lastViewed: number;
    }[];
    chatInteractions: {
      totalMessages: number;
      questionsAsked: number;
      lastQuery: string;
    };
  };
}

const STORAGE_KEY = 'jmefit_user_preferences';

/**
 * Save user preferences to local storage
 */
export const saveUserPreferences = (preferences: Partial<UserPreferences>): void => {
  try {
    const existing = getUserPreferences();
    const updated = { ...existing, ...preferences };
    
    // Update last interaction timestamp
    updated.lastInteraction = Date.now();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};

/**
 * Get user preferences from local storage
 */
export const getUserPreferences = (): UserPreferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { 
      goals: [],
      viewedPrograms: [],
      interestedPrograms: [],
      conversationHistory: [],
      analyticsData: {
        visitsCount: 0,
        pagesViewed: [],
        buttons: {
          clicked: [],
          lastClicked: ''
        },
        programsViewed: [],
        chatInteractions: {
          totalMessages: 0,
          questionsAsked: 0,
          lastQuery: ''
        }
      }
    };
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { 
      goals: [],
      viewedPrograms: [],
      interestedPrograms: [],
      conversationHistory: [],
      analyticsData: {
        visitsCount: 0,
        pagesViewed: [],
        buttons: {
          clicked: [],
          lastClicked: ''
        },
        programsViewed: [],
        chatInteractions: {
          totalMessages: 0,
          questionsAsked: 0,
          lastQuery: ''
        }
      }
    };
  }
};

/**
 * Add a goal to user preferences
 */
export const addUserGoal = (goal: string): void => {
  const preferences = getUserPreferences();
  const goals = preferences.goals || [];
  
  if (!goals.includes(goal)) {
    saveUserPreferences({
      goals: [...goals, goal]
    });
  }
};

/**
 * Add a viewed program to user preferences
 */
export const addViewedProgram = (programId: string): void => {
  const preferences = getUserPreferences();
  const viewedPrograms = preferences.viewedPrograms || [];
  const analyticsData = preferences.analyticsData || {
    visitsCount: 0,
    pagesViewed: [],
    buttons: { clicked: [], lastClicked: '' },
    programsViewed: [],
    chatInteractions: { totalMessages: 0, questionsAsked: 0, lastQuery: '' }
  };
  
  // Update viewed programs list
  if (!viewedPrograms.includes(programId)) {
    saveUserPreferences({
      viewedPrograms: [...viewedPrograms, programId]
    });
  }
  
  // Update analytics data
  const programsViewed = analyticsData.programsViewed || [];
  const existingProgram = programsViewed.find(p => p.id === programId);
  
  if (existingProgram) {
    existingProgram.viewCount += 1;
    existingProgram.lastViewed = Date.now();
  } else {
    programsViewed.push({
      id: programId,
      viewCount: 1,
      lastViewed: Date.now()
    });
  }
  
  saveUserPreferences({
    analyticsData: {
      ...analyticsData,
      programsViewed
    }
  });
};

/**
 * Add an interested program to user preferences
 */
export const addInterestedProgram = (programId: string): void => {
  const preferences = getUserPreferences();
  const interestedPrograms = preferences.interestedPrograms || [];
  
  if (!interestedPrograms.includes(programId)) {
    saveUserPreferences({
      interestedPrograms: [...interestedPrograms, programId]
    });
  }
};

/**
 * Set user experience level
 */
export const setExperienceLevel = (level: 'beginner' | 'intermediate' | 'advanced'): void => {
  saveUserPreferences({
    experienceLevel: level
  });
};

/**
 * Add conversation to history
 */
export const addConversationToHistory = (query: string, response: string): void => {
  const preferences = getUserPreferences();
  const history = preferences.conversationHistory || [];
  const analyticsData = preferences.analyticsData || {
    visitsCount: 0,
    pagesViewed: [],
    buttons: { clicked: [], lastClicked: '' },
    programsViewed: [],
    chatInteractions: { totalMessages: 0, questionsAsked: 0, lastQuery: '' }
  };
  
  // Keep only the last 10 conversations to prevent storage bloat
  const updatedHistory = [
    ...history.slice(-9),
    { query, response, timestamp: Date.now() }
  ];
  
  // Update chat interaction analytics
  const chatInteractions = analyticsData.chatInteractions || { totalMessages: 0, questionsAsked: 0, lastQuery: '' };
  chatInteractions.totalMessages += 1;
  
  // Check if this is a question
  if (query.includes('?')) {
    chatInteractions.questionsAsked += 1;
  }
  
  chatInteractions.lastQuery = query;
  
  saveUserPreferences({
    conversationHistory: updatedHistory,
    analyticsData: {
      ...analyticsData,
      chatInteractions
    }
  });
};

/**
 * Track button click in analytics
 */
export const trackButtonClick = (buttonAction: string): void => {
  const preferences = getUserPreferences();
  const analyticsData = preferences.analyticsData || {
    visitsCount: 0,
    pagesViewed: [],
    buttons: { clicked: [], lastClicked: '' },
    programsViewed: [],
    chatInteractions: { totalMessages: 0, questionsAsked: 0, lastQuery: '' }
  };
  
  const buttons = analyticsData.buttons || { clicked: [], lastClicked: '' };
  
  // Add to clicked array if not already there (max 20 entries)
  if (!buttons.clicked.includes(buttonAction)) {
    buttons.clicked = [...buttons.clicked.slice(-19), buttonAction];
  }
  
  buttons.lastClicked = buttonAction;
  
  saveUserPreferences({
    analyticsData: {
      ...analyticsData,
      buttons
    }
  });
};

/**
 * Track page view in analytics
 */
export const trackPageView = (pagePath: string): void => {
  const preferences = getUserPreferences();
  const analyticsData = preferences.analyticsData || {
    visitsCount: 0,
    pagesViewed: [],
    buttons: { clicked: [], lastClicked: '' },
    programsViewed: [],
    chatInteractions: { totalMessages: 0, questionsAsked: 0, lastQuery: '' }
  };
  
  // Increment visit count
  analyticsData.visitsCount = (analyticsData.visitsCount || 0) + 1;
  
  // Add page to viewed pages if not already there (max 10 entries)
  if (!analyticsData.pagesViewed.includes(pagePath)) {
    analyticsData.pagesViewed = [...(analyticsData.pagesViewed || []).slice(-9), pagePath];
  }
  
  saveUserPreferences({
    analyticsData
  });
};

/**
 * Save user personal information
 */
export const saveUserPersonalInfo = (info: { email?: string; phone?: string; name?: string }): void => {
  const preferences = getUserPreferences();
  const personalInfo = preferences.personalInfo || {};
  
  saveUserPreferences({
    personalInfo: { ...personalInfo, ...info }
  });
};

/**
 * Save user equipment preferences
 */
export const saveEquipmentPreferences = (
  type: 'home' | 'gym' | 'minimal' | 'travel',
  details?: string[]
): void => {
  saveUserPreferences({
    equipment: { type, details }
  });
};

/**
 * Save user availability preferences
 */
export const saveAvailabilityPreferences = (
  daysPerWeek: number,
  timePerSession: number
): void => {
  saveUserPreferences({
    availability: { daysPerWeek, timePerSession }
  });
};

/**
 * Save dietary preferences
 */
export const saveDietaryPreferences = (
  restrictions: string[],
  preferredDiet?: 'standard' | 'keto' | 'vegetarian' | 'vegan' | 'paleo'
): void => {
  saveUserPreferences({
    dietaryPreferences: { restrictions, preferredDiet }
  });
};

/**
 * Get personalized recommendations based on user preferences
 */
export const getPersonalizedRecommendations = (): string[] => {
  const preferences = getUserPreferences();
  const recommendations: string[] = [];
  
  // Based on goals
  if (preferences.goals?.includes('weight-loss')) {
    recommendations.push('nutrition-only', 'shred-challenge');
  }
  
  if (preferences.goals?.includes('muscle-gain')) {
    recommendations.push('nutrition-training', 'trainer-feedback');
  }
  
  if (preferences.goals?.includes('overall-fitness')) {
    recommendations.push('self-led-training');
  }
  
  // Based on experience level
  if (preferences.experienceLevel === 'beginner') {
    recommendations.push('nutrition-training'); // Full support
  } else if (preferences.experienceLevel === 'advanced') {
    recommendations.push('trainer-feedback'); // For form checks
  }
  
  // Based on equipment access
  if (preferences.equipment?.type === 'home') {
    recommendations.push('self-led-training', 'nutrition-only');
  } else if (preferences.equipment?.type === 'minimal') {
    recommendations.push('nutrition-only', 'macro-calculation');
  }
  
  // Based on time availability
  if (preferences.availability?.daysPerWeek && preferences.availability.daysPerWeek <= 3) {
    recommendations.push('nutrition-only'); // Focus on nutrition with limited workout time
  }
  
  // Prioritize based on viewing and interest history
  if (preferences.analyticsData?.programsViewed) {
    const mostViewed = [...preferences.analyticsData.programsViewed]
      .sort((a, b) => b.viewCount - a.viewCount)
      .map(p => p.id);
    
    if (mostViewed.length > 0) {
      // Add the most viewed program with higher priority
      recommendations.unshift(mostViewed[0]);
    }
  }
  
  // Remove duplicates
  return [...new Set(recommendations)];
};

/**
 * Get user engagement score (0-100)
 * Useful for determining how engaged the user is and tailoring responses
 */
export const getUserEngagementScore = (): number => {
  const preferences = getUserPreferences();
  let score = 0;
  
  // Basic presence and recency (0-25 points)
  if (preferences.lastInteraction) {
    const daysSinceLastInteraction = (Date.now() - preferences.lastInteraction) / (1000 * 60 * 60 * 24);
    if (daysSinceLastInteraction < 1) {
      score += 25; // Today
    } else if (daysSinceLastInteraction < 3) {
      score += 20; // Last 3 days
    } else if (daysSinceLastInteraction < 7) {
      score += 15; // Last week
    } else if (daysSinceLastInteraction < 30) {
      score += 10; // Last month
    } else {
      score += 5;  // Older
    }
  }
  
  // Interaction depth (0-25 points)
  const chatInteractions = preferences.analyticsData?.chatInteractions?.totalMessages || 0;
  if (chatInteractions > 20) {
    score += 25;
  } else if (chatInteractions > 10) {
    score += 20;
  } else if (chatInteractions > 5) {
    score += 15;
  } else if (chatInteractions > 0) {
    score += 10;
  }
  
  // Profile completeness (0-25 points)
  let profileCompleteness = 0;
  if (preferences.goals && preferences.goals.length > 0) profileCompleteness += 5;
  if (preferences.experienceLevel) profileCompleteness += 5;
  if (preferences.equipment) profileCompleteness += 5;
  if (preferences.availability) profileCompleteness += 5;
  if (preferences.personalInfo?.name) profileCompleteness += 5;
  score += profileCompleteness;
  
  // Interest signals (0-25 points)
  let interestSignals = 0;
  if (preferences.interestedPrograms && preferences.interestedPrograms.length > 0) interestSignals += 10;
  if (preferences.viewedPrograms && preferences.viewedPrograms.length > 0) interestSignals += 5;
  if (preferences.personalInfo?.email || preferences.personalInfo?.phone) interestSignals += 10;
  score += interestSignals;
  
  return Math.min(score, 100);
};

/**
 * Clear all user preferences
 */
export const clearUserPreferences = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export default {
  saveUserPreferences,
  getUserPreferences,
  addUserGoal,
  addViewedProgram,
  addInterestedProgram,
  setExperienceLevel,
  addConversationToHistory,
  saveUserPersonalInfo,
  getPersonalizedRecommendations,
  getUserEngagementScore,
  trackButtonClick,
  trackPageView,
  saveEquipmentPreferences,
  saveAvailabilityPreferences,
  saveDietaryPreferences,
  clearUserPreferences
}; 