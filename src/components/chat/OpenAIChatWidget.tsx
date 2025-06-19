import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, ChevronDown, X, ShoppingCart, ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cart';
import { useAuth } from '../../contexts/AuthContext';
import { createChatSession, sendMessage, getJMEFitPrograms, type ChatResponse, type ChatSession, CACHED_RESPONSES, extractGoals, extractExperienceLevel } from '../../lib/openai-chatbot';
import { toast } from 'react-hot-toast';
import LeadCaptureForm from './LeadCaptureForm';
import {
  getUserPreferences,
  saveUserPreferences,
  addUserGoal,
  addViewedProgram,
  addInterestedProgram,
  setExperienceLevel,
  addConversationToHistory,
  saveUserPersonalInfo,
  getPersonalizedRecommendations,
  trackButtonClick,
  trackPageView,
  saveEquipmentPreferences,
  saveAvailabilityPreferences,
  saveDietaryPreferences
} from '../../lib/user-preferences';

// Helper functions for lead capture and analysis
const extractInterests = (text: string): string[] => {
  const interests: string[] = [];
  const keywords = [
    'weight loss', 'lose weight', 'diet', 'nutrition', 
    'workout', 'muscle', 'strength', 'training',
    'fitness', 'health', 'transformation', 'coach'
  ];
  
  keywords.forEach(keyword => {
    if (text.toLowerCase().includes(keyword) && !interests.includes(keyword)) {
      interests.push(keyword);
    }
  });
  
  return interests;
};

const extractProgramInterest = (text: string): string | undefined => {
  const programKeywords: Record<string, string> = {
    'nutrition only': 'Nutrition Only',
    'nutrition and training': 'Nutrition & Training',
    'nutrition & training': 'Nutrition & Training',
    'self-led': 'Self-Led Training',
    'self led': 'Self-Led Training',
    'trainer feedback': 'Trainer Feedback',
    'shred challenge': 'SHRED Challenge',
    'transformation bundle': 'Complete Transformation Bundle'
  };
  
  for (const [keyword, program] of Object.entries(programKeywords)) {
    if (text.toLowerCase().includes(keyword)) {
      return program;
    }
  }
  
  return undefined;
};

const saveLeadInfo = async (leadInfo: any): Promise<{ success: boolean }> => {
  try {
    // For this simplified version, we just log the lead info and save to user preferences
    console.log('📧 Lead captured:', leadInfo);
    
    // Save email or phone to user preferences if available
    if (leadInfo.email) {
      saveUserPersonalInfo({ email: leadInfo.email });
    }
    if (leadInfo.phone) {
      saveUserPersonalInfo({ phone: leadInfo.phone });
    }
    
    // Could be expanded to send to an API endpoint if needed
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving lead info:', error);
    return { success: false };
  }
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  response?: ChatResponse;
}

interface QuickReply {
  text: string;
  action: string;
  payload?: any;
}

/**
 * OpenAI-powered JMEFit Chat Widget
 * 
 * Features:
 * - Structured responses with interactive buttons
 * - Program recommendations with add-to-cart functionality (with correct pricing)
 * - Context-aware conversations
 * - Quick reply buttons for common questions
 * - Mobile-optimized interface
 * - Lead capture functionality
 */
