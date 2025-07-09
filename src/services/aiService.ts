import { EmailBlock } from '../components/admin/Email/EnhancedBuilder';

interface AIGenerationOptions {
  prompt: string;
  emailType: 'marketing' | 'transactional' | 'newsletter' | 'notification';
  tone?: 'professional' | 'friendly' | 'casual' | 'urgent';
  includeDiscount?: boolean;
  includeImages?: boolean;
}

interface EmailTemplate {
  subject: string;
  blocks: EmailBlock[];
}

export class AIEmailService {
  // Generate email template based on prompt
  static async generateEmailTemplate(options: AIGenerationOptions): Promise<EmailTemplate> {
    const { prompt, emailType, tone = 'friendly', includeDiscount = false, includeImages = true } = options;
    
    // Parse intent from prompt
    const intent = this.parseIntent(prompt);
    
    // Generate appropriate blocks based on email type and intent
    const blocks = this.generateBlocks(emailType, intent, { tone, includeDiscount, includeImages });
    
    // Generate subject line
    const subject = this.generateSubject(emailType, intent);
    
    return { subject, blocks };
  }
  
  private static parseIntent(prompt: string): Record<string, any> {
    const lowerPrompt = prompt.toLowerCase();
    
    return {
      isWelcome: lowerPrompt.includes('welcome') || lowerPrompt.includes('new member'),
      isPromotion: lowerPrompt.includes('discount') || lowerPrompt.includes('offer') || lowerPrompt.includes('sale'),
      isReminder: lowerPrompt.includes('reminder') || lowerPrompt.includes('upcoming') || lowerPrompt.includes('tomorrow'),
      isNewsletter: lowerPrompt.includes('newsletter') || lowerPrompt.includes('update') || lowerPrompt.includes('tips'),
      isThankYou: lowerPrompt.includes('thank') || lowerPrompt.includes('appreciate'),
      isAnnouncement: lowerPrompt.includes('announce') || lowerPrompt.includes('new') || lowerPrompt.includes('launch'),
      hasUrgency: lowerPrompt.includes('urgent') || lowerPrompt.includes('important') || lowerPrompt.includes('asap'),
      targetAudience: this.extractAudience(lowerPrompt),
      mainTopic: this.extractTopic(lowerPrompt)
    };
  }
  
  private static extractAudience(prompt: string): string {
    if (prompt.includes('new member') || prompt.includes('new client')) return 'new members';
    if (prompt.includes('existing') || prompt.includes('current')) return 'existing members';
    if (prompt.includes('premium') || prompt.includes('vip')) return 'premium members';
    return 'all members';
  }
  
  private static extractTopic(prompt: string): string {
    if (prompt.includes('nutrition')) return 'nutrition';
    if (prompt.includes('training') || prompt.includes('workout')) return 'training';
    if (prompt.includes('class') || prompt.includes('schedule')) return 'classes';
    if (prompt.includes('challenge')) return 'challenge';
    if (prompt.includes('payment') || prompt.includes('billing')) return 'billing';
    return 'general';
  }
  
  private static generateSubject(emailType: string, intent: Record<string, any>): string {
    if (intent.isWelcome) {
      return "Welcome to JMEFIT - Let's Start Your Fitness Journey! 💪";
    }
    
    if (intent.isPromotion) {
      if (intent.hasUrgency) {
        return "⏰ Limited Time: Exclusive Offer Inside!";
      }
      return "Special Offer Just for You - Save on Your Fitness Goals";
    }
    
    if (intent.isReminder) {
      if (intent.mainTopic === 'classes') {
        return "Reminder: Your Class is Coming Up";
      }
      if (intent.mainTopic === 'billing') {
        return "Payment Reminder - Keep Your Fitness Journey Going";
      }
      return "Don't Forget - Important Update from JMEFIT";
    }
    
    if (intent.isNewsletter) {
      const month = new Date().toLocaleString('default', { month: 'long' });
      return `JMEFIT ${month} Newsletter - Tips, Updates & More`;
    }
    
    if (intent.isAnnouncement) {
      return "Exciting News from JMEFIT! 🎉";
    }
    
    return "Important Update from JMEFIT";
  }
  
