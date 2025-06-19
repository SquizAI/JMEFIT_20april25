// JMEFIT Chatbot Enhancement - ICP Scoring Integration
// Add this to your existing Unified Agentix chatbot

class JMEFITChatbotEnhancer {
  constructor() {
    this.icpScore = 0;
    this.userResponses = {};
    this.webhookUrl = 'https://your-n8n-instance.com/webhook/chatbot-lead';
    this.leadMagnets = {
      hot: {
        title: "Free Transformation Bundle",
        description: "Custom macro calculation + meal planning template + workout videos",
        value: "$297 value - FREE today!"
      },
      warm: {
        title: "Beginner's Fitness Guide", 
        description: "Complete guide to nutrition and workouts for beginners",
        value: "Get started the right way!"
      },
      cold: {
        title: "Free Resource Library",
        description: "Access to workout videos and basic nutrition tips",
        value: "Everything you need to begin!"
      }
    };
  }

  // Enhanced conversation flow with ICP scoring
  async enhanceConversation(userMessage, chatContext) {
    const responses = await this.analyzeUserIntent(userMessage);
    this.updateICPScore(responses);
    
    return this.generatePersonalizedResponse(chatContext);
  }

  // Natural language ICP scoring
  analyzeUserIntent(message) {
    const lowerMessage = message.toLowerCase();
    const responses = {};
    
    // Goal detection
    if (lowerMessage.includes('lose weight') || lowerMessage.includes('weight loss')) {
      responses.goals = [...(responses.goals || []), 'weight_loss'];
      this.icpScore += 20;
    }
    
    if (lowerMessage.includes('build muscle') || lowerMessage.includes('muscle building') || lowerMessage.includes('tone')) {
      responses.goals = [...(responses.goals || []), 'muscle_building'];
      this.icpScore += 15;
    }
    
    if (lowerMessage.includes('nutrition') || lowerMessage.includes('diet') || lowerMessage.includes('eating')) {
      responses.goals = [...(responses.goals || []), 'nutrition_guidance'];
      this.icpScore += 15;
    }
    
    // Experience level detection
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new to') || lowerMessage.includes('never')) {
      responses.experience = 'beginner';
      this.icpScore += 15;
    }
    
    if (lowerMessage.includes('some experience') || lowerMessage.includes('intermediate')) {
      responses.experience = 'intermediate';
      this.icpScore += 10;
    }
    
    // Budget/commitment indicators
    if (lowerMessage.includes('invest') || lowerMessage.includes('serious about') || lowerMessage.includes('committed')) {
      this.icpScore += 10;
    }
    
    // Store responses
    this.userResponses = { ...this.userResponses, ...responses };
    
