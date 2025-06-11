import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, ChevronDown, X, ShoppingCart, ExternalLink, CheckCircle2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cart';
import { useAuth } from '../../contexts/AuthContext';
import { createChatSession, sendMessage, getJMEFitPrograms, type ChatResponse, type ChatSession, CACHED_RESPONSES, extractGoals, extractExperienceLevel } from '../../lib/openai-chatbot';
import { toast } from 'react-hot-toast';
import LeadCaptureForm from './LeadCaptureForm';
import { saveLeadInfo, extractInterests, extractProgramInterest, getConversationContext } from '../../lib/lead-capture';
import {
  getUserPreferences,
  saveUserPreferences,
  addUserGoal,
  addViewedProgram,
  addInterestedProgram,
  setExperienceLevel,
  addConversationToHistory,
  saveUserPersonalInfo,
  getPersonalizedRecommendations
} from '../../lib/user-preferences';

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
 * - Program recommendations with add-to-cart functionality
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
  
  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState<boolean>(false);
  const [leadCaptureType, setLeadCaptureType] = useState<'email' | 'phone'>('email');
  const [leadCaptureReason, setLeadCaptureReason] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // First session state
  const [isFirstSession, setIsFirstSession] = useState<boolean>(false);
  
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
    
    // Create personalized welcome message
    let welcomeContent = "Hey there! 👋 ";
    
    if (hasInteractedBefore && personalInfo?.name) {
      // Returning user with name
      welcomeContent = `Welcome back, ${personalInfo.name}! 👋 `;
      
      // Add personalized recommendations if we have preference data
      if ((preferences.goals && preferences.goals.length > 0) || 
          (preferences.interestedPrograms && preferences.interestedPrograms.length > 0)) {
        welcomeContent += "Great to see you again! Based on our previous conversation, I think you might be interested in:";
      } else {
        welcomeContent += "How can I help you today?";
      }
    } else if (hasInteractedBefore) {
      // Returning user without name
      welcomeContent += "Welcome back! 👋 How can I help you today?";
    } else {
      // New user
      welcomeContent += "I'm Jaime's AI assistant and I'm here to help you find the perfect fitness program for your goals. What are you mainly looking to achieve?";
    }
    
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: welcomeContent,
      timestamp: new Date(),
      response: {
        message: welcomeContent,
        type: 'text',
        quick_replies: hasInteractedBefore ? [
          { text: '📊 Show all programs', action: 'show_programs' },
          { text: '💪 Continue where we left off', action: 'get_recommendation' },
          { text: '🔄 Start fresh', action: 'reset_preferences' }
        ] : [
          { text: '🔥 Lose fat & weight', action: 'goal_weight_loss' },
          { text: '💪 Build muscle', action: 'goal_muscle_gain' },
          { text: '🥗 Improve nutrition', action: 'nutrition_guide' },
          { text: '🏃‍♀️ General fitness', action: 'goal_general_fitness' }
        ]
      }
    };
    
    // Add personalized recommendations for returning users
    if (hasInteractedBefore && 
       ((preferences.goals && preferences.goals.length > 0) || 
        (preferences.interestedPrograms && preferences.interestedPrograms.length > 0))) {
      // Get recommendations based on user preferences
      const recommendedPrograms = getPersonalizedRecommendations();
      
      if (recommendedPrograms.length > 0) {
        // Find the programs data for these recommendations
        const programs = getJMEFitPrograms().filter(p => 
          recommendedPrograms.includes(p.id)
        );
        
        if (programs.length > 0) {
          welcomeMessage.response = {
            message: welcomeContent,
            type: 'program_list',
            data: {
              programs: programs
            },
            quick_replies: [
              { text: '🎯 Get new recommendation', action: 'get_recommendation' },
              { text: '📊 View all programs', action: 'show_programs' },
              { text: '💬 I have questions', action: 'ask_questions' }
            ]
          };
        }
      }
    }
    
    setMessages([welcomeMessage]);
    setQuickReplies(welcomeMessage.response?.quick_replies || []);
    
    // Track if this is first session to show welcome again when chat is reopened
    setIsFirstSession(true);
  }, []);
  
  // Handle chat reopening - show welcome message again if closed
  useEffect(() => {
    if (isOpen && isFirstSession && messages.length <= 1) {
      // If chat is opened and we only have the welcome message or less
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: "Hey there! 👋 I'm Jaime's AI assistant and I'm here to help you find the perfect fitness program for your goals. What are you mainly looking to achieve?",
        timestamp: new Date(),
        response: {
          message: "Hey there! 👋 I'm Jaime's AI assistant and I'm here to help you find the perfect fitness program for your goals. What are you mainly looking to achieve?",
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
    }
  }, [isOpen, isFirstSession, messages.length]);
  
  // Handle lead capture responses
  const handleLeadCaptureResponse = (response: ChatResponse) => {
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
  
  // Handle user selecting a goal through quick replies
  const handleGoalSelection = (goal: string) => {
    switch (goal) {
      case 'goal_weight_loss':
        addUserGoal('weight_loss');
        break;
      case 'goal_muscle_gain':
        addUserGoal('muscle_gain');
        break;
      case 'goal_general_fitness':
        addUserGoal('general_fitness');
        break;
      case 'nutrition_guide':
        addUserGoal('nutrition');
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
  
  const handleQuickReply = async (reply: QuickReply) => {
    // Prevent multiple rapid clicks
    if (isProcessingClick) {
      console.log('Ignoring click - already processing another action');
      return;
    }
    
    setIsProcessingClick(true);
    
    try {
      // Special handling for reset preferences
      if (reply.action === 'reset_preferences') {
        resetUserPreferences();
        setIsProcessingClick(false);
        return;
      }
      
      // Handle goal selection and tracking
      handleGoalSelection(reply.action);
      
      // If lead capture actions, show the appropriate form
      if (reply.action === 'share_email') {
        setLeadCaptureType('email');
        setShowLeadCapture(true);
        setIsProcessingClick(false);
        return;
      } else if (reply.action === 'share_phone') {
        setLeadCaptureType('phone');
        setShowLeadCapture(true);
        setIsProcessingClick(false);
        return;
      } else if (reply.action === 'decline_share') {
        // Send a message to acknowledge the decline
        const userMessage = "I'd prefer not to share my contact info right now";
        setMessages(prev => [...prev, { role: 'user' as const, content: userMessage, timestamp: new Date() }]);
        
        // Add a preset response without API call
        const assistantMessage: ChatMessage = {
          role: 'assistant' as const, 
          content: "No problem at all! I respect your privacy. Is there anything else I can help you with about our programs?",
          timestamp: new Date(),
          response: {
            message: "No problem at all! I respect your privacy. Is there anything else I can help you with about our programs?",
            type: 'text',
            quick_replies: [
              { text: '📊 View Programs', action: 'show_programs' },
              { text: '❓ Ask Questions', action: 'ask_questions' },
              { text: '🛒 Checkout', action: 'quick_checkout' }
            ]
          }
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setQuickReplies(assistantMessage.response?.quick_replies || []);
        
        // Add conversation to history
        addConversationToHistory(userMessage, assistantMessage.content);
        
        setIsProcessingClick(false);
        return;
      }
      
      // Handle direct navigation actions
      if (reply.action === 'contact') {
        navigate('/contact');
        setIsProcessingClick(false);
        return;
      } else if (reply.action === 'quick_checkout') {
        navigate('/checkout');
        setIsProcessingClick(false);
        return;
      } else if (reply.action === 'view_cart') {
        // Just toggle the cart dropdown (handled by parent component)
        document.dispatchEvent(new CustomEvent('toggle-cart'));
        setIsProcessingClick(false);
        return;
      }
      
      // Add the user message
      const userMessage = typeof reply.text === 'string' ? reply.text : `Selected: ${reply.action}`;
      setMessages(prev => [...prev, { role: 'user' as const, content: userMessage, timestamp: new Date() }]);
      
      // Show typing indicator
      setIsTyping(true);
      
      try {
      // Check if we have a cached response for this action
        let response: ChatResponse | null = null;
      
      // Check for cached responses based on the action
      switch (reply.action) {
        case 'show_programs':
          response = CACHED_RESPONSES.show_programs;
          break;
        case 'compare_features':
          response = CACHED_RESPONSES.compare_features;
          break;
        case 'nutrition_guide':
          response = CACHED_RESPONSES.nutrition_guide;
          break;
        case 'get_recommendation':
          // If we have user preferences, use them to personalize the recommendation
          const preferences = getUserPreferences();
            if (preferences.goals && preferences.goals.length > 0) {
            // Get personalized recommendations
            const recommendedProgramIds = getPersonalizedRecommendations();
            
            if (recommendedProgramIds.length > 0) {
              const recommendedProgram = getJMEFitPrograms().find(p => p.id === recommendedProgramIds[0]);
              
              if (recommendedProgram) {
                response = {
                  message: `Based on your goals and preferences, I think the ${recommendedProgram.name} would be perfect for you! This program is tailored to help you achieve your specific fitness objectives.`,
                  type: 'recommendation',
                  data: {
                    ...recommendedProgram,
                      reasoning: `I'm recommending this program specifically based on your goals of ${preferences.goals?.join(', ')}. It's designed to give you the exact support you need for these objectives.`
                  },
                  quick_replies: [
                    { text: '🛒 Add to Cart', action: 'add_to_cart', payload: recommendedProgram },
                    { text: '🤔 Tell me more', action: recommendedProgram.id },
                    { text: '👀 Show me other options', action: 'show_programs' }
                  ]
                };
                break;
              }
            }
          }
          
          // Default to standard recommendation flow if no personalization is possible
          response = CACHED_RESPONSES.get_recommendation;
          break;
        case 'recommend_nutrition':
          const nutritionProgram = getJMEFitPrograms()[0]; // Nutrition Only
          
          // Track interest in this program
          addInterestedProgram('nutrition-only');
          
          response = {
            message: "Perfect! If nutrition is your main focus, I'd definitely recommend our Nutrition Only Program. It's exactly what you need - Jaime will personally calculate your macros and check in with you weekly to make adjustments. Most people see amazing results focusing just on nutrition first! 🎯",
            type: 'recommendation',
            data: {
              ...nutritionProgram,
              reasoning: 'This program is perfect for people who want to focus on getting their nutrition dialed in first. Many clients find that getting their food right is actually 80% of their results!'
            },
            quick_replies: [
              { text: '🛒 Add to Cart', action: 'add_to_cart', payload: nutritionProgram },
              { text: '🤔 Tell me more', action: 'nutrition_details' },
              { text: '📊 Compare all programs', action: 'compare_features' }
            ]
          };
          break;
        case 'recommend_full':
          const fullProgram = getJMEFitPrograms()[1]; // Nutrition & Training
          
          // Track interest in this program
          addInterestedProgram('nutrition-training');
          
          response = {
            message: "Excellent choice! The Nutrition & Training program is our most popular for a reason - you get everything you need for a complete transformation. Jaime handles both your nutrition AND creates custom workouts just for you. Plus you get form check videos so you know you're doing everything right! 🔥",
            type: 'recommendation',
            data: {
              ...fullProgram,
              reasoning: 'This is our most comprehensive program and gets the fastest results because you\'re optimizing both nutrition and training together.'
            },
            quick_replies: [
              { text: '🛒 Add to Cart', action: 'add_to_cart', payload: fullProgram },
              { text: '💪 What workouts are included?', action: 'workout_details' },
              { text: '📊 Compare all programs', action: 'compare_features' }
            ]
          };
          break;
        case 'recommend_training':
          const trainingProgram = getJMEFitPrograms()[2]; // Self-Led Training
          
          // Track interest in this program
          addInterestedProgram('self-led-training');
          
          response = {
            message: "Perfect! For someone who prefers to handle their own nutrition, our Self-Led Training program is an excellent choice. You'll get a full workout plan customized to your goals, equipment, and schedule. It's super affordable but still gets you amazing results! 💪",
            type: 'recommendation',
            data: {
              ...trainingProgram,
              reasoning: 'This program is ideal for self-motivated individuals who just need a proper workout structure to follow.'
            },
            quick_replies: [
              { text: '🛒 Add to Cart', action: 'add_to_cart', payload: trainingProgram },
              { text: '🤔 Tell me more', action: 'self_led_details' },
              { text: '📊 Compare all programs', action: 'compare_features' }
            ]
          };
          break;
        case 'recommend_shred':
          const shredProgram = getJMEFitPrograms()[4]; // SHRED Challenge
          
          // Track interest in this program
          addInterestedProgram('shred-challenge');
          
          response = {
            message: "The SHRED Challenge is PERFECT if you want fast results! This intensive 6-week program combines specialized workouts with a precise nutrition plan to maximize fat loss while preserving muscle. It's our most intense program but gets incredible results fast! ⚡",
            type: 'recommendation',
            data: {
              ...shredProgram,
              reasoning: 'The SHRED Challenge is our most intensive program designed for maximum results in a short timeframe.'
            },
            quick_replies: [
              { text: '🛒 Add to Cart', action: 'add_to_cart', payload: shredProgram },
              { text: '⏱️ How fast will I see results?', action: 'shred_results' },
              { text: '📊 Compare all programs', action: 'compare_features' }
            ]
          };
          break;
        case 'goal_weight_loss':
          // Track the goal
          addUserGoal('weight_loss');
          
          response = {
            message: "Weight loss is such a common goal! The good news is, with the right approach, it's totally achievable. Jaime has helped hundreds of clients lose weight sustainably through proper nutrition and training. Based on your weight loss goal, here are the best options:",
            type: 'program_list',
            data: {
              programs: getJMEFitPrograms().filter(p => 
                p.id === 'nutrition-only' || 
                p.id === 'nutrition-training' ||
                p.id === 'shred-challenge'
              )
            },
            quick_replies: [
              { text: '🔥 SHRED Challenge', action: 'recommend_shred' },
              { text: '🍽️ Just Help with Diet', action: 'recommend_nutrition' },
              { text: '💪 Complete Program', action: 'recommend_full' }
            ]
          };
          break;
        case 'goal_muscle_gain':
          // Track the goal
          addUserGoal('muscle_gain');
          
          response = {
            message: "Building muscle is an awesome goal! Jaime's specialty is helping people not just gain any weight, but quality muscle mass. The key is combining proper nutrition (especially protein intake) with progressive resistance training. Here are the best options for your goal:",
            type: 'program_list',
            data: {
              programs: getJMEFitPrograms().filter(p => 
                p.id === 'nutrition-training' || 
                p.id === 'trainer-feedback' ||
                p.id === 'self-led-training'
              )
            },
            quick_replies: [
              { text: '💪 Complete Program', action: 'recommend_full' },
              { text: '🏋️ Training Focus', action: 'recommend_training' },
              { text: '❓ More Questions', action: 'ask_questions' }
            ]
          };
          break;
        case 'goal_general_fitness':
          // Track the goal
          addUserGoal('general_fitness');
          
          response = {
            message: "Getting healthier overall is such a great goal! Jaime's approach is perfect for this because it focuses on sustainable habits that improve your fitness, energy levels, and overall wellbeing - not just quick fixes. Here are great options for general fitness:",
            type: 'program_list',
            data: {
              programs: getJMEFitPrograms()
            },
            quick_replies: [
              { text: '💪 Complete Program', action: 'recommend_full' },
              { text: '🏋️ Just Workouts', action: 'recommend_training' },
              { text: '🍽️ Just Nutrition', action: 'recommend_nutrition' }
            ]
          };
          break;
        case 'retry':
          // Retry the last user message
          const lastUserMessage = messages.filter(m => m.role === 'user').pop();
          if (lastUserMessage && chatSession) {
            response = await sendMessage(chatSession, lastUserMessage.content);
          } else {
            // Fallback if we can't retry
            response = CACHED_RESPONSES.show_programs;
          }
          break;
          case 'add_to_cart':
            if (reply.payload) {
              addItem({
                id: reply.payload.id || 'unknown',
                name: reply.payload.name,
                price: safePriceParser(reply.payload.price?.monthly || reply.payload.price?.oneTime || reply.payload.price),
                description: reply.payload.description || reply.payload.name,
                billingInterval: reply.payload.price?.monthly ? 'month' : 'one-time'
              });
              
              // Show confirmation message
              response = {
                message: `I've added ${reply.payload.name} to your cart! You can checkout when you're ready.`,
                type: 'text',
                quick_replies: [
                  { text: '🛒 View Cart', action: 'view_cart' },
                  { text: '💳 Checkout Now', action: 'quick_checkout' },
                  { text: '📊 Show More Programs', action: 'show_programs' }
                ]
              };
              
              toast.success(`${reply.payload.name} added to cart!`);
              break;
            }
            // Fall through if no payload
        default:
          // For program detail requests, track that the user viewed this program
          const allPrograms = getJMEFitPrograms();
          const requestedProgram = allPrograms.find(p => p.id === reply.action);
          
          if (requestedProgram) {
            // Track that user viewed this program
            addViewedProgram(requestedProgram.id);
          }
          
          // For any other action, use the OpenAI API
          if (chatSession) {
            response = await sendMessage(chatSession, userMessage);
          } else {
            // Fallback if no chat session
            response = {
              message: "I'm sorry, there seems to be an issue with the chat session. Let me show you our programs instead.",
              type: 'program_list',
              data: {
                programs: getJMEFitPrograms()
              },
              quick_replies: [
                { text: '📊 Compare Features', action: 'compare_features' },
                { text: '🎯 Get Recommendation', action: 'get_recommendation' },
                { text: '🛒 Checkout', action: 'quick_checkout' }
              ]
            };
          }
      }
        
        if (!response) {
          throw new Error('No response returned from action handler');
        }
      
      // Add the assistant's response to the messages
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        response: response
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Set quick replies if available
      if (response.quick_replies) {
        setQuickReplies(response.quick_replies);
      } else {
        setQuickReplies([]);
      }
      
      // Check if the response is asking for lead capture
      if (response.type === 'lead_capture') {
        handleLeadCaptureResponse(response);
      }
      
      // Store this conversation in history
      addConversationToHistory(userMessage, response.message);
      
    } catch (error) {
      console.error('Error in quick reply handler:', error);
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Can you try again or refresh the page?", 
        timestamp: new Date() 
      }]);
      
      setQuickReplies([
        { text: 'Try Again', action: 'retry' },
        { text: 'View Programs', action: 'show_programs' },
        { text: 'Contact Support', action: 'contact' }
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
        // Reset processing flag after everything is done
        setIsProcessingClick(false);
      }
    } catch (finalError) {
      console.error('Fatal error in quick reply handling:', finalError);
      setIsProcessingClick(false);
    }
  };
  
  // Update handleSendMessage to use the same debounce protection
  const handleSendMessage = async (messageText?: string) => {
    if (!messageText && !inputValue.trim()) return;
    
    // Prevent double submissions
    if (isProcessingClick) {
      console.log('Ignoring send - already processing another action');
      return;
    }
    
    setIsProcessingClick(true);
    
    const text = messageText || inputValue.trim();
    setInputValue('');
    setIsTyping(true);
    
    // Add user message to UI
    setMessages(prev => [
      ...prev, 
      { 
        role: 'user', 
        content: text, 
        timestamp: new Date() 
      }
    ]);
    
    try {
      if (!chatSession) {
        const newSession = createChatSession();
        setChatSession(newSession);
      }
      
      // Send message to OpenAI
      const response = await sendMessage(chatSession!, text);
      
      // Extract and save goals from user message
      const goals = extractGoals(text);
      if (goals.length > 0) {
        goals.forEach(goal => addUserGoal(goal));
      }
      
      // Extract and save program interests
      const programs = extractProgramInterest(text);
      if (programs.length > 0) {
        programs.forEach(program => addInterestedProgram(program));
      }
      
      // Extract experience level
      const experienceLevel = extractExperienceLevel(text);
      if (experienceLevel) {
        setExperienceLevel(experienceLevel as 'beginner' | 'intermediate' | 'advanced');
      }
      
      // Add assistant response to UI
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: response.message, 
          timestamp: new Date(),
          response
        }
      ]);
      
      // Add conversation to history
      addConversationToHistory(text, response.message);
      
      // Set quick replies if available
      if (response.quick_replies && response.quick_replies.length > 0) {
        setQuickReplies(response.quick_replies);
      } else {
        setQuickReplies([]);
      }
      
      // Check if the response is asking for lead capture
      if (response.type === 'lead_capture') {
        handleLeadCaptureResponse(response);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I'm having trouble right now. Please try again or come back later.", 
          timestamp: new Date() 
        }
      ]);
      
      setQuickReplies([
        { text: 'Try Again', action: 'retry' },
        { text: 'View Programs', action: 'show_programs' },
        { text: 'Contact Support', action: 'contact' }
      ]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
      setIsProcessingClick(false);
    }
  };

  // Function to safely parse price strings
  const safePriceParser = (priceStr: string | undefined | null): number => {
    if (!priceStr) return 0;
    // Remove any non-numeric characters except decimal point
    const numericString = priceStr.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(numericString);
    return isNaN(parsed) ? 0 : parsed;
  };

  const renderProgramList = (response: ChatResponse) => {
    const programs = response.data?.programs || [];

    if (!programs.length) return null;

    return (
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {programs.map((program: any, index: number) => (
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
                  {program.price?.monthly || program.price?.oneTime || '$0.00'}
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
          ))}
        </div>
      </div>
    );
  };
  
  const renderNutritionGuide = (response: ChatResponse) => {
    return (
      <div className="mt-3 space-y-4">
        {response.data?.tips && (
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
        
        {response.data?.programs && (
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
    const program = response.data;
    const features = program?.features || [];
    const showSavings = program?.price?.yearly && program?.price?.monthly;
    const yearlySavings = showSavings ? 
      ((Number(program?.price?.monthly) * 12) - Number(program?.price?.yearly)) : 0;
    const savingsPercent = showSavings ? 
      Math.round((yearlySavings / (Number(program?.price?.monthly) * 12)) * 100) : 0;
      
    return (
      <div className="mt-3 p-4 bg-gradient-to-br from-jme-purple/10 to-jme-cyan/10 rounded-lg border border-jme-purple/20">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-jme-purple mb-1 text-lg">
              ✨ Recommended: {program?.name}
            </h4>
            <div className="font-bold text-xl text-jme-purple">{program?.price?.monthly ? `$${program?.price?.monthly}` : program?.price || '$0.00'}</div>
            {program?.price?.monthly && (
              <div className="text-sm text-gray-600">per month</div>
            )}
            {showSavings && (
              <div className="text-xs text-green-600 font-medium mt-1">
                Save ${yearlySavings} ({savingsPercent}%) with yearly billing
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
          <p className="text-gray-700">{response.data?.reasoning}</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleAction({
              type: 'add_to_cart',
              data: {
                id: program?.id,
                name: program?.name,
                price: safePriceParser(program?.price?.monthly || program?.price),
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
  
  // Render message content with rich formatting
  const renderMessageContent = (message: ChatMessage) => {
    // If message has a structured response, render it accordingly
    if (message.response) {
      const response = message.response;
      
      switch (response.type) {
        case 'program_list':
          return renderProgramList(response);
        case 'nutrition_guide':
          return renderNutritionGuide(response);
        case 'recommendation':
          return renderRecommendation(response);
        case 'lead_capture':
          // For lead capture, we just show the message and the form is shown separately
          return (
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(response.message) }} />
          );
        case 'quick_actions':
          // Basic text for quick actions, the buttons are rendered separately
          return (
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(response.message) }} />
          );
        default:
          // Default to formatted text
          return (
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
          );
      }
    }
    
    // For simple text messages
    return (
      <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }} />
    );
  };
  
  // Format message with markdown-like syntax
  const formatMessage = (content: string): string => {
    if (!content) return '';
    
    // Remove duplicated text patterns (common in AI responses)
    let deduplicatedContent = content;
    // First pass - exact duplications with some words in between
    deduplicatedContent = deduplicatedContent.replace(/(\b[\w\s.,!?;:'"\-]{15,}?\b)(?:(?:[\s\w.,!?;:'"\-]{1,10})\1)+/g, '$1');
    // Second pass - near-exact duplications (with minor differences)
    deduplicatedContent = deduplicatedContent.replace(/([.!?]\s+)\1+/g, '$1');
    
    // Replace markdown-style bold with HTML
    let formatted = deduplicatedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
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

  return (
    <>
      {/* Chat Window - Full screen on mobile, small window on desktop */}
      {isOpen && (
        <div 
          className="fixed z-[100] inset-0 top-[60px] sm:top-auto sm:bottom-20 sm:right-6 sm:left-auto w-full sm:w-[380px] bg-white rounded-none sm:rounded-xl shadow-2xl flex flex-col overflow-hidden sm:border sm:border-gray-200 max-w-[100vw] sm:max-w-[380px] sm:max-h-[80vh]"
          style={{  
            height: 'calc(var(--vh, 1vh) * 100 - 60px)', // Full height minus header using CSS variable
            maxHeight: 'calc(var(--vh, 1vh) * 100 - 60px)',
            WebkitOverflowScrolling: 'touch' // Safari smooth scrolling
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-jme-purple to-jme-cyan p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">JMEFit Assistant</h3>
                <p className="text-white/80 text-sm">Powered by OpenAI</p>
              </div>
            </div>
            <button 
              onClick={handleToggleChat}
              className="text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Messages Area with improved mobile scrolling */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-white"
            style={{ 
              overflowX: 'hidden', 
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch', // Safari smooth scrolling
              transform: 'translateZ(0)', // Force GPU acceleration for smoother scrolling
              paddingBottom: '80px' // Extra padding to ensure messages aren't hidden behind input area
            }}
          >
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-jme-purple to-jme-cyan text-white rounded-tr-none' 
                      : 'bg-white border border-gray-200 shadow-sm rounded-tl-none'
                  }`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                >
                  {renderMessageContent(message)}
                  
                  <div className={`text-xs mt-2 opacity-60 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </div>
                </div>
              </div>
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
          
          {/* Quick Reply Buttons */}
          {quickReplies.length > 0 && !isTyping && !showLeadCapture && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-full text-sm font-medium hover:bg-gray-100 transition-colors touch-manipulation"
                  >
                    {reply.text}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Input Area - sticky at bottom */}
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 left-0 right-0 shadow-md w-full" style={{ maxWidth: '100%', boxSizing: 'border-box', paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)' }}>
            <div className="flex gap-2">
              <div className="relative flex-1 w-full">
                <textarea
                  ref={(textAreaRef) => {
                    // Auto-resize textarea as content changes
                    if (textAreaRef) {
                      textAreaRef.style.height = 'auto';
                      const newHeight = Math.min(textAreaRef.scrollHeight, 120); // Max height of 120px
                      textAreaRef.style.height = `${newHeight}px`;
                    }
                  }}
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
                      handleSendMessage();
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
                  disabled={isTyping || showLeadCapture}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  rows={1}
                />
                {inputValue && (
                  <button 
                    onClick={() => setInputValue('')}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping || showLeadCapture}
                className="bg-gradient-to-r from-jme-purple to-jme-cyan text-white rounded-full p-3.5 hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center shadow-md"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat Toggle Button - Desktop version (visible on larger screens) */}
      {!isOpen && (
        <button
          onClick={handleToggleChat}
          className="hidden sm:flex fixed z-[100] bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-jme-purple to-jme-cyan text-white rounded-full shadow-lg hover:shadow-xl transition-shadow items-center justify-center relative"
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