  private static generateBlocks(
    emailType: string, 
    intent: Record<string, any>,
    options: { tone: string; includeDiscount: boolean; includeImages: boolean }
  ): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    // Always start with logo
    blocks.push({
      id: `block-${Date.now()}-logo`,
      type: 'logo',
      content: { url: '/logo.png' },
      styles: {}
    });
    
    // Add header
    blocks.push({
      id: `block-${Date.now()}-header`,
      type: 'header',
      content: { text: this.generateHeaderText(intent, options.tone) },
      styles: {}
    });
    
    // Add main content blocks based on intent
    if (intent.isWelcome) {
      blocks.push(...this.generateWelcomeBlocks(options));
    } else if (intent.isPromotion) {
      blocks.push(...this.generatePromotionBlocks(options));
    } else if (intent.isReminder) {
      blocks.push(...this.generateReminderBlocks(intent, options));
    } else if (intent.isNewsletter) {
      blocks.push(...this.generateNewsletterBlocks(options));
    } else if (intent.isAnnouncement) {
      blocks.push(...this.generateAnnouncementBlocks(intent, options));
    } else {
      blocks.push(...this.generateGeneralBlocks(intent, options));
    }
    
    // Add footer blocks
    blocks.push({
      id: `block-${Date.now()}-divider`,
      type: 'divider',
      content: {},
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-social`,
      type: 'social',
      content: {},
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-footer`,
      type: 'footer',
      content: {},
      styles: {}
    });
    