    return responses;
  }

  // Update ICP score based on conversation
  updateICPScore(responses) {
    // Calculate segment
    if (this.icpScore >= 70) {
      this.userResponses.segment = 'hot';
    } else if (this.icpScore >= 40) {
      this.userResponses.segment = 'warm';
    } else {
      this.userResponses.segment = 'cold';
    }
  }

  // Generate personalized response based on ICP score
  generatePersonalizedResponse(chatContext) {
    const segment = this.userResponses.segment;
    const leadMagnet = this.leadMagnets[segment];
    
    if (segment === 'hot') {
      return {
        message: `Amazing! Based on what you've shared, I think you'd be perfect for our personalized approach. I'd love to send you our ${leadMagnet.title} - ${leadMagnet.description}. ${leadMagnet.value}`,
        suggestedActions: [
          { text: "Yes, send me the bundle!", action: "collect_email", value: "transformation_bundle" },
          { text: "Tell me more about your programs", action: "show_programs", value: "nutrition_training" },
          { text: "I'd like to speak with someone", action: "book_consultation", value: "premium" }
        ],
        leadMagnetOffer: leadMagnet,
        nextStep: "collect_email_premium"
      };
    } else if (segment === 'warm') {
      return {
        message: `Great! I can definitely help you reach your goals. Let me send you our ${leadMagnet.title} to get you started. ${leadMagnet.description}`,
        suggestedActions: [
          { text: "Send me the guide!", action: "collect_email", value: "beginner_guide" },
          { text: "What programs do you offer?", action: "show_programs", value: "self_led" },
          { text: "How much does coaching cost?", action: "show_pricing", value: "entry_level" }
        ],
        leadMagnetOffer: leadMagnet,
        nextStep: "collect_email_standard"
      };
    } else {
      return {
        message: `I'm excited to help you get started on your fitness journey! Let me share our ${leadMagnet.title} with you. ${leadMagnet.description}`,
        suggestedActions: [
          { text: "Get free resources", action: "collect_email", value: "free_resources" },
          { text: "Learn about fitness basics", action: "educational_content", value: "basics" },
          { text: "See success stories", action: "show_testimonials", value: "motivation" }
        ],
        leadMagnetOffer: leadMagnet,
        nextStep: "collect_email_educational"
      };
    }
  }

  // Collect email and trigger automation
  async collectEmailAndTrigger(email, firstName, context) {
    const prospectData = {
      email: email,
      first_name: firstName,
      source: 'website_chatbot',
      chat_responses: this.userResponses,
      icp_score: this.icpScore,
      segment: this.userResponses.segment,
      recommended_product: this.getRecommendedProduct(),
      page_url: window.location.href,
      utm_source: this.getUTMParameter('utm_source'),
      utm_campaign: this.getUTMParameter('utm_campaign'),
      session_data: {
        time_on_site: this.getTimeOnSite(),
        pages_viewed: this.getPagesViewed(),
        device_type: navigator.userAgent,
        chat_duration: this.getChatDuration()
      },
      timestamp: new Date().toISOString()
    };

    // Send to n8n automation
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prospectData)
      });

      // Also store locally in Supabase
      await this.storeInSupabase(prospectData);

      return {
        success: true,
        message: this.getConfirmationMessage(),
        nextSteps: this.getNextSteps()
      };
    } catch (error) {
      console.error('Error triggering automation:', error);
      return {
        success: false,
        message: "Thanks for your email! I'll send you those resources shortly."
      };
    }
  }

  // Get recommended product based on ICP score
  getRecommendedProduct() {
    if (this.icpScore >= 70) {
      return 'nutrition_training';
    } else if (this.icpScore >= 40) {
      return 'nutrition_only';
    } else {
      return 'self_led';
    }
  }

  // Dynamic confirmation message based on segment
  getConfirmationMessage() {
    const segment = this.userResponses.segment;
    
    if (segment === 'hot') {
      return "Perfect! I'm sending your Transformation Bundle to your email right now. Keep an eye out for an email from me in the next few minutes with your custom macro calculation and exclusive resources. You're going to love what I've prepared for you! 🎯";
    } else if (segment === 'warm') {
      return "Awesome! Your Beginner's Fitness Guide is heading to your inbox now. This will give you a solid foundation to start your journey. I'll also send you some additional tips over the next few days! 💪";
    } else {
      return "Great! Your free resources are on their way to your email. I'm also going to send you some helpful tips over the next week to keep you motivated and on track! 🌟";
    }
  }

  // Next steps based on segment
  getNextSteps() {
    const segment = this.userResponses.segment;
    
    if (segment === 'hot') {
      return [
        "Check your email for the Transformation Bundle",
        "Join our private Facebook community (link in email)",
        "Watch for my personal follow-up message tomorrow",
        "Consider booking a free consultation call"
      ];
    } else if (segment === 'warm') {
      return [
        "Download and read the Beginner's Guide",
        "Try the sample workout I'm sending",
        "Track your progress for 1 week",
        "Reply to my emails with any questions"
      ];
    } else {
      return [
        "Explore the free resource library",
        "Start with the basic workout routine",
        "Join our community for support",
        "Take our detailed fitness quiz when ready"
      ];
    }
  }

  // Store prospect data in Supabase
  async storeInSupabase(prospectData) {
    // This integrates with your existing Supabase setup
    const { data, error } = await supabase
      .from('prospects')
      .upsert({
        email: prospectData.email,
        first_name: prospectData.first_name,
        lead_source: prospectData.source,
        icp_score: prospectData.icp_score,
        segment: prospectData.segment,
        fitness_goals: prospectData.chat_responses.goals || [],
        experience_level: prospectData.chat_responses.experience,
        quiz_results: prospectData.chat_responses,
        social_data: {},
        created_at: new Date().toISOString()
      }, { 
        onConflict: 'email' 
      });

    if (error) {
      console.error('Supabase error:', error);
    }
  }

  // Utility functions
  getUTMParameter(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  getTimeOnSite() {
    return Date.now() - (window.chatbotStartTime || Date.now());
  }

  getPagesViewed() {
    return window.chatbotPagesViewed || [window.location.pathname];
  }

  getChatDuration() {
    return Date.now() - (this.chatStartTime || Date.now());
  }
}

// Integration with your existing chatbot
// Add this to your current Unified Agentix setup

const jmefitEnhancer = new JMEFITChatbotEnhancer();

// Enhance your existing message handler
const originalMessageHandler = window.chatbot.handleMessage;
window.chatbot.handleMessage = async function(message, context) {
  // Run original logic
  const originalResponse = await originalMessageHandler.call(this, message, context);
  
  // Add ICP enhancement
  const enhancedResponse = await jmefitEnhancer.enhanceConversation(message, context);
  
  // Merge responses
  return {
    ...originalResponse,
    icpEnhancement: enhancedResponse,
    icpScore: jmefitEnhancer.icpScore,
    segment: jmefitEnhancer.userResponses.segment
  };
};

// Add email collection enhancement
window.chatbot.collectEmail = async function(email, firstName, context) {
  const result = await jmefitEnhancer.collectEmailAndTrigger(email, firstName, context);
  
  // Update chat UI with confirmation
  this.addMessage({
    type: 'system',
    message: result.message,
    nextSteps: result.nextSteps
  });
  
  return result;
};

// Export for use
window.JMEFITChatbotEnhancer = JMEFITChatbotEnhancer; 