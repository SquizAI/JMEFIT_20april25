import React, { useState, useEffect, useRef } from 'react';
import { createChatSession, sendMessageStream, getProgramRecommendation } from '../../lib/gemini-chatbot';
import { MessageSquare, X, Send, Sparkles, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../../store/cart';
// Import the useAuth hook from the AuthContext instead
import { useAuth } from '../../contexts/AuthContext';
import { 
  saveUserPreferences, 
  getUserPreferences, 
  saveConversationContext, 
  getConversationContext,
  detectUserInterests
} from '../../lib/conversation-memory';
import {
  ProgramList,
  NutritionCard,
  SignUpInfo,
  QuickReplies
} from './RichResponses';
import { ChatbotFunctionCallUI } from './ChatbotUI';

// NEW: Import direct lead capture instead of n8n webhook
import { captureLeadDirectly, extractLeadData, type UserPreferences } from '../../lib/lead-capture';

// Lead capture function (now using direct Supabase instead of n8n)
const captureLeadDirect = async (leadData: any) => {
  try {
    console.log('🎯 Capturing lead directly to Supabase:', leadData);
    
    const result = await captureLeadDirectly(leadData);
    
    if (result.success) {
      console.log('✅ Lead captured successfully:', result.data);
      return result.data;
    } else {
      console.error('❌ Lead capture failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error capturing lead:', error);
    // Don't throw error to prevent breaking user experience
    return null;
  }
};

// ICP Scoring Algorithm (0-100 points)
const calculateICPScore = (preferences: UserPreferences, socialData?: any) => {
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
  if (socialData?.income >= 50000) {
    score += 15;
    factors.income = 15;
  } else if (socialData?.income >= 30000) {
    score += 10;
    factors.income = 10;
  } else {
    score += 5;
    factors.income = 5;
  }
  
  // Fitness Goals (0-20 points)
  if (preferences.goals === 'weight-loss') {
    score += 20;
    factors.goals = 20;
  } else if (preferences.goals === 'muscle-gain' || preferences.goals === 'overall-fitness') {
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
  
  return {
    score: Math.min(score, 100), // Cap at 100
    factors
  };
};

// Determine segment based on ICP score
const getSegment = (icpScore: number) => {
  if (icpScore >= 70) return 'hot';
  if (icpScore >= 40) return 'warm';
  return 'cold';
};

// Recommend product based on preferences
const getRecommendedProduct = (preferences: UserPreferences, segment: string) => {
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
};

// Types for chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  functionCall?: FunctionCall;
}

// Type for Gemini API conversation messages
interface ConversationMessage {
  role: 'user' | 'assistant' | 'model';
  parts: { text: string }[];
}

// Types for function calls
interface FunctionCall {
  name: string;
  args: any;
}

// Types for quick reply options are handled directly in the QuickReplies component

// Quick reply option type
interface QuickReply {
  text: string;
  action: () => void;
}

/**
 * GeminiChatbot component
 * 
 * A specialized AI chatbot powered by Google's Gemini API that focuses
 * exclusively on JMEFit-related topics, nutrition questions, and fitness guidance.
 */
const GeminiChatbot: React.FC = () => {
  // Get auth state
  const { user } = useAuth();
  
  // State for chat UI
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [showProgramRecommender, setShowProgramRecommender] = useState<boolean>(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    goals: '',
    experienceLevel: '',
    timeAvailable: '',
    budget: '',
    preferredFocus: ''
  });
  // Add type for program recommendation results
  interface ProgramRecommendation {
    program: string;
    reasoning: string;
    features: string[];
    price: string;
    [key: string]: any;
  }
  
  // Track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  
  // Quick reply options
  const [quickReplies] = useState<QuickReply[]>([
    {
      text: "Programs & Pricing",
      action: () => handleQuickReply("What programs do you offer and how much do they cost?")
    },
    {
      text: "Nutrition Advice",
      action: () => handleQuickReply("What nutrition advice do you have for building muscle?")
    },
    {
      text: "Find My Program",
      action: () => setShowProgramRecommender(true)
    },
    {
      text: "How to Start",
      action: () => handleQuickReply("How do I get started with JMEFit?")
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Helper function to scroll to bottom of chat
  const scrollToBottom = () => {
    // Force scroll to bottom with a slight delay to ensure content is rendered
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Initialize chat session and load saved conversation data
  useEffect(() => {
    const initializeChat = async () => {
      if (!chatSession && !initialDataLoaded) {
        setInitialDataLoaded(true);
        const session = createChatSession();
        setChatSession(session);
        
        // Try to load saved preferences
        try {
          const savedPreferences = getUserPreferences();
          if (savedPreferences && Object.keys(savedPreferences).length > 0) {
            setUserPreferences(savedPreferences as UserPreferences);
          }
        } catch (error) {
          console.error('Error loading saved preferences:', error);
        }
        
        // Try to load saved conversation history
        try {
          const savedContext = getConversationContext();
          if (savedContext && savedContext.length > 0) {
            // Convert the saved context to the format expected by the chat component
            const savedMessages = savedContext.map((msg: any) => ({
              role: msg.role === 'model' ? 'assistant' as const : 'user' as const,
              content: msg.parts[0].text,
              timestamp: new Date()
            }));
            
            // Convert the saved context to the format expected by the Gemini API
            const savedHistory = savedContext.map((msg: any) => ({
              role: msg.role,
              parts: msg.parts
            }));
            
            // Only use saved history if there are user messages
            if (savedMessages.some((msg: any) => msg.role === 'user')) {
              session.history = savedHistory;
              setMessages(savedMessages);
              return; // Skip welcome message if we restored history
            }
          }
        } catch (error) {
          console.error('Error loading saved conversation history:', error);
        }
        
        // Send initial welcome message if no history was restored
        setMessages([
          {
            role: 'assistant',
            content: "👋 Hi there! I'm the JMEFit Assistant. I can help with our fitness programs, nutrition advice, and answer any questions about JMEFit. What would you like to know today?",
            timestamp: new Date()
          }
        ]);
      }
    };
    
    initializeChat();
    
    // Auto-scroll when messages change
    scrollToBottom();
    
    return () => {
      // Cleanup
    };
  }, [chatSession, initialDataLoaded, user, messagesEndRef]);
  
  // Separate effect for handling input value changes
  useEffect(() => {
    if (inputValue) {
      scrollToBottom();
    }
  }, [inputValue]);
  
  // We use this directly in onClick handlers
  const handleToggleChat = () => {
    setIsOpen(prev => !prev);
    // Scroll to bottom when opening chat
    if (!isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatSession || isTyping) return;
    
    const userMessage = {
      role: 'user' as const,
      content: inputValue.trim(),
      timestamp: new Date()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input and set typing indicator
    setInputValue('');
    setIsTyping(true);
    
    // Scroll to bottom after user message is added
    scrollToBottom();
    
    // Add loading message
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant' as const,
        content: '',
        timestamp: new Date()
      }
    ]);
    
    // Track response content for saving later
    let responseContent = '';
    
    // Stream the response
    await sendMessageStream(
      chatSession,
      userMessage.content,
      (chunk: string) => {
        responseContent += chunk;
        
        // Update the assistant message with new content
        setMessages(prev => {
          const newMessages = [...prev];
          const assistantMessage = newMessages[newMessages.length - 1];
          if (assistantMessage.role === 'assistant') {
            assistantMessage.content += chunk;
          }
          return newMessages;
        });
      },
      (functionCall: FunctionCall) => {
        console.log("Function call:", functionCall);
        
        // Add the function call to the last assistant message
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          
          // Only add function call if it doesn't already exist
          if (!lastMessage.functionCall) {
            updated[updated.length - 1] = {
              ...lastMessage,
              functionCall: functionCall
            };
          }
          
          return updated;
        });
        
        // Handle the function call
        handleFunctionCall(functionCall);
      }
    );
    
    setIsTyping(false);
    
    // Scroll to bottom after assistant's response is received
    scrollToBottom();
    
    // Save conversation history to both local storage and Supabase (if user is logged in)
    try {
      // Convert messages to the format expected by conversation memory
      const historyToSave = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: msg.content }]
      }));
      
      // Add the latest messages
      historyToSave.push({
        role: 'user' as const,
        parts: [{ text: userMessage.content }]
      });
      
      historyToSave.push({
        role: 'model' as const,
        parts: [{ text: responseContent }]
      });
      
      // Save to storage (using correct single argument)
      saveConversationContext(historyToSave);
      
      // Analyze the conversation to update user preferences
      const interests = detectUserInterests(historyToSave);
      
      if (interests) {
        const updatedPreferences = { ...userPreferences };
        
        // Update preferences based on detected interests
        if (interests.topInterests.includes('nutrition')) {
          updatedPreferences.preferredFocus = updatedPreferences.preferredFocus || 'nutrition';
        } else if (interests.topInterests.includes('training')) {
          updatedPreferences.preferredFocus = updatedPreferences.preferredFocus || 'training';
        }
        
        if (interests.programMentions.length > 0) {
          // Note the program they seem most interested in
          updatedPreferences.interestedProgram = interests.programMentions[0];
        }
        
        // Save updated preferences if there are changes (using correct single argument)
        if (JSON.stringify(updatedPreferences) !== JSON.stringify(userPreferences)) {
          setUserPreferences(updatedPreferences);
          saveUserPreferences(updatedPreferences);
        }
      }
    } catch (error) {
      console.error('Error saving conversation context:', error);
    }
  };
  
  // Handle function calls from the model
  const handleFunctionCall = (functionCall: FunctionCall) => {
    console.log('Function call:', functionCall);
    
    // Each function returns appropriate UI or performs actions
    switch (functionCall.name) {
      case 'add_to_cart':
        // Add product to cart
        const { addItem } = useCartStore();
        addItem({
          id: functionCall.args.productId,
          name: functionCall.args.productName,
          price: functionCall.args.price,
          billingInterval: functionCall.args.billingInterval,
          description: `${functionCall.args.productName} - JMEFit Program`
        });
        
        // Capture lead for purchase intent (very high-intent lead)
        try {
          const leadData = extractLeadData(user, userPreferences, {
            messageCount: messages.length,
            timeSpent: Date.now() - (messages[0]?.timestamp?.getTime() || Date.now()),
            pagesVisited: ['chatbot'],
            actionTaken: 'add_to_cart',
            productInterest: functionCall.args.productName,
            purchaseIntent: true
          });
          
          captureLeadDirect(leadData);
          console.log('✅ Lead captured for add to cart:', leadData);
        } catch (error) {
          console.error('❌ Failed to capture lead:', error);
        }
        
        // Add a message with the cart notification
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            functionCall: {
              name: 'add_to_cart_success',
              args: {
                productName: functionCall.args.productName,
                price: functionCall.args.price
              }
            }
          }
        ]);
        break;
        
      case 'recommend_program':
      case 'list_programs':
        // Capture lead for program interest (medium-intent lead)
        try {
          const leadData = extractLeadData(user, userPreferences, {
            messageCount: messages.length,
            timeSpent: Date.now() - (messages[0]?.timestamp?.getTime() || Date.now()),
            pagesVisited: ['chatbot'],
            actionTaken: functionCall.name,
            programInterest: true
          });
          
          captureLeadDirect(leadData);
          console.log('✅ Lead captured for program interest:', leadData);
        } catch (error) {
          console.error('❌ Failed to capture lead:', error);
        }
        break;
        
      case 'nutrition_guidance':
      case 'sign_up_info':
      case 'create_quick_replies':
        // These function calls are rendered directly in the UI
        // No additional action needed here
        break;
        
      default:
        console.log('Unknown function call:', functionCall.name);
        break;
    }
  };
  
  // Handle quick reply selection - immediately send the message
  const handleQuickReply = (text: string) => {
    // Set the input value
    setInputValue(text);
    
    // Use setTimeout to ensure the input value is set before sending
    setTimeout(() => {
      // Directly call handleSendMessage to send the message
      handleSendMessage();
    }, 10);
  };
  
  // Handle program recommendation
  const handleProgramRecommendation = async () => {
    try {
      // Call the Gemini API to get a program recommendation
      const recommendation = await getProgramRecommendation(userPreferences) as ProgramRecommendation;
      
      // Here we would normally show a loading state
      setShowProgramRecommender(false);
      
      // Use specific recommendation fields
      const program = recommendation.program;
      const reasoning = recommendation.reasoning;
      const features = recommendation.features;
      const price = recommendation.price;
      
      // Capture lead with direct service (high-intent lead)
      try {
        const leadData = extractLeadData(user, userPreferences, {
          messageCount: messages.length,
          timeSpent: Date.now() - (messages[0]?.timestamp?.getTime() || Date.now()),
          pagesVisited: ['chatbot', 'program-recommender'],
          programRecommended: program,
          completedQuiz: true
        });
        
        await captureLeadDirect(leadData);
        console.log('✅ Lead captured for program recommendation:', leadData);
      } catch (error) {
        console.error('❌ Failed to capture lead:', error);
      }
      
      // Update user preferences with the recommended program
      setUserPreferences(prev => ({
        ...prev,
        interestedProgram: program
      }));
      
      // Save to storage
      saveUserPreferences({
        ...userPreferences,
        interestedProgram: program
      });
      
      // Add an assistant message with the recommendation
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Based on your preferences, I recommend the ${program} program.`,
          timestamp: new Date(),
          functionCall: {
            name: 'recommend_program',
            args: {
              programName: program,
              reasoning: reasoning,
              features: features,
              price: price
            }
          }
        }
      ]);
      
      setIsTyping(false);
      
      // Update userPreferences
      setUserPreferences(prev => ({
        ...prev,
        interestedProgram: program
      }));
    } catch (error) {
      console.error('Error getting program recommendation:', error);
      setIsTyping(false);
      
      // Show error message
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm sorry, I couldn't generate a program recommendation at this time. Please try again later or ask me about our different programs.",
          timestamp: new Date()
        }
      ]);
    }
  };
  
  // Format message content with markdown-like syntax and enhance for mobile
  const formatMessageContent = (content: string) => {
    if (!content) return '';
    
    // Remove duplicated text patterns (common in AI responses)
    // This regex looks for repeated phrases that are at least 15 chars long
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
    
    // Add some whitespace after punctuation for mobile readability
    formatted = formatted.replace(/([.!?])\s/g, '$1&nbsp; ');
    
    // Auto-detect URLs and convert to links (including Instagram URLs)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-jme-purple underline">$1</a>');
    
    // Specific handling for Instagram mentions and hashtags
    formatted = formatted.replace(/(\s|^)(@[\w\.]+)/g, '$1<a href="https://instagram.com/$2" target="_blank" rel="noopener noreferrer" class="text-jme-purple underline">$2</a>');
    formatted = formatted.replace(/(\s|^)(#[\w]+)/g, '$1<a href="https://instagram.com/explore/tags/$2" target="_blank" rel="noopener noreferrer" class="text-jme-purple underline">$2</a>');
    
    // Highlight important terms
    const terms = ['JMEFit', 'protein', 'nutrition', 'workout', 'fitness', 'program'];
    terms.forEach(term => {
      const regex = new RegExp(`(?<![a-zA-Z])(${term})(?![a-zA-Z])`, 'gi');
      formatted = formatted.replace(regex, '<span class="font-medium text-jme-purple">$1</span>');
    });
    
    return formatted;
  };
  const handleQuickReplyClick = (value: string) => {
    setInputValue(value);
    // Send message immediately
    handleSendMessage();
  };
  
  // Render function call UI
  const renderFunctionCall = (functionCall: FunctionCall) => {
    return (
      <ChatbotFunctionCallUI 
        functionCall={functionCall} 
        onQuickReplySelect={handleQuickReplyClick} 
      />
    );
  };
  
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
  
  // Component render
  return (
    <>
      {/* Mobile sticky footer button, desktop bottom-right button - only visible when chat is closed */}
      {!isOpen && (
        <button
          className="fixed z-[100] bottom-0 left-0 right-0 sm:left-auto sm:right-4 sm:bottom-6 p-3 sm:p-4 bg-gradient-to-r from-jme-purple to-jme-cyan text-white sm:rounded-full shadow-lg w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 transition-all duration-300"
          onClick={handleToggleChat}
          aria-label="Open chat"
          style={{ height: '50px' }}
        >
          <MessageSquare size={24} />
          <span className="sm:hidden font-medium">Chat with JMEFit Assistant</span>
        </button>
      )}
      
      {/* Chat window - full screen on mobile, sidebar on desktop - Safari compatible */}
      {isOpen && (
        <div 
          className="fixed z-[90] inset-0 top-[60px] sm:top-auto sm:bottom-20 sm:right-4 sm:left-auto w-full sm:w-[420px] bg-gray-50 rounded-none sm:rounded-xl shadow-xl flex flex-col overflow-hidden border border-gray-200 max-w-[100vw] sm:max-w-[420px] box-border"
          style={{  
            height: 'calc(var(--vh, 1vh) * 100 - 60px)', // Safari fix using CSS variable
            maxHeight: 'calc(var(--vh, 1vh) * 100 - 60px)',
            WebkitOverflowScrolling: 'touch' // Safari smooth scrolling
          }}
        >
          {/* Chat header - always visible */}
          <div className="bg-white shadow-md rounded-t-2xl p-4 border-b border-gray-200 sticky top-0 z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-1.5 bg-gradient-to-r from-jme-purple to-jme-cyan rounded-full text-white mr-2 shadow-sm">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-md font-semibold text-gray-800">JMEFit Assistant</h3>
              </div>
              <button 
                onClick={handleToggleChat}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {showProgramRecommender ? (
            <>
              {/* Program Recommender Form */}
              <div className="flex-1 overflow-y-auto p-4 bg-white">
                <h3 className="text-lg font-bold text-jme-purple mb-4">Find Your Perfect Program</h3>
                <p className="text-gray-600 mb-4">Let me help you find the JMEFit program that's right for you. Please answer a few questions about your fitness goals.</p>
                
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What are your main fitness goals?</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                      value={userPreferences.goals}
                      onChange={(e) => setUserPreferences(prev => ({...prev, goals: e.target.value}))}
                    >
                      <option value="">Select a goal</option>
                      <option value="weight-loss">Weight Loss</option>
                      <option value="muscle-gain">Muscle Gain</option>
                      <option value="strength">Strength</option>
                      <option value="endurance">Endurance</option>
                      <option value="overall-fitness">Overall Fitness</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What's your experience level?</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                      value={userPreferences.experienceLevel}
                      onChange={(e) => setUserPreferences(prev => ({...prev, experienceLevel: e.target.value}))}
                    >
                      <option value="">Select experience level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How much time can you dedicate to fitness each week?</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                      value={userPreferences.timeAvailable}
                      onChange={(e) => setUserPreferences(prev => ({...prev, timeAvailable: e.target.value}))}
                    >
                      <option value="">Select time available</option>
                      <option value="minimal">1-2 hours/week</option>
                      <option value="moderate">3-5 hours/week</option>
                      <option value="significant">6+ hours/week</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What's your budget for a fitness program?</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                      value={userPreferences.budget}
                      onChange={(e) => setUserPreferences(prev => ({...prev, budget: e.target.value}))}
                    >
                      <option value="">Select budget range</option>
                      <option value="low">Under $50/month</option>
                      <option value="medium">$50-$100/month</option>
                      <option value="high">$100+/month</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Are you more interested in nutrition or training?</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                      value={userPreferences.preferredFocus}
                      onChange={(e) => setUserPreferences(prev => ({...prev, preferredFocus: e.target.value}))}
                    >
                      <option value="">Select preference</option>
                      <option value="nutrition">Nutrition</option>
                      <option value="training">Training</option>
                      <option value="both">Both Equally</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <button
                      type="button"
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
                      onClick={() => setShowProgramRecommender(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2 px-4 bg-gradient-to-r from-jme-purple to-jme-cyan text-white font-medium rounded-md hover:opacity-90 transition-opacity"
                      onClick={handleProgramRecommendation}
                      disabled={!userPreferences.goals || !userPreferences.experienceLevel || !userPreferences.timeAvailable}
                    >
                      Get Recommendation
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Chat messages - improved scrolling */}
              <div 
                className="flex-1 overflow-y-auto p-4 bg-white w-full overflow-x-hidden" 
                id="chat-messages" 
                style={{ 
                  height: 'calc(100% - 160px)', 
                  paddingBottom: '80px', 
                  maxWidth: '100%', 
                  overscrollBehavior: 'contain',
                  WebkitOverflowScrolling: 'touch', // Safari smooth scrolling
                  transform: 'translateZ(0)' // Force GPU acceleration for smoother scrolling in Safari
                }}>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div
                      className={`w-auto max-w-[80%] sm:max-w-[75%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-jme-purple text-white rounded-tr-none'
                          : 'bg-white border border-gray-200 rounded-tl-none shadow-sm'
                      }`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      {/* Message content */}
                      <div 
                        className="text-sm whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                      />
                      
                      {/* Function call UI */}
                      {message.role === 'assistant' && message.functionCall && (
                        <div className="mt-2">
                          {renderFunctionCall(message.functionCall)}
                        </div>
                      )}
                      
                      {/* Timestamp */}
                      <div
                        className={`text-xs mt-1 text-right ${
                          message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
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
              
              {/* Quick replies */}
              {messages.length < 3 && (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        className="text-xs bg-white border border-gray-300 rounded-full px-4 py-1.5 hover:bg-gradient-to-r hover:from-jme-purple/10 hover:to-jme-cyan/10 hover:border-jme-purple/30 transition-all duration-300 shadow-sm font-medium"
                        onClick={() => {
                          // Execute the action immediately
                          reply.action();
                          // Add visual feedback
                          const button = document.activeElement as HTMLButtonElement;
                          if (button) {
                            button.classList.add('bg-gradient-to-r', 'from-jme-purple/20', 'to-jme-cyan/20');
                            setTimeout(() => {
                              button.classList.remove('bg-gradient-to-r', 'from-jme-purple/20', 'to-jme-cyan/20');
                            }, 500);
                          }
                        }}
                      >
                        {reply.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Input area - sticky at bottom - dynamically resizing textarea - Safari compatible */}
              <div className="p-4 pb-8 border-t border-gray-200 bg-white sticky bottom-0 left-0 right-0 shadow-md w-full" style={{ maxWidth: '100%', boxSizing: 'border-box', paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}>
                <div className="flex items-start gap-2 w-full" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
                  <div className="relative flex-1 w-full">
                    <textarea
                      ref={(textAreaRef) => {
                        // Auto-resize textarea as content changes
                        if (textAreaRef) {
                          textAreaRef.style.height = 'auto';
                          const newHeight = Math.min(textAreaRef.scrollHeight, 150); // Max height of 150px
                          textAreaRef.style.height = `${newHeight}px`;
                        }
                      }}
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        // Reset height to recalculate
                        e.target.style.height = 'auto';
                        const newHeight = Math.min(e.target.scrollHeight, 150); // Max height of 150px
                        e.target.style.height = `${newHeight}px`;
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault(); // Prevent newline
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask about JMEFit programs, nutrition, or fitness..."
                      className="w-full p-3 pl-4 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-jme-purple focus:border-transparent shadow-sm text-sm sm:text-base appearance-none resize-none overflow-hidden"
                      style={{ 
                        maxWidth: '100%', 
                        boxSizing: 'border-box',
                        WebkitAppearance: 'none', // Safari input appearance fix
                        fontSize: '16px', // Prevent Safari from zooming in
                        minHeight: '44px',
                        maxHeight: '150px',
                        lineHeight: '1.4'
                      }}
                      disabled={isTyping}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      rows={1}
                    />
                    {inputValue && (
                      <button 
                        onClick={() => setInputValue('')}
                        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-3.5 bg-gradient-to-r from-jme-purple to-jme-cyan text-white rounded-full hover:opacity-90 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 shadow-md flex items-center justify-center"
                    aria-label="Send message"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className="mt-3 text-xs text-center text-gray-500">
                  <p>JMEFit Assistant can help with programs, nutrition advice, and fitness guidance</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default GeminiChatbot;