    return blocks;
  }
  
  private static generateHeaderText(intent: Record<string, any>, tone: string): string {
    if (intent.isWelcome) {
      return tone === 'professional' ? 'Welcome to JMEFIT' : 'Welcome to the JMEFIT Family! 🎉';
    }
    if (intent.isPromotion) {
      return intent.hasUrgency ? 'Limited Time Offer!' : 'Special Offer Just for You';
    }
    if (intent.isReminder) {
      return 'Important Reminder';
    }
    if (intent.isNewsletter) {
      return 'Your Monthly Fitness Update';
    }
    if (intent.isAnnouncement) {
      return 'Exciting News!';
    }
    return 'Update from JMEFIT';
  }
  
  private static generateWelcomeBlocks(options: any): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    blocks.push({
      id: `block-${Date.now()}-text1`,
      type: 'text',
      content: {
        text: options.tone === 'professional' 
          ? 'Thank you for joining JMEFIT. We are committed to helping you achieve your fitness goals through personalized training and nutrition guidance.'
          : "We're thrilled to have you join our fitness community! Get ready to transform your life with personalized training, nutrition guidance, and ongoing support from our expert team. 💪"
      },
      styles: {}
    });
    
    if (options.includeImages) {
      blocks.push({
        id: `block-${Date.now()}-image`,
        type: 'image',
        content: { 
          url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop',
          alt: 'Modern gym facility'
        },
        styles: {}
      });
    }
    
    blocks.push({
      id: `block-${Date.now()}-text2`,
      type: 'text',
      content: {
        text: 'Here\'s what you can expect:\n\n• Personalized workout plans\n• Nutrition guidance and meal plans\n• Access to our expert trainers\n• Supportive community of fitness enthusiasts\n• Regular progress tracking'
      },
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-button`,
      type: 'button',
      content: { text: 'Get Started', url: 'https://jmefit.com/dashboard' },
      styles: {}
    });
    
    if (options.includeDiscount) {
      blocks.push({
        id: `block-${Date.now()}-discount`,
        type: 'discount',
        content: { 
          code: 'WELCOME20',
          description: 'Save 20% on your first month',
          expiry: 'Valid for 30 days'
        },
        styles: {}
      });
    }
    
    return blocks;
  }
  
  private static generatePromotionBlocks(options: any): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    blocks.push({
      id: `block-${Date.now()}-text1`,
      type: 'text',
      content: {
        text: options.tone === 'professional'
          ? 'We are pleased to offer you an exclusive discount on our premium fitness programs.'
          : 'As a valued member of our community, we\'re offering you an exclusive discount that will help you take your fitness journey to the next level! 🎯'
      },
      styles: {}
    });
    
    if (options.includeDiscount) {
      blocks.push({
        id: `block-${Date.now()}-discount`,
        type: 'discount',
        content: { 
          code: 'FITNESS30',
          description: 'Save 30% on any program',
          expiry: 'Limited time offer - ends soon!'
        },
        styles: {}
      });
    }
    
    if (options.includeImages) {
      blocks.push({
        id: `block-${Date.now()}-image`,
        type: 'image',
        content: { 
          url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=300&fit=crop',
          alt: 'Personal training session'
        },
        styles: {}
      });
    }
    
    blocks.push({
      id: `block-${Date.now()}-text2`,
      type: 'text',
      content: {
        text: 'This offer includes:\n\n✓ All training programs\n✓ Nutrition plans\n✓ 1-on-1 coaching sessions\n✓ Access to exclusive content'
      },
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-button`,
      type: 'button',
      content: { text: 'Claim Your Discount', url: 'https://jmefit.com/programs' },
      styles: {}
    });
    
    return blocks;
  }
  
  private static generateReminderBlocks(intent: Record<string, any>, options: any): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    if (intent.mainTopic === 'classes') {
      blocks.push({
        id: `block-${Date.now()}-text1`,
        type: 'text',
        content: {
          text: 'Don\'t forget about your upcoming class:\n\n📅 Date: Tomorrow\n⏰ Time: 9:00 AM\n📍 Location: Main Studio\n👥 Instructor: Sarah Johnson\n💪 Class: HIIT Training'
        },
        styles: {}
      });
      
      blocks.push({
        id: `block-${Date.now()}-button`,
        type: 'button',
        content: { text: 'View Full Schedule', url: 'https://jmefit.com/schedule' },
        styles: {}
      });
      
      blocks.push({
        id: `block-${Date.now()}-text2`,
        type: 'text',
        content: {
          text: 'Remember to bring:\n• Water bottle\n• Towel\n• Your positive energy!\n\nSee you there! 💪'
        },
        styles: {}
      });
    } else if (intent.mainTopic === 'billing') {
      blocks.push({
        id: `block-${Date.now()}-text1`,
        type: 'text',
        content: {
          text: 'This is a friendly reminder that your membership renewal is coming up. Keep your fitness journey going without interruption!'
        },
        styles: {}
      });
      
      blocks.push({
        id: `block-${Date.now()}-button`,
        type: 'button',
        content: { text: 'Renew Membership', url: 'https://jmefit.com/account/billing' },
        styles: {}
      });
    } else {
      blocks.push({
        id: `block-${Date.now()}-text1`,
        type: 'text',
        content: {
          text: 'This is a reminder about an important update regarding your JMEFIT account. Please take a moment to review this information.'
        },
        styles: {}
      });
      
      blocks.push({
        id: `block-${Date.now()}-button`,
        type: 'button',
        content: { text: 'View Details', url: 'https://jmefit.com/dashboard' },
        styles: {}
      });
    }
    
    return blocks;
  }
  
  private static generateNewsletterBlocks(options: any): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    if (options.includeImages) {
      blocks.push({
        id: `block-${Date.now()}-image`,
        type: 'image',
        content: { 
          url: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=600&h=300&fit=crop',
          alt: 'Monthly fitness newsletter'
        },
        styles: {}
      });
    }
    
    blocks.push({
      id: `block-${Date.now()}-text1`,
      type: 'text',
      content: {
        text: 'This month at JMEFIT has been incredible! Here are the highlights:'
      },
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-text2`,
      type: 'text',
      content: {
        text: '🏋️ New Classes Added\nWe\'ve launched 3 new HIIT classes and 2 yoga sessions to help you diversify your workout routine.\n\n🥗 Nutrition Workshop Success\nOver 50 members joined our nutrition workshop last week. The recording is now available in your member portal.\n\n⭐ Member Spotlight\nCongratulations to Sarah M. who achieved her 50lb weight loss goal! Read her inspiring story on our blog.\n\n💡 Fitness Tip of the Month\nStay hydrated! Aim for at least 8 glasses of water daily, and increase intake during workouts.'
      },
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-button`,
      type: 'button',
      content: { text: 'Read Full Newsletter', url: 'https://jmefit.com/newsletter' },
      styles: {}
    });
    
    return blocks;
  }
  
  private static generateAnnouncementBlocks(intent: Record<string, any>, options: any): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    blocks.push({
      id: `block-${Date.now()}-text1`,
      type: 'text',
      content: {
        text: options.tone === 'professional'
          ? 'We are pleased to announce an exciting new development at JMEFIT.'
          : 'We have some amazing news to share with you! 🎉'
      },
      styles: {}
    });
    
    if (options.includeImages) {
      blocks.push({
        id: `block-${Date.now()}-image`,
        type: 'image',
        content: { 
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=300&fit=crop',
          alt: 'Exciting announcement'
        },
        styles: {}
      });
    }
    
    blocks.push({
      id: `block-${Date.now()}-text2`,
      type: 'text',
      content: {
        text: 'Based on your feedback, we\'re launching new features to enhance your fitness experience:\n\n• Mobile app with workout tracking\n• AI-powered meal planning\n• Virtual training sessions\n• Community challenges with prizes'
      },
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-button`,
      type: 'button',
      content: { text: 'Learn More', url: 'https://jmefit.com/new-features' },
      styles: {}
    });
    
    return blocks;
  }
  
  private static generateGeneralBlocks(intent: Record<string, any>, options: any): EmailBlock[] {
    const blocks: EmailBlock[] = [];
    
    blocks.push({
      id: `block-${Date.now()}-text1`,
      type: 'text',
      content: {
        text: 'We hope this message finds you well. We wanted to reach out with some important information about your JMEFIT experience.'
      },
      styles: {}
    });
    
    blocks.push({
      id: `block-${Date.now()}-button`,
      type: 'button',
      content: { text: 'View Details', url: 'https://jmefit.com/dashboard' },
      styles: {}
    });
    
    return blocks;
  }
  
  // Generate AI-powered content suggestions
  static async generateContentSuggestions(blockType: string, context: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    switch (blockType) {
      case 'header':
        suggestions.push(
          'Transform Your Fitness Journey',
          'Exclusive Offer Inside!',
          'Your Weekly Fitness Update',
          'Important Account Information',
          'New Classes Now Available'
        );
        break;
        
      case 'text':
        suggestions.push(
          'Join us for an exciting fitness journey tailored just for you.',
          'We\'re committed to helping you achieve your health and wellness goals.',
          'Check out our latest classes and training programs designed to challenge and inspire you.',
          'Your dedication to fitness inspires us every day. Thank you for being part of our community.',
          'Remember, consistency is key. Keep pushing towards your goals!'
        );
        break;
        
      case 'button':
        suggestions.push(
          'Get Started',
          'Learn More',
          'Book Your Class',
          'Claim Offer',
          'View Schedule'
        );
        break;
        
      case 'discount':
        suggestions.push(
          'SAVE20 - 20% off your next month',
          'FITNESS30 - 30% off training programs',
          'NEWYEAR25 - 25% off annual membership',
          'TRANSFORM15 - 15% off nutrition plans',
          'WELCOME10 - 10% off for new members'
        );
        break;
    }
    
    return suggestions;
  }
}

// Export for use in components
export default AIEmailService;