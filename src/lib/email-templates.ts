export interface EmailTemplateConfig {
  id: string;
  name: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'notification' | 'lead-nurture';
  description: string;
  htmlFile: string;
  variables: string[];
  tags: string[];
}

export const EMAIL_TEMPLATES: EmailTemplateConfig[] = [
  // Transactional Emails
  {
    id: 'verification',
    name: 'Email Verification',
    subject: 'Verify Your JMEFIT Account',
    category: 'transactional',
    description: 'Sent when a user signs up to verify their email address',
    htmlFile: '/src/emails/verification.html',
    variables: ['verificationLink', 'userName'],
    tags: ['signup', 'verification']
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your JMEFIT Password',
    category: 'transactional',
    description: 'Sent when a user requests a password reset',
    htmlFile: '/src/emails/password-reset.html',
    variables: ['resetLink', 'userName', 'expirationTime'],
    tags: ['security', 'password']
  },
  {
    id: 'welcome',
    name: 'Welcome to JMEFIT',
    subject: 'Welcome to Your Fitness Journey!',
    category: 'transactional',
    description: 'General welcome email for new users',
    htmlFile: '/src/emails/welcome.html',
    variables: ['userName'],
    tags: ['onboarding', 'welcome']
  },
  {
    id: 'subscription-confirmation',
    name: 'Subscription Confirmation',
    subject: 'Your JMEFIT Subscription is Active!',
    category: 'transactional',
    description: 'Confirms successful subscription activation',
    htmlFile: '/src/emails/subscription-confirmation.html',
    variables: ['userName', 'planName', 'nextBillingDate', 'amount'],
    tags: ['subscription', 'payment']
  },
  {
    id: 'thank-you',
    name: 'Thank You',
    subject: 'Thank You for Your Purchase!',
    category: 'transactional',
    description: 'General thank you email after purchase',
    htmlFile: '/src/emails/thank-you.html',
    variables: ['userName', 'orderDetails'],
    tags: ['purchase', 'confirmation']
  },

  // Lead Nurture Emails
  {
    id: 'cold-lead-welcome',
    name: 'Cold Lead Welcome',
    subject: 'Start Your Fitness Transformation Today',
    category: 'lead-nurture',
    description: 'Welcome email for cold leads with educational content',
    htmlFile: '/src/emails/cold-lead-welcome.html',
    variables: ['firstName'],
    tags: ['cold-lead', 'educational', 'nurture']
  },
  {
    id: 'warm-lead-welcome',
    name: 'Warm Lead Welcome',
    subject: 'Your Personalized Fitness Journey Awaits',
    category: 'lead-nurture',
    description: 'Welcome email for warm leads with testimonials and offers',
    htmlFile: '/src/emails/warm-lead-welcome.html',
    variables: ['firstName', 'recommendedProgram'],
    tags: ['warm-lead', 'testimonials', 'nurture']
  },
  {
    id: 'hot-lead-welcome',
    name: 'Hot Lead Welcome',
    subject: 'Exclusive Offer: Start Your JMEFIT Journey Today',
    category: 'lead-nurture',
    description: 'Welcome email for hot leads with limited-time offers',
    htmlFile: '/src/emails/hot-lead-welcome.html',
    variables: ['firstName', 'discountCode', 'offerExpiry'],
    tags: ['hot-lead', 'urgency', 'discount']
  },

  // Program-Specific Welcome Emails
  {
    id: 'nutrition-programs-welcome',
    name: 'Nutrition Programs Welcome',
    subject: 'Welcome to JMEFIT Nutrition Coaching',
    category: 'marketing',
    description: 'Welcome email for nutrition program subscribers',
    htmlFile: '/src/emails/nutrition-programs-welcome.html',
    variables: ['firstName', 'programName', 'coachName'],
    tags: ['nutrition', 'program-welcome']
  },
  {
    id: 'self-led-training-welcome',
    name: 'Self-Led Training Welcome',
    subject: 'Your Self-Led Training Journey Begins',
    category: 'marketing',
    description: 'Welcome email for self-led training program',
    htmlFile: '/src/emails/self-led-training-welcome.html',
    variables: ['firstName', 'trainingPlanName'],
    tags: ['training', 'self-led', 'program-welcome']
  },
  {
    id: 'shred-challenge-welcome',
    name: 'SHRED Challenge Welcome',
    subject: 'Welcome to the SHRED Challenge!',
    category: 'marketing',
    description: 'Welcome email for SHRED challenge participants',
    htmlFile: '/src/emails/shred-challenge-welcome.html',
    variables: ['firstName', 'challengeStartDate', 'facebookGroupLink'],
    tags: ['shred', 'challenge', 'program-welcome']
  },
  {
    id: 'one-time-macros-welcome',
    name: 'One-Time Macros Welcome',
    subject: 'Your Custom Macros Are Ready!',
    category: 'marketing',
    description: 'Delivery email for one-time macros calculation',
    htmlFile: '/src/emails/one-time-macros-welcome.html',
    variables: ['firstName', 'macrosData', 'downloadLink'],
    tags: ['macros', 'one-time', 'delivery']
  }
];

// Helper function to get template by ID
export const getEmailTemplate = (id: string): EmailTemplateConfig | undefined => {
  return EMAIL_TEMPLATES.find(template => template.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (category: EmailTemplateConfig['category']): EmailTemplateConfig[] => {
  return EMAIL_TEMPLATES.filter(template => template.category === category);
};

// Helper function to get templates by tag
export const getTemplatesByTag = (tag: string): EmailTemplateConfig[] => {
  return EMAIL_TEMPLATES.filter(template => template.tags.includes(tag));
}; 