const OpenAIChatWidget: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCartStore();
  
  // Chat state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  // Debounce protection for button clicks
  const [isProcessingClick, setIsProcessingClick] = useState<boolean>(false);
  
  // Add fullscreen state for desktop
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState<boolean>(false);
  const [leadCaptureType, setLeadCaptureType] = useState<'email' | 'phone'>('email');
  const [leadCaptureReason, setLeadCaptureReason] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // First session state
  const [isFirstSession, setIsFirstSession] = useState<boolean>(false);
  
  // Add conversation stage tracking
  const [conversationStage, setConversationStage] = useState<number>(1); // 1-6 for the 6 stages
  
  // Add missing state variables and refs for the chat input
  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Fix the trackProgramView function to use the correct properties
  const trackProgramView = (programId: string) => {
    // Track this program view in user preferences
    if (!chatSession) return;
    
    // Update chat session with the program view
    setChatSession(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        context: {
          ...prev.context,
          programViews: [...(prev.context.programViews || []), programId]
        }
      };
    });
    
    console.log(`Tracked program view: ${programId}`);
  };
  
  // Initialize chat session and welcome message
  useEffect(() => {
    const newSession = createChatSession();
    setChatSession(newSession);
    
    // Get user preferences to personalize welcome message
    const preferences = getUserPreferences();
    const hasInteractedBefore = preferences.lastInteraction && 
                              preferences.conversationHistory && 
                              preferences.conversationHistory.length > 0;
    const personalInfo = preferences.personalInfo;
    
    // Create personalized welcome message with improved marketing copy
    let welcomeContent = "";
    
    if (hasInteractedBefore && personalInfo?.name) {
      welcomeContent = `Welcome back, ${personalInfo.name}! 👋 Excited to continue your fitness journey with JMEFit. What can I help you with today?`;
    } else if (hasInteractedBefore) {
      welcomeContent = "Welcome back to JMEFit! 👋 Ready to continue your fitness transformation? How can I help you today?";
    } else {
      welcomeContent = "Welcome to JMEFit! 👋 I'm Jaime's AI assistant, here to help you find the perfect fitness program for your goals. What's your primary fitness goal?";
    }
    
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      response: {
        message: welcomeContent,
        type: 'text',
        quick_replies: hasInteractedBefore ? [
          { text: '🎯 Get a personalized recommendation', action: 'get_recommendation' },
          { text: '📊 View programs', action: 'show_programs' },
          { text: '❓ Ask questions', action: 'ask_questions' },
          { text: '🔄 Start fresh', action: 'reset_preferences' }
        ] : [
          { text: '🔥 Lose fat & get lean', action: 'goal_weight_loss' },
          { text: '💪 Build muscle', action: 'goal_muscle_gain' },
          { text: '🥗 Improve nutrition', action: 'goal_nutrition' },
          { text: '🏃‍♀️ Overall fitness', action: 'goal_general_fitness' }
        ]
      }
    };
    
    // Instead of showing all programs to returning users immediately (duplicated content issue),
    // present a more focused conversation pathway with quick replies
    if (hasInteractedBefore && 
       ((preferences.goals && preferences.goals.length > 0) || 
        (preferences.interestedPrograms && preferences.interestedPrograms.length > 0))) {
      
      welcomeMessage.response = {
        message: welcomeContent,
        type: 'text',
        quick_replies: [
          { text: '🎯 Get recommendation', action: 'get_recommendation' },
          { text: '📊 View programs', action: 'show_programs' },
          { text: '💬 Ask questions', action: 'ask_questions' }
        ]
      };
    }
    
    setMessages([welcomeMessage]);
    setQuickReplies(welcomeMessage.response?.quick_replies || []);
    
    // Track if this is first session to show welcome again when chat is reopened
    setIsFirstSession(!hasInteractedBefore);
  }, []);
  
  // Handle chat reopening - show welcome message again if closed
  useEffect(() => {
    if (isOpen && isFirstSession && messages.length <= 1) {
      // If chat is opened and we only have the welcome message or less
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Welcome to JMEFit! 👋 I'm Jaime's AI assistant, here to help you find the perfect fitness program for your goals. What's your primary fitness goal?",
        timestamp: new Date(),
        response: {
          message: "Welcome to JMEFit! 👋 I'm Jaime's AI assistant, here to help you find the perfect fitness program for your goals. What's your primary fitness goal?",
          type: 'text',
          quick_replies: [
            { text: '🔥 Lose fat & get lean', action: 'goal_weight_loss' },
            { text: '💪 Build muscle', action: 'goal_muscle_gain' },
            { text: '🥗 Improve nutrition', action: 'goal_nutrition' },
            { text: '🏃‍♀️ Overall fitness', action: 'goal_general_fitness' }
          ]
        }
      };
      
      setMessages([welcomeMessage]);
      setQuickReplies(welcomeMessage.response?.quick_replies || []);
    }
  }, [isOpen, isFirstSession, messages.length]);
  
  // Handle lead capture responses
  const handleLeadCaptureResponse = (response: ChatResponse) => {
    if (!response || !response.data) return;
    
    setLeadCaptureReason(response.data?.reason || 'Get personalized fitness tips and program updates');
    
    // Default to email if not specified
    if (response.quick_replies) {
      const shareEmailAction = response.quick_replies.find(reply => reply.action === 'share_email');
      const sharePhoneAction = response.quick_replies.find(reply => reply.action === 'share_phone');
      
      if (shareEmailAction) {
        setLeadCaptureType('email');
        setShowLeadCapture(true);
      } else if (sharePhoneAction) {
        setLeadCaptureType('phone');
        setShowLeadCapture(true);
      }
    }
  };
  
  // Handle lead submission
  const handleLeadSubmit = async (value: string, type: 'email' | 'phone') => {
    try {
      setIsTyping(true);
      setShowLeadCapture(false);
      
      // Add user message
      const userMessage = `Here's my ${type}: ${value}`;
      setMessages(prev => [...prev, { role: 'user' as const, content: userMessage, timestamp: new Date() }]);
      
      // Store in user preferences
      if (type === 'email') {
        saveUserPersonalInfo({ email: value });
      } else if (type === 'phone') {
        saveUserPersonalInfo({ phone: value });
      }
      
      // Save lead info to database or send email
      const leadData = {
        [type]: value,
        source: 'chat',
        timestamp: Date.now(),
        context: {
          interests: extractInterests(messages.map(m => m.content).join(' ')),
          programInterest: extractProgramInterest(messages.map(m => m.content).join(' ')),
          conversation: messages.slice(-5).map(m => m.content)
        }
      };
      
      await saveLeadInfo(leadData);
      
      // Thank the user
      const thanksMessage: ChatMessage = {
        role: 'assistant',
        content: `Thank you for sharing your ${type}! 🙏 I've passed it along to Jaime. Now, what would you like to know more about?`,
        timestamp: new Date(),
        response: {
          message: `Thank you for sharing your ${type}! 🙏 I've passed it along to Jaime. Now, what would you like to know more about?`,
          type: 'text',
          quick_replies: [
            { text: '📊 Show me programs', action: 'show_programs' },
            { text: '🎯 Get recommendation', action: 'get_recommendation' },
            { text: '❓ Ask questions', action: 'ask_questions' }
          ]
        }
      };
      
      setMessages(prev => [...prev, thanksMessage]);
      setQuickReplies(thanksMessage.response?.quick_replies || []);
      
      // Add conversation to history
      addConversationToHistory(userMessage, thanksMessage.content);
      
    } catch (error) {
      console.error('Error handling lead submission:', error);
      toast.error('There was an error submitting your information. Please try again.');
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };
  
  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);
  
  // Safari iOS viewport height fix
  useEffect(() => {
    // Handle Safari iOS viewport height issues
    const fixSafariVh = () => {
      // Set a CSS variable to the actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Initial call
    fixSafariVh();
    
    // Add event listener for resize and orientation change
    window.addEventListener('resize', fixSafariVh);
    window.addEventListener('orientationchange', fixSafariVh);
    
    return () => {
      window.removeEventListener('resize', fixSafariVh);
      window.removeEventListener('orientationchange', fixSafariVh);
    };
  }, []);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
    
    // Scroll to bottom when opening chat
    if (!isOpen) {
      setTimeout(() => scrollToBottom(), 300);
    }
  };

  // Handle fullscreen toggle for desktop
  const handleToggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
    // Scroll to bottom after fullscreen toggle
    setTimeout(() => scrollToBottom(), 300);
  };
  
  // Handle user selecting a goal through quick replies - improved to implement our funnel
  const handleGoalSelection = (goal: string) => {
    switch (goal) {
      case 'goal_weight_loss':
        addUserGoal('weight-loss');
        // Progress conversation to next step in funnel - qualification
        const weightLossMessage: ChatMessage = {
          role: 'assistant',
          content: "Weight loss is one of our specialties at JMEFit! To help you achieve the best results, could you share your current experience level with fitness and nutrition?",
          timestamp: new Date(),
          response: {
            message: "Weight loss is one of our specialties at JMEFit! To help you achieve the best results, could you share your current experience level with fitness and nutrition?",
            type: 'text',
            quick_replies: [
              { text: '🔰 Beginner (0-1 years)', action: 'experience_beginner' },
              { text: '🔄 Intermediate (1-3 years)', action: 'experience_intermediate' },
              { text: '⭐ Advanced (3+ years)', action: 'experience_advanced' }
            ]
          }
        };
        
        // Add user message
        const userWeightLossMessage: ChatMessage = {
          role: 'user',
          content: "I want to lose fat & get lean",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userWeightLossMessage, weightLossMessage]);
        setQuickReplies(weightLossMessage.response?.quick_replies || []);
        setConversationStage(2);
        scrollToBottom();
        break;
        
      case 'goal_muscle_gain':
        addUserGoal('muscle-gain');
        // Progress conversation to next step in funnel - qualification
        const muscleGainMessage: ChatMessage = {
          role: 'assistant',
          content: "Building muscle is a great goal! To recommend the best program for you, I'd like to know your experience level with resistance training. How long have you been training?",
          timestamp: new Date(),
          response: {
            message: "Building muscle is a great goal! To recommend the best program for you, I'd like to know your experience level with resistance training. How long have you been training?",
            type: 'text',
            quick_replies: [
              { text: '🔰 Beginner (0-1 years)', action: 'experience_beginner' },
              { text: '🔄 Intermediate (1-3 years)', action: 'experience_intermediate' },
              { text: '⭐ Advanced (3+ years)', action: 'experience_advanced' }
            ]
          }
        };
        
        // Add user message
        const userMuscleMessage: ChatMessage = {
          role: 'user',
          content: "I want to build muscle",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMuscleMessage, muscleGainMessage]);
        setQuickReplies(muscleGainMessage.response?.quick_replies || []);
        setConversationStage(2);
        scrollToBottom();
        break;
        
      case 'goal_nutrition':
        addUserGoal('nutrition');
        // Progress conversation to next step in funnel - qualification
        const nutritionMessage: ChatMessage = {
          role: 'assistant',
          content: "Improving your nutrition is a fantastic focus! To provide the most relevant guidance, could you share your current experience level with nutrition and meal planning?",
          timestamp: new Date(),
          response: {
            message: "Improving your nutrition is a fantastic focus! To provide the most relevant guidance, could you share your current experience level with nutrition and meal planning?",
            type: 'text',
            quick_replies: [
              { text: '🔰 Beginner (0-1 years)', action: 'experience_beginner' },
              { text: '🔄 Intermediate (1-3 years)', action: 'experience_intermediate' },
              { text: '⭐ Advanced (3+ years)', action: 'experience_advanced' }
            ]
          }
        };
        
        // Add user message
        const userNutritionMessage: ChatMessage = {
          role: 'user',
          content: "I want to improve my nutrition",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userNutritionMessage, nutritionMessage]);
        setQuickReplies(nutritionMessage.response?.quick_replies || []);
        setConversationStage(2);
        scrollToBottom();
        break;
        
      case 'goal_general_fitness':
        addUserGoal('overall-fitness');
        // Progress conversation to next step in funnel - qualification
        const fitnessMessage: ChatMessage = {
          role: 'assistant',
          content: "Overall fitness is a great goal! To help tailor my recommendation, could you share your current fitness experience level?",
          timestamp: new Date(),
          response: {
            message: "Overall fitness is a great goal! To help tailor my recommendation, could you share your current fitness experience level?",
            type: 'text',
            quick_replies: [
              { text: '🔰 Beginner (0-1 years)', action: 'experience_beginner' },
              { text: '🔄 Intermediate (1-3 years)', action: 'experience_intermediate' },
              { text: '⭐ Advanced (3+ years)', action: 'experience_advanced' }
            ]
          }
        };
        
        // Add user message
        const userFitnessMessage: ChatMessage = {
          role: 'user',
          content: "I want to improve my overall fitness",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userFitnessMessage, fitnessMessage]);
        setQuickReplies(fitnessMessage.response?.quick_replies || []);
        setConversationStage(2);
        scrollToBottom();
        break;
    }
  };
  
  // Reset user preferences
  const resetUserPreferences = () => {
    // Clear local storage preferences
    localStorage.removeItem('jmefit_user_preferences');
    
    // Show new user welcome message
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: "Great! Let's start fresh. I'm Jaime's AI assistant and I'm here to help you find the perfect fitness program for your goals. What are you mainly looking to achieve?",
      timestamp: new Date(),
      response: {
        message: "Great! Let's start fresh. I'm Jaime's AI assistant and I'm here to help you find the perfect fitness program for your goals. What are you mainly looking to achieve?",
        type: 'text',
        quick_replies: [
          { text: '🔥 Lose fat & weight', action: 'goal_weight_loss' },
          { text: '💪 Build muscle', action: 'goal_muscle_gain' },
          { text: '🥗 Improve nutrition', action: 'nutrition_guide' },
          { text: '🏃‍♀️ General fitness', action: 'goal_general_fitness' }
        ]
      }
    };
    
    setMessages([welcomeMessage]);
    setQuickReplies(welcomeMessage.response?.quick_replies || []);
    
    toast.success('Preferences reset! Let\'s start fresh.');
  };
  
  // Function to find cached responses based on text content
  const findCachedResponse = (text: string): ChatResponse | null => {
    const normalizedText = text.toLowerCase().trim();
    
    // Check for common keywords to route to appropriate cached responses
    if (normalizedText.includes('program') && (normalizedText.includes('show') || normalizedText.includes('list') || normalizedText.includes('all'))) {
      return CACHED_RESPONSES.show_programs;
    }
    
    if (normalizedText.includes('nutrition') || normalizedText.includes('diet') || normalizedText.includes('eating') || normalizedText.includes('food')) {
      return CACHED_RESPONSES.nutrition_guide;
    }
    
    if (normalizedText.includes('timeline') || normalizedText.includes('how long') || normalizedText.includes('results')) {
      return CACHED_RESPONSES.timeline;
    }
    
    if (normalizedText.includes('success') || normalizedText.includes('testimonial') || normalizedText.includes('story')) {
      return CACHED_RESPONSES.success_stories;
    }
    
    if (normalizedText.includes('workout example') || normalizedText.includes('exercise example')) {
      return CACHED_RESPONSES.workout_examples;
    }
    
    if (normalizedText.includes('equipment') || normalizedText.includes('need to buy')) {
      return CACHED_RESPONSES.equipment_needs;
    }
    
    if (normalizedText.includes('faq') || normalizedText.includes('question') || normalizedText.includes('ask')) {
      return CACHED_RESPONSES.faq;
    }
    
    if (normalizedText.includes('home workout') || normalizedText.includes('workout at home')) {
      return CACHED_RESPONSES.home_workouts;
    }
    
    if (normalizedText.includes('gym workout') || normalizedText.includes('workout at gym')) {
      return CACHED_RESPONSES.gym_workouts;
    }
    
    if (normalizedText.includes('access') || normalizedText.includes('how to use') || normalizedText.includes('login')) {
      return CACHED_RESPONSES.workout_access;
    }
    
    if (normalizedText.includes('app') || normalizedText.includes('mobile') || normalizedText.includes('platform')) {
      return CACHED_RESPONSES.app_preview;
    }
    
    // If no match found, return null to trigger API call
    return null;
  };
  
  // Update handleQuickReply to handle goal selection and experience level responses
  const handleQuickReply = async (reply: QuickReply) => {
    // Prevent multiple rapid clicks
    if (isProcessingClick) {
      console.log('Ignoring click - already processing another action');
      return;
    }
    
    setIsProcessingClick(true);
    
    try {
      // Track this button click in user preferences
      trackButtonClick(reply.action);
      
      // Track conversation context from the quick reply
      updateConversationContext(reply.text);
      
      // Handle goal selection actions
      if (reply.action === 'goal_weight_loss' || 
          reply.action === 'goal_muscle_gain' || 
          reply.action === 'goal_nutrition' || 
          reply.action === 'goal_general_fitness') {
        handleGoalSelection(reply.action);
        setIsProcessingClick(false);
        return;
      }
      
      // Special handling for experience level selection
      if (reply.action === 'experience_beginner' || 
          reply.action === 'experience_intermediate' || 
          reply.action === 'experience_advanced') {
        
        // Save the experience level
        const level = reply.action.replace('experience_', '') as 'beginner' | 'intermediate' | 'advanced';
        setExperienceLevel(level);
        
        // Add user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: reply.text,
          timestamp: new Date()
        };
        
        // Create assistant response asking about training location
        const trainingLocationMessage: ChatMessage = {
          role: 'assistant',
          content: "Thanks for sharing! Now I'd like to understand your workout preferences to better tailor our recommendation.",
          timestamp: new Date(),
          response: {
            message: "Thanks for sharing! Now I'd like to understand your workout preferences to better tailor our recommendation.",
            type: 'text',
            quick_replies: [
              { text: '🏋️ Gym Workouts', action: 'location_gym' },
              { text: '🏠 Home Workouts', action: 'location_home' },
              { text: '🔄 Both Options', action: 'location_both' }
            ]
          }
        };
        
        // Add messages to chat
        setMessages(prev => [...prev, userMessage, trainingLocationMessage]);
        setQuickReplies(trainingLocationMessage.response?.quick_replies || []);
        
        // Advance to next stage
        setConversationStage(3);
        scrollToBottom();
        setIsProcessingClick(false);
        return;
      }
      
      // Special handling for training location selection
      if (reply.action === 'location_gym' || 
          reply.action === 'location_home' || 
          reply.action === 'location_both') {
        
        // Save the training location preference
        const location = reply.action.replace('location_', '') as 'gym' | 'home' | 'both';
        // Map to the allowed values for saveEquipmentPreferences
        const equipmentLevel = location === 'gym' ? 'gym' : 
                             location === 'home' ? 'home' : 'minimal';
        saveEquipmentPreferences(equipmentLevel);
        
        // Add user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: reply.text,
          timestamp: new Date()
        };
        
        // Create assistant response with recommendation options
        const recommendationOptionsMessage: ChatMessage = {
          role: 'assistant',
          content: "Great! Based on your goals, experience level, and workout preferences, I can help you find the perfect program. What would you like to do next?",
          timestamp: new Date(),
          response: {
            message: "Great! Based on your goals, experience level, and workout preferences, I can help you find the perfect program. What would you like to do next?",
            type: 'text',
            quick_replies: [
              { text: '🎯 Get Recommendation', action: 'get_recommendation' },
              { text: '📊 View Programs', action: 'show_programs' },
              { text: '❓ Ask Questions', action: 'ask_questions' }
            ]
          }
        };
        
        // Add messages to chat
        setMessages(prev => [...prev, userMessage, recommendationOptionsMessage]);
        setQuickReplies(recommendationOptionsMessage.response?.quick_replies || []);
        
        // Advance to recommendation stage
        setConversationStage(4);
        scrollToBottom();
        setIsProcessingClick(false);
        return;
      }
      
      // Special handling for reset preferences
      if (reply.action === 'reset_preferences') {
        resetUserPreferences();
        setConversationStage(1); // Reset to stage 1
        setIsProcessingClick(false);
        return;
      }
      
      // Special handling for ask_questions action
      if (reply.action === 'ask_questions') {
        // Don't change the conversation stage, maintain current stage
        setTimeout(() => {
          const inputElement = document.querySelector('textarea');
          if (inputElement) {
            inputElement.focus();
          }
        }, 100);
        setIsProcessingClick(false);
        return;
      }
      
      // Special handling for add_to_cart action
      if (reply.action === 'add_to_cart' && reply.payload) {
        // Add the item to cart
        addItem({
          id: reply.payload.id || 'nutrition-training',
          name: reply.payload.name || 'Complete Transformation Bundle',
          price: safePriceParser(reply.payload.price || 199),
          description: reply.payload.description || 'Personalized nutrition and training program',
          billingInterval: reply.payload.billingInterval || 'month'
        });
        
        // Add user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: `I want to add ${reply.payload.name || 'Complete Transformation Bundle'} to my cart`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Show toast notification
        toast.success(`${reply.payload.name || 'Program'} added to cart!`);
        
        // Add assistant confirmation message
        const confirmationMessage: ChatMessage = {
          role: 'assistant',
          content: `I've added the ${reply.payload.name || 'Complete Transformation Bundle'} to your cart! Would you like to continue shopping or proceed to checkout?`,
          timestamp: new Date(),
          response: {
            message: `I've added the ${reply.payload.name || 'Complete Transformation Bundle'} to your cart! Would you like to continue shopping or proceed to checkout?`,
            type: 'text',
            quick_replies: [
              { text: '🛒 View Cart', action: 'view_cart', payload: { url: '/checkout' } },
              { text: '🔍 Continue Shopping', action: 'show_programs' }
            ]
          }
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        setQuickReplies(confirmationMessage.response?.quick_replies || []);
        setIsProcessingClick(false);
        scrollToBottom();
        return;
      }
      
      // Special handling for view_cart action with navigation
      if (reply.action === 'view_cart' && reply.payload?.url) {
        navigate(reply.payload.url);
        setIsOpen(false); // Close the chat widget
        setIsProcessingClick(false);
        return;
      }
      
      // Special handling for get_recommendation action
      if (reply.action === 'get_recommendation') {
        // Get current user preferences
        const userPrefs = getUserPreferences();
        const userGoal = userPrefs.goals && userPrefs.goals.length > 0 ? userPrefs.goals[0] : '';
        const userExperience = userPrefs.experienceLevel || '';
        
        // Add the user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: reply.text || 'I would like a personalized recommendation',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Show typing indicator
        setIsTyping(true);
        
        // Create personalized recommendation message
        setTimeout(async () => {
          // Prepare recommendation text based on available user preferences
          let recommendationText = "Based on what you've told me, ";
          
          if (userGoal) {
            if (userGoal === 'weight-loss') {
              recommendationText += "since your goal is to lose weight, ";
            } else if (userGoal === 'muscle-gain') {
              recommendationText += "since your goal is to build muscle, ";
            } else if (userGoal === 'nutrition') {
              recommendationText += "since you want to improve your nutrition, ";
            } else {
              recommendationText += "since you're focused on overall fitness, ";
            }
          }
          
          if (userExperience) {
            recommendationText += `and you're at an ${userExperience} experience level, `;
          }
          
          recommendationText += "I recommend our Complete Transformation Bundle. This program provides personalized nutrition coaching along with custom workout plans tailored to your specific needs and goals.";
          
          // Set user preference for interested program
          saveUserPreferences({
            ...userPrefs,
            interestedPrograms: [...(userPrefs.interestedPrograms || []), 'Complete Transformation Bundle']
          });
          
          // Get the actual program data with correct pricing
          const programs = getJMEFitPrograms();
          const recommendedProgram = programs.find(p => p.id === 'nutrition-training') || programs[1]; // Default to nutrition-training
          
          // Add assistant message with recommendation using actual program data
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: recommendationText,
            timestamp: new Date(),
            response: {
              message: recommendationText,
              type: 'recommendation',
              data: {
                id: recommendedProgram.id,
                name: recommendedProgram.name,
                price: {
                  monthly: recommendedProgram.price.monthly,
                  yearly: recommendedProgram.price.yearly
                },
                description: recommendedProgram.description,
                features: recommendedProgram.features,
                commitment: recommendedProgram.commitment,
                reasoning: `This is our most comprehensive program that addresses both nutrition and training needs for ${userGoal || 'your fitness goals'}.`
              },
              quick_replies: [
                { text: '🛒 Add to Cart', action: 'add_to_cart', payload: { 
                  id: recommendedProgram.id, 
                  name: recommendedProgram.name,
                  price: recommendedProgram.price.monthly,
                  description: recommendedProgram.description,
                  billingInterval: 'month'
                } },
                { text: '📊 Show All Programs', action: 'show_programs' },
                { text: '❓ Ask Questions', action: 'ask_questions' }
              ]
            }
          };
          
          // Set conversation stage to 5 to ensure we're in the post-recommendation stage
          setConversationStage(5);
          
          // Update messages and quick replies
          setMessages(prev => [...prev, assistantMessage]);
          setQuickReplies(assistantMessage.response?.quick_replies || []);
          setIsTyping(false);
          setIsProcessingClick(false);
          scrollToBottom();
          
          // Add to conversation history for context preservation
          addConversationToHistory(userMessage.content, recommendationText);
          
          // Optionally track this interaction for analytics
          try {
            const analyticsData = userPrefs.analyticsData || {
              visitsCount: 0,
              pagesViewed: [],
              buttons: { clicked: [], lastClicked: '' },
              programsViewed: [],
              chatInteractions: { totalMessages: 0, questionsAsked: 0, lastQuery: '' }
            };
            
            // Properly format the program view data
            const programViewData = {
              id: 'Complete Transformation Bundle',
              viewCount: 1,
              lastViewed: Date.now()
            };
            
            saveUserPreferences({
              analyticsData: {
                ...analyticsData,
                programsViewed: [...(analyticsData.programsViewed || []), programViewData]
              }
            });
          } catch (error) {
            console.error('Analytics tracking error:', error);
          }
        }, 1000);
        
        return;
      }
      
      // Add the user message
    const userMessage: ChatMessage = {
      role: 'user',
        content: reply.text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
      
      // Handle specific goal selection actions
      let response: ChatResponse | null = null;
      
      // Stage 1 - Goal selection
      if (reply.action === 'muscle_gain') {
        addUserGoal('muscle_gain');
        setConversationStage(2); // Move to qualification stage
        response = CACHED_RESPONSES.muscle_gain_qualification;
      } 
      else if (reply.action === 'weight_loss') {
        addUserGoal('weight_loss');
        setConversationStage(2);
        response = CACHED_RESPONSES.weight_loss_qualification;
      }
      else if (reply.action === 'nutrition') {
        addUserGoal('nutrition');
        setConversationStage(2);
        response = CACHED_RESPONSES.nutrition_qualification;
      }
      else if (reply.action === 'fitness') {
        addUserGoal('fitness');
        setConversationStage(2);
        response = CACHED_RESPONSES.fitness_qualification;
      }
      
      // Stage 2 - Experience level
      else if (reply.action.startsWith('experience_')) {
        setConversationStage(3);
        response = CACHED_RESPONSES.needs_assessment;
      }
      
      // Stage 3 - Workout preferences
      else if (['gym_workouts', 'home_workouts', 'no_routine', 'limited_time'].includes(reply.action)) {
        setConversationStage(4);
        // For these actions, we'll use the API for personalized recommendations
      }
      
      // Show typing indicator
    setIsTyping(true);
      
      if (response) {
        // Use cached response if available
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate typing
        
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        response: response
      };
        
        // Update conversation stage based on the message content
        updateStageFromMessageContent(response.message);
      
      setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
        setIsProcessingClick(false);
        scrollToBottom();
        return;
      }
      
      // If no cached response is available, use the API
      if (!chatSession) {
        console.error('No active chat session');
        setIsTyping(false);
        setIsProcessingClick(false);
        return;
      }
      
      // Add stage information to help guide the AI
      const messageWithStage = `${userMessage.content} [STAGE:${conversationStage}]`;
      
      // Send message to OpenAI
      const apiResponse = await sendMessage(chatSession, messageWithStage);
      
      // Add the assistant message with API response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: apiResponse ? apiResponse.message : "I'm sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
        response: apiResponse
      };
      
      // Update conversation stage based on the message content
      if (apiResponse && apiResponse.message) {
        updateStageFromMessageContent(apiResponse.message);
      }
      
      setMessages(prev => [...prev, assistantMessage]);
      setQuickReplies(apiResponse?.quick_replies || []);
      
      // Add conversation to history
      addConversationToHistory(messageWithStage, assistantMessage.content);
      
      scrollToBottom();
    } catch (error) {
      console.error('Error in handleQuickReply:', error);
    } finally {
      setIsTyping(false);
      setIsProcessingClick(false);
    }
  };
  
  // Add function to track conversation context
  const updateConversationContext = (message: string) => {
    const lowerMessage = message.toLowerCase();
    const existingContext = localStorage.getItem('jmefit-conversation-context') || '';
    
    // Keywords to track
    const keywords = [
      'macros', 'nutrition', 'weight loss', 'muscle', 'buff', 'diet',
      'workout', 'training', 'exercise', 'program', 'height', 'weight'
    ];
    
    // Check if message contains any keywords
    const matchedKeywords = keywords.filter(keyword => lowerMessage.includes(keyword));
    
    if (matchedKeywords.length > 0) {
      // Add keywords to context
      const newContext = existingContext + ' ' + matchedKeywords.join(' ');
      localStorage.setItem('jmefit-conversation-context', newContext.trim());
      console.log('Updated conversation context:', newContext);
    }
  };

  // Update the handleSubmit function to track conversation context
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Track conversation context
    updateConversationContext(inputValue);
    
    handleSendMessage(inputValue);
    setInputValue('');
  };

  // Update handleSendMessage with debounce protection, better error handling, and timeout
  const handleSendMessage = async (messageText?: string) => {
    // If already processing, don't allow new submissions
    if (isProcessingClick) {
      console.log('Ignoring submission - already processing another action');
      return;
    }
    
    // Set processing state to prevent multiple submissions
    setIsProcessingClick(true);
    
    try {
      // Get the message text from input or parameter
      const text = messageText || inputValue;
      if (!text.trim()) {
        setIsProcessingClick(false);
              return;
            }
      
      // Add user message to the chat
      const userMessage: ChatMessage = {
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Track this message in user analytics
      const preferences = getUserPreferences();
      const analyticsData = preferences.analyticsData || {
        visitsCount: 0,
        pagesViewed: [],
        buttons: { clicked: [], lastClicked: '' },
        programsViewed: [],
        chatInteractions: { totalMessages: 0, questionsAsked: 0, lastQuery: '' }
      };
      
      // Update chat interaction analytics
      const chatInteractions = analyticsData.chatInteractions || { totalMessages: 0, questionsAsked: 0, lastQuery: '' };
      chatInteractions.totalMessages += 1;
      if (text.includes('?')) {
        chatInteractions.questionsAsked += 1;
      }
      chatInteractions.lastQuery = text;
      
      saveUserPreferences({
        analyticsData: {
          ...analyticsData,
          chatInteractions
        }
      });
      
      // Clear input and show typing indicator
      setInputValue('');
      setIsTyping(true);
      scrollToBottom();
      
      try {
        // Try to get a cached response first
        const cachedResponse = findCachedResponse(text);
        
        if (cachedResponse) {
          // Simulate typing delay for better UX
          const typingDelay = Math.min(1000, text.length * 20);
          await new Promise(resolve => setTimeout(resolve, typingDelay));
          
          // Add assistant message with cached response
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: cachedResponse.message,
            timestamp: new Date(),
            response: cachedResponse
          };
          
          // Update conversation stage based on the message content
          updateStageFromMessageContent(cachedResponse.message);
          
          setMessages(prev => [...prev, assistantMessage]);
          setQuickReplies(cachedResponse.quick_replies || []);
          
          // Add to conversation history
          addConversationToHistory(text, cachedResponse.message);
        } else if (chatSession) {
          // Create a timeout for the API call
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("API request timed out")), 15000); // 15 second timeout
          });
          
          // Race between the API call and the timeout
          const apiResponse = await Promise.race([
            sendMessage(chatSession, text),
            timeoutPromise
          ]) as ChatResponse;
          
          // Handle lead capture response
          if (apiResponse && apiResponse.type === 'lead_capture') {
            handleLeadCaptureResponse(apiResponse);
          }
          
          // Add assistant message with API response
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: apiResponse ? apiResponse.message : "I'm sorry, I'm having trouble responding right now. Please try again.",
            timestamp: new Date(),
            response: apiResponse
          };
          
          // Update conversation stage based on the message content
          if (apiResponse && apiResponse.message) {
            updateStageFromMessageContent(apiResponse.message);
          }
          
          setMessages(prev => [...prev, assistantMessage]);
          setQuickReplies(apiResponse?.quick_replies || []);
          
          // Add conversation to history
          addConversationToHistory(text, assistantMessage.content);
        } else {
          // No chat session, show error
          const errorMessage: ChatMessage = {
          role: 'assistant',
            content: "I'm sorry, but I'm having trouble with my connection. Let me show you our programs instead.",
          timestamp: new Date(),
          response: {
              message: "I'm sorry, but I'm having trouble with my connection. Let me show you our programs instead.",
              type: 'program_list',
              data: {
                programs: getJMEFitPrograms()
              },
            quick_replies: [
                { text: '📊 Compare Features', action: 'compare_features' },
                { text: '🎯 Get Recommendation', action: 'get_recommendation' },
                { text: '❓ Ask Questions', action: 'ask_questions' }
              ]
            }
          };
          
          setMessages(prev => [...prev, errorMessage]);
          setQuickReplies(errorMessage.response?.quick_replies || []);
          
          // Add to conversation history
          addConversationToHistory(text, errorMessage.content);
        }
      } catch (error) {
        console.error('Error in handleSendMessage:', error);
        
        // Determine if it's a timeout error or another type
        const errorMessage = error instanceof Error && error.message === "API request timed out"
          ? "I'm sorry, but it's taking longer than expected to respond. Let me show you our programs instead."
          : "I apologize, but I'm having trouble processing your request right now. Let me show you our programs instead.";
        
        // Show fallback response on error
        const fallbackMessage: ChatMessage = {
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          response: {
            message: errorMessage,
            type: 'program_list',
            data: {
              programs: getJMEFitPrograms()
            },
            quick_replies: [
              { text: '📊 Compare Features', action: 'compare_features' },
              { text: '🎯 Get Recommendation', action: 'get_recommendation' },
              { text: '❓ Ask Questions', action: 'ask_questions' }
            ]
          }
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
        setQuickReplies(fallbackMessage.response?.quick_replies || []);
        
        // Add to conversation history
        addConversationToHistory(text, fallbackMessage.content);
      } finally {
        // Always hide typing indicator and scroll to bottom
        setIsTyping(false);
        scrollToBottom();
      }
    } catch (outerError) {
      // Handle any errors in the outer try block
      console.error('Fatal error in handleSendMessage:', outerError);
      setIsTyping(false);
    } finally {
      // Always reset processing state
      setIsProcessingClick(false);
    }
  };

  // Improved safe price parser to handle different price formats
  const safePriceParser = (priceStr: string | number | undefined | null): number => {
    // Return 0 for undefined/null values
    if (priceStr === undefined || priceStr === null) return 0;
    
    // If it's already a number, just return it
    if (typeof priceStr === 'number') return priceStr;
    
    try {
      // Handle string values with currency symbols, commas, etc.
      const cleanedPrice = priceStr.toString().replace(/[^0-9.]/g, '');
      return parseFloat(cleanedPrice) || 0;
    } catch (e) {
      console.error('Error parsing price:', e);
      return 0;
    }
  };

  const renderProgramList = (response: ChatResponse) => {
    if (!response || !response.data) return null;
    
    // Ensure we only display each program once by filtering based on ID
    const uniquePrograms = response.data.programs 
      ? [...new Map(response.data.programs.map((program: any) => [program.id, program])).values()]
      : [];

    if (!uniquePrograms.length) return null;

    return (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {uniquePrograms.map((program: any, index: number) => {
            // Safely convert price to number before formatting
            const priceMonthly = typeof program.price?.monthly === 'string' ? 
              parseFloat(program.price.monthly) : (program.price?.monthly || 0);
            
            const priceOneTime = typeof program.price?.oneTime === 'string' ? 
              parseFloat(program.price.oneTime) : (program.price?.oneTime || 0);
            
            const displayPrice = priceMonthly || priceOneTime;
            
            return (
              <div 
                key={index} 
                className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${program.popular ? 'border-jme-purple/30 bg-gradient-to-br from-white to-jme-purple/5' : 'border-gray-200'}`}
              >
              {program.popular && (
                  <div className="bg-gradient-to-r from-jme-purple to-jme-cyan text-white text-xs font-bold py-1 px-3 text-center">
                    MOST POPULAR
                  </div>
                )}
                <div className="p-3">
                  <h4 className="font-bold">{program.name}</h4>
                  <div className="text-lg font-bold text-jme-purple my-1">
                    ${displayPrice.toFixed(2)}
            </div>
                  <p className="text-xs text-gray-600 mb-2">{program.description}</p>
            
                  {program.features && program.features.length > 0 && (
                    <ul className="text-xs space-y-1 mb-3">
              {program.features.slice(0, 3).map((feature: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-jme-cyan flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (program.id) {
                          handleQuickReply({
                            text: `Tell me about ${program.name}`,
                            action: program.id
                          });
                        }
                      }}
                      className="flex-1 py-1.5 px-2 bg-jme-purple text-white text-xs rounded-md hover:bg-jme-purple/90 transition-colors flex items-center justify-center gap-1"
                    >
                      <Info className="h-3 w-3" />
                      <span>Details</span>
                    </button>
              <button
                onClick={() => handleAction({
                  type: 'add_to_cart',
                  data: {
                          id: program.id,
                          name: program.name,
                          price: safePriceParser(program.price?.monthly || program.price?.oneTime),
                          description: program.description,
                          billingInterval: program.price?.monthly ? 'month' : 'one-time'
                        }
                      })}
                      className="flex-1 py-1.5 px-2 bg-gradient-to-r from-jme-purple to-jme-cyan text-white text-xs rounded-md hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span>Add to Cart</span>
              </button>
            </div>
          </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderNutritionGuide = (response: ChatResponse) => {
    if (!response || !response.data) return null;
    
    return (
          <div className="mt-3 space-y-4">
            {response.data.tips && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">🥗 Nutrition Tips</h4>
            <ul className="space-y-2">
              {response.data.tips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
              </div>
            )}
            
            {response.data.programs && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">💪 Related Programs</h4>
            <ul className="space-y-2">
              {response.data.programs.map((program: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>{program}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderRecommendation = (response: ChatResponse) => {
    if (!response || !response.data) return null;
    
    const program = response.data;
    const features = program.features || [];
    
    // More robust handling of price values
    let monthlyPrice = 0;
    let yearlyPrice = 0;
    
    // Convert price values to numbers safely
    if (program.price?.monthly) {
      monthlyPrice = typeof program.price.monthly === 'string' 
        ? parseFloat(program.price.monthly.replace(/[^0-9.]/g, '')) 
        : Number(program.price.monthly);
    }
    
    if (program.price?.yearly) {
      yearlyPrice = typeof program.price.yearly === 'string'
        ? parseFloat(program.price.yearly.replace(/[^0-9.]/g, ''))
        : Number(program.price.yearly);
    }
    
    // Calculate yearly savings properly
    const showSavings = monthlyPrice > 0 && yearlyPrice > 0;
    const yearlySavings = showSavings ? ((monthlyPrice * 12) - yearlyPrice) : 0;
    const savingsPercent = showSavings && monthlyPrice > 0 
      ? Math.round((yearlySavings / (monthlyPrice * 12)) * 100) 
      : 0;
    
    // Format the yearly savings with exactly 2 decimal places
    const formattedYearlySavings = yearlySavings.toFixed(2);
    
    // Ensure one-time price is also properly converted
    const oneTimePrice = typeof program?.price?.oneTime === 'string'
      ? parseFloat(program.price.oneTime.replace(/[^0-9.]/g, ''))
      : (program?.price?.oneTime || 0);
    
    // Determine which price to display
    const displayPrice = monthlyPrice || oneTimePrice;
    
    // Check if we have a personalized reasoning, and if not, provide a default
    const personalizedReasoning = program.reasoning || 
      "This program matches your fitness goals and preferences based on what you've shared with me. It's designed to provide the structure and support you need for consistent progress.";
      
    return (
      <div className="mt-3 p-4 bg-gradient-to-br from-jme-purple/10 to-jme-cyan/10 rounded-lg border border-jme-purple/20">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-jme-purple mb-1 text-lg">
              ✨ Recommended: {program?.name}
            </h4>
            <div className="font-bold text-xl text-jme-purple">${displayPrice.toFixed(2)}</div>
            {program?.price?.monthly && (
              <div className="text-sm text-gray-600">per month</div>
            )}
            {showSavings && (
              <div className="text-xs text-green-600 font-medium mt-1">
                Save ${formattedYearlySavings} ({savingsPercent}%) with yearly billing
                              </div>
                            )}
                          </div>
          <div className="bg-jme-purple/10 px-2 py-1 rounded text-xs font-medium text-jme-purple">
            {program?.commitment || 'Monthly subscription'}
          </div>
        </div>
        
        <p className="text-sm text-gray-700 mb-3">{program?.description}</p>
        
        <div className="mb-4">
          <div className="text-sm font-medium text-jme-purple mb-2">What's included:</div>
          <ul className="space-y-1.5">
            {features.slice(0, 4).map((feature: string, idx: number) => (
              <li key={idx} className="flex items-start gap-1.5 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          {features.length > 4 && (
            <div className="text-xs text-jme-purple/80 mt-1 cursor-pointer hover:underline" 
                 onClick={() => alert('Full feature list: \n\n' + features.join('\n'))}>
              + {features.length - 4} more features
            </div>
          )}
        </div>
        
        <div className="bg-white/50 p-2 rounded-lg mb-3 text-sm">
          <div className="font-medium text-jme-purple mb-1">Why this is perfect for you:</div>
          <p className="text-gray-700">{personalizedReasoning}</p>
        </div>
        
        <div className="flex gap-2">
                            <button
                              onClick={() => handleAction({
                                type: 'add_to_cart',
                                data: {
                id: program?.id,
                name: program?.name,
                price: safePriceParser(program?.price?.monthly || program?.price?.oneTime),
                description: program?.description || program?.name,
                billingInterval: program?.price?.monthly ? 'month' : 'one-time'
              }
            })}
            className="flex-1 bg-gradient-to-r from-jme-purple to-jme-cyan text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
                            </button>
          <button
            onClick={() => {
              if (program?.id) {
                handleQuickReply({
                  text: `Tell me more about ${program.name}`,
                  action: program.id
                });
              }
            }}
            className="px-4 py-2.5 border border-jme-purple/30 text-jme-purple rounded-lg text-sm font-medium hover:bg-jme-purple/5 transition-colors"
          >
            More Details
          </button>
                        </div>
                      </div>
                    );
  };
  
  // Render rich content for timeline and phases
  const renderTimeline = (response: ChatResponse) => {
    if (!response || !response.data || !response.data.phases) return null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 my-2">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Results Timeline</h3>
        <div className="space-y-3">
          {response.data.phases.map((phase: any, index: number) => (
            <div key={index} className="border-l-2 border-jme-purple pl-3 py-1">
              <p className="font-semibold text-jme-purple">{phase.title}</p>
              <p className="text-sm text-gray-700">{phase.description}</p>
                </div>
          ))}
              </div>
          </div>
    );
  };
  
  // Render success stories testimonials
  const renderSuccessStories = (response: ChatResponse) => {
    if (!response || !response.data || !response.data.testimonials) return null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 my-2">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Success Stories</h3>
        <div className="space-y-4">
          {response.data.testimonials.map((story: any, index: number) => (
            <div key={index} className="border-l-4 border-jme-cyan pl-3 py-1">
              <div className="flex justify-between items-start">
                <p className="font-semibold">{story.name}</p>
                <span className="text-xs bg-jme-purple text-white px-2 py-1 rounded">{story.program}</span>
              </div>
              <p className="text-sm font-medium text-jme-cyan">{story.results}</p>
              <p className="text-sm text-gray-700 italic">"{story.quote}"</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render workout examples
  const renderWorkoutExample = (response: ChatResponse) => {
    if (!response || !response.data || !response.data.workout) return null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 my-2">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{response.data.workout.title}</h3>
        <div className="space-y-1">
          {response.data.workout.exercises.map((exercise: string, index: number) => (
            <p key={index} className="text-sm">{exercise}</p>
          ))}
        </div>
        {response.data.workout.notes && (
          <p className="text-xs text-gray-500 italic mt-2">{response.data.workout.notes}</p>
        )}
      </div>
    );
  };
  
  // Render nutrition examples with macros
  const renderNutritionExample = (response: ChatResponse) => {
    if (!response || !response.data || !response.data.macros) return null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 my-2">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{response.data.macros.title}</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {response.data.macros.values.map((value: string, index: number) => (
            <div key={index} className={`p-2 rounded ${index === 3 ? 'col-span-2 bg-gray-100 font-semibold' : 'bg-gray-50'}`}>
              <p className="text-sm">{value}</p>
            </div>
          ))}
          </div>
        
        {response.data.mealExample && (
          <>
            <h4 className="font-medium text-jme-purple mt-3 mb-2">{response.data.mealExample.title}</h4>
            <div className="space-y-1">
              {response.data.mealExample.meals.map((meal: string, index: number) => (
                <p key={index} className="text-sm">{meal}</p>
              ))}
            </div>
          </>
        )}
        
        {response.data.macros.note && (
          <p className="text-xs text-gray-500 italic mt-2">{response.data.macros.note}</p>
        )}
      </div>
    );
  };
  
  // Render FAQ sections
  const renderFAQ = (response: ChatResponse) => {
    if (!response || !response.data || !response.data.questions) return null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 my-2">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {response.data.questions.map((faq: any, index: number) => (
            <div key={index} className="border-b border-gray-100 pb-2">
              <p className="font-semibold text-jme-purple">{faq.question}</p>
              <p className="text-sm text-gray-700">{faq.answer}</p>
            </div>
            ))}
          </div>
      </div>
    );
  };
  
  // Render program details
  const renderProgramDetails = (response: ChatResponse) => {
    if (!response?.data?.program) return null;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-3 my-2">
        <h3 className="text-lg font-medium text-gray-900 mb-1">{response.data.program.name}</h3>
        <p className="text-sm text-gray-700 mb-3">{response.data.program.description}</p>
        
        <h4 className="font-medium text-jme-purple mb-2">Key Features:</h4>
        <ul className="list-disc list-inside space-y-1 mb-3">
          {response.data.program.highlights.map((highlight: string, index: number) => (
            <li key={index} className="text-sm">{highlight}</li>
          ))}
        </ul>
        
        {response.data.program.timeline && (
          <p className="text-sm bg-gray-50 p-2 rounded italic">{response.data.program.timeline}</p>
        )}
      </div>
    );
  };
  
  // Format messages to properly render HTML content
  const formatMessage = (content: string): string => {
    if (!content) return '';
    
    // Remove duplicated text patterns (common in AI responses)
    let deduplicatedContent = content;
    // First pass - exact duplications with some words in between
    deduplicatedContent = deduplicatedContent.replace(/(\b[\w\s.,!?;:'"\-]{15,}?\b)(?:(?:[\s\w.,!?;:'"\-]{1,10})\1)+/g, '$1');
    // Second pass - near-exact duplications (with minor differences)
    deduplicatedContent = deduplicatedContent.replace(/([.!?]\s+)\1+/g, '$1');
    
    // Process HTML entities first
    let formatted = deduplicatedContent.replace(/&nbsp;/g, ' ');
    
    // Fix <span> tags to ensure they render properly
    formatted = formatted.replace(/<span class="([^"]+)">(.*?)<\/span>/g, (match, className, content) => {
      return `<span class="${className}">${content}</span>`;
    });
    
    // Replace markdown-style bold with HTML
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace markdown-style italic with HTML
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace markdown-style links with HTML
    formatted = formatted.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-jme-purple underline">$1</a>');
    
    // Replace line breaks with HTML breaks for proper formatting
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Add some whitespace after punctuation for readability
    formatted = formatted.replace(/([.!?])\s/g, '$1&nbsp; ');
    
    // Auto-detect URLs and convert to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-jme-purple underline">$1</a>');
    
    // Highlight important terms
    const terms = ['JMEFit', 'protein', 'nutrition', 'workout', 'fitness', 'program'];
    terms.forEach(term => {
      const regex = new RegExp(`(?<![a-zA-Z])(${term})(?![a-zA-Z])`, 'gi');
      formatted = formatted.replace(regex, '<span class="font-medium text-jme-purple">$1</span>');
    });
    
    return formatted;
  };

  // Message component with proper HTML rendering
  const Message = ({ message }: { message: ChatMessage }) => (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`p-3 rounded-lg max-w-[85%] ${
          message.role === 'user'
            ? 'bg-jme-purple text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 rounded-tl-none'
        }`}
      >
        {renderMessageContent(message)}
      </div>
    </div>
  );

  // Enhanced message content renderer with support for all response types
  const renderMessageContent = (message: ChatMessage) => {
    // If no response object, just show the text content
    if (!message.response) {
      return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}></div>;
    }
    
    // Handle different response types
    switch (message.response.type) {
      case 'program_list':
        return renderProgramList(message.response);
      case 'nutrition_guide':
        return renderNutritionGuide(message.response);
      case 'recommendation':
        return renderRecommendation(message.response);
      case 'lead_capture':
  return (
          <>
            <div className="whitespace-pre-wrap mb-2" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}></div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <Info size={18} className="inline-block mr-1 text-jme-purple" /> 
              <span className="text-sm italic text-gray-700">
                {message.response?.data?.reason || "We'll use this to send you personalized information"}
              </span>
            </div>
          </>
        );
      case 'text':
        // Default text response first (most common case)
        return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}></div>;
      
      default:
        return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}></div>;
    }
  };
  
  // Handle action from recommendation
  const handleAction = (action: any) => {
    if (action.type === 'add_to_cart' && action.data) {
      addItem({
        id: action.data.id || 'unknown',
        name: action.data.name,
        price: safePriceParser(action.data.price),
        description: action.data.description || action.data.name,
        billingInterval: action.data.billingInterval
      });
      toast.success(`${action.data.name} added to cart!`);
    } else if (action.type === 'navigate' && action.data?.url) {
      navigate(action.data.url);
    }
  };

  // Add dynamic quick reply buttons based on conversation stage
  const getStageButtons = (): QuickReply[] => {
    // Stage 1 - Welcome & Engagement (fitness goals)
    if (conversationStage === 1) {
      return [
        { text: '🔥 Lose fat & get lean', action: 'goal_weight_loss' },
        { text: '💪 Build muscle', action: 'goal_muscle_gain' },
        { text: '🥗 Improve nutrition', action: 'goal_nutrition' },
        { text: '🏃 Overall fitness', action: 'goal_general_fitness' }
      ];
    }
    
    // Stage 2 - Qualification (experience level)
    if (conversationStage === 2) {
      return [
        { text: '🔰 Beginner (0-1 years)', action: 'experience_beginner' },
        { text: '🔄 Intermediate (1-3 years)', action: 'experience_intermediate' },
        { text: '⭐ Advanced (3+ years)', action: 'experience_advanced' }
      ];
    }
    
    // Stage 3 - Needs Assessment (workout preferences)
    if (conversationStage === 3) {
      return [
        { text: '🏋️ Gym Workouts', action: 'location_gym' },
        { text: '🏠 Home Workouts', action: 'location_home' },
        { text: '🔄 Both Options', action: 'location_both' }
      ];
    }
    
    // Stage 4 - Recommendation Options
    if (conversationStage === 4) {
      return [
        { text: '🎯 Get Recommendation', action: 'get_recommendation' },
        { text: '📊 View Programs', action: 'show_programs' },
        { text: '❓ Ask Questions', action: 'ask_questions' }
      ];
    }
    
    // Stage 5 - Post-Recommendation (user has received a recommendation)
    if (conversationStage === 5) {
      return [
        { text: '🛒 Add to Cart', action: 'add_to_cart', payload: { id: 'nutrition-training', name: 'Complete Transformation Bundle' } },
        { text: '📊 Show All Programs', action: 'show_programs' },
        { text: '❓ Ask a Different Question', action: 'ask_questions' }
      ];
    }
    
    // Default buttons (for later stages or fallback)
    return [
      { text: '📊 View Programs', action: 'show_programs' },
      { text: '🎯 Get Recommendation', action: 'get_recommendation' },
      { text: '❓ Ask Questions', action: 'ask_questions' }
    ];
  };

  // New function to update conversation stage based on message content
  const updateStageFromMessageContent = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Goal selection messages (Stage 1)
    if ((lowerMessage.includes("what's your main fitness goal") || 
         lowerMessage.includes("what are you looking to achieve") ||
         lowerMessage.includes("what's your goal") ||
         lowerMessage.includes("what are your fitness goals")) &&
        !lowerMessage.includes("experience")) {
      setConversationStage(1);
      return;
    }
    
    // Experience level messages (Stage 2)
    if ((lowerMessage.includes("how experienced") || 
         lowerMessage.includes("how long have you") ||
         lowerMessage.includes("what's your experience") ||
         lowerMessage.includes("beginner") && lowerMessage.includes("advanced")) &&
        !lowerMessage.includes("workout") && !lowerMessage.includes("equipment")) {
      setConversationStage(2);
      return;
    }
    
    // Workout preferences messages (Stage 3)
    if ((lowerMessage.includes("gym") || 
         lowerMessage.includes("workout") || 
         lowerMessage.includes("home workout") ||
         lowerMessage.includes("equipment")) &&
        (lowerMessage.includes("access") || 
         lowerMessage.includes("prefer") || 
         lowerMessage.includes("routine") || 
         lowerMessage.includes("available"))) {
      setConversationStage(3);
      return;
    }
    
    // Program recommendation messages (Stage 4+)
    if (lowerMessage.includes("recommend") || 
        lowerMessage.includes("perfect for you") || 
        lowerMessage.includes("program") || 
        lowerMessage.includes("plan")) {
      // Only advance stage, never go back
      if (conversationStage < 4) {
        setConversationStage(4);
      }
      return;
    }
  };

  return (
    <>
      {/* Chat Widget - Desktop: Sticky at footer with fullscreen option, Mobile: Full screen */}
      {isOpen && (
        <div 
          className={`fixed z-[100] ${
            // Mobile: Full screen from top
            'inset-0 top-[60px] sm:inset-auto ' +
            // Desktop: Sticky at bottom with conditional fullscreen
            (isFullscreen 
              ? 'sm:inset-0 sm:top-0' // Fullscreen on desktop
              : 'sm:bottom-0 sm:right-0'  // Sticky at footer on desktop
            )
          } w-full bg-white shadow-2xl flex flex-col overflow-hidden border-t sm:border border-gray-200`}
          style={{  
            // Height calculation based on device and fullscreen state
            ...(window.innerWidth >= 640 ? (isFullscreen ? {
              // Desktop Fullscreen: Full height and 60% width on right side
              height: '100vh',
              maxHeight: '100vh',
              width: '60%',
              maxWidth: '60%',
              borderRadius: '0'
            } : {
              // Desktop Normal: Bigger chat area, sticky at footer
              height: '70vh',
              maxHeight: '70vh',
              width: '480px',
              maxWidth: '480px',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem'
            }) : {
              // Mobile: Full height minus header
              height: 'calc(var(--vh, 1vh) * 100 - 60px)',
              maxHeight: 'calc(var(--vh, 1vh) * 100 - 60px)',
            })
          }}
        >
          {/* Header with fullscreen toggle */}
          <div className="bg-gradient-to-r from-jme-purple to-jme-cyan p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">JMEFit Assistant</h3>
                <p className="text-white/80 text-sm">Your fitness journey, simplified</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Fullscreen toggle button (desktop only) */}
              <button 
                onClick={handleToggleFullscreen}
                className="hidden sm:flex text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                )}
              </button>
              <button 
                onClick={handleToggleChat}
                className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Onboarding Progress Bar for First-Time Users */}
          {isFirstSession && messages.length <= 5 && (
            <div className="bg-white px-4 py-2 border-b border-gray-200">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <span>Getting to know you</span>
                <span>{Math.min(Math.floor((messages.length / 5) * 100), 100)}% complete</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-jme-purple to-jme-cyan h-full rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(Math.floor((messages.length / 5) * 100), 100)}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Messages Area with improved space for larger chat */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
            style={{ 
              overflowX: 'hidden', 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch', // Safari smooth scrolling
              transform: 'translateZ(0)', // Force GPU acceleration for smoother scrolling
              paddingBottom: isFullscreen ? '140px' : '120px' // More padding for fullscreen
            }}
          >
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}
            
            {/* Lead Capture Form */}
            {showLeadCapture && (
              <div className="flex justify-center">
                <LeadCaptureForm
                  type={leadCaptureType}
                  reason={leadCaptureReason}
                  onSubmit={handleLeadSubmit}
                  onCancel={() => {
                    setShowLeadCapture(false);
                    handleQuickReply({ text: "I'd prefer not to share my contact info", action: "decline_share" });
                  }}
                />
                  </div>
            )}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg rounded-tl-none p-3 shadow-sm">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Sparkles size={14} className="text-jme-cyan mr-1.5" />
                      <span className="text-xs font-medium text-jme-cyan">JMEFit Assistant</span>
                    </div>
                    <div className="flex space-x-1.5 py-1">
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-jme-purple to-jme-cyan rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-jme-purple to-jme-cyan rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2.5 h-2.5 bg-gradient-to-r from-jme-purple to-jme-cyan rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Bottom quick reply buttons - now above the input area */}
          <div className="p-2 flex flex-wrap gap-2 border-t border-gray-100 bg-white">
            {getStageButtons().map((button, index) => (
                  <button
                    key={index}
                onClick={() => handleQuickReply(button)}
                className="flex-1 min-w-[45%] bg-jme-purple text-white rounded-full py-2 px-3 text-sm font-medium hover:bg-jme-purple/90 transition-colors"
                disabled={isProcessingClick}
                  >
                {button.text}
                  </button>
                ))}
              </div>
          
          {/* Input Area - sticky at bottom */}
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 left-0 right-0 shadow-md w-full" style={{ maxWidth: '100%', boxSizing: 'border-box', paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1 w-full">
                <textarea
                  ref={inputRef}
                value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    // Reset height to recalculate
                    e.target.style.height = 'auto';
                    const newHeight = Math.min(e.target.scrollHeight, 120); // Max height of 120px
                    e.target.style.height = `${newHeight}px`;
                  }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                      handleSubmit(e);
                  }
                }}
                placeholder="Ask about programs, nutrition, or fitness..."
                  className="w-full p-3 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent text-sm appearance-none resize-none overflow-hidden"
                  style={{ 
                    fontSize: '16px', // Prevent Safari from zooming in
                    minHeight: '44px',
                    maxHeight: '120px',
                    lineHeight: '1.4'
                  }}
                  disabled={isTyping || showLeadCapture || isProcessingClick}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  rows={1}
                />
                {inputValue && (
              <button
                    type="button"
                    onClick={() => setInputValue('')}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <X size={16} />
              </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping || showLeadCapture || isProcessingClick}
                className={`rounded-full p-3.5 transition-all flex items-center justify-center shadow-md ${
                  isProcessingClick || !inputValue.trim()
                    ? 'bg-gray-300 text-gray-500' 
                    : 'bg-gradient-to-r from-jme-purple to-jme-cyan text-white hover:opacity-90'
                }`}
                aria-label="Send message"
              >
                {isProcessingClick ? (
                  // Loading spinner
                  <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </form>
            
            {/* Powered by footer */}
            <div className="mt-2 text-center text-xs text-gray-400">
              Powered by JMEFit AI
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Toggle Button - Desktop version (visible on larger screens) */}
      {!isOpen && (
      <button
        onClick={handleToggleChat}
          className="fixed z-[100] bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-jme-purple to-jme-cyan text-white rounded-full shadow-lg hover:shadow-xl transition-shadow items-center justify-center hidden sm:flex"
        aria-label="Open JMEFit Assistant"
      >
            <MessageSquare size={24} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}
      
      {/* Mobile Sticky Footer Chat Button (visible on small screens) */}
      {!isOpen && (
        <button
          onClick={handleToggleChat}
          className="fixed sm:hidden z-[100] bottom-0 left-0 right-0 p-3 bg-gradient-to-r from-jme-purple to-jme-cyan text-white shadow-lg w-full flex items-center justify-center gap-2 transition-all duration-300"
          aria-label="Open chat"
          style={{ height: '56px', paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}
        >
          <MessageSquare size={24} />
          <span className="font-medium">Chat with JMEFit Assistant</span>
      </button>
      )}
    </>
  );
};

export default OpenAIChatWidget; 