// Email template loader - reads HTML templates and makes them available to the system
import welcomeHtml from '../emails/welcome.html?raw';
import passwordResetHtml from '../emails/password-reset.html?raw';
import verificationHtml from '../emails/verification.html?raw';
import subscriptionConfirmationHtml from '../emails/subscription-confirmation.html?raw';
import thankYouHtml from '../emails/thank-you.html?raw';
import coldLeadWelcomeHtml from '../emails/cold-lead-welcome.html?raw';
import warmLeadWelcomeHtml from '../emails/warm-lead-welcome.html?raw';
import hotLeadWelcomeHtml from '../emails/hot-lead-welcome.html?raw';
import oneTimeMacrosWelcomeHtml from '../emails/one-time-macros-welcome.html?raw';
import selfLedTrainingWelcomeHtml from '../emails/self-led-training-welcome.html?raw';
import shredChallengeWelcomeHtml from '../emails/shred-challenge-welcome.html?raw';
import nutritionProgramsWelcomeHtml from '../emails/nutrition-programs-welcome.html?raw';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'transactional' | 'marketing' | 'program' | 'notification';
  html: string;
  variables: string[];
  description?: string;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  // Transactional Templates
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to JMEFit!',
    category: 'transactional',
    description: 'Welcome new users to JMEFit',
    variables: ['logoUrl', 'fullName', 'dashboardUrl', 'unsubscribeUrl', 'privacyUrl'],
    html: welcomeHtml
  },
  
  'password-reset': {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your JMEFit Password',
    category: 'transactional',
    description: 'Password reset request email',
    variables: ['logoUrl', 'resetPasswordUrl', 'privacyUrl'],
    html: passwordResetHtml
  },
  
  verification: {
    id: 'verification',
    name: 'Email Verification',
    subject: 'Verify Your JME FIT Account',
    category: 'transactional',
    description: 'Email verification for new accounts',
    variables: ['logoUrl', 'userName', 'verificationUrl'],
    html: verificationHtml
  },
  
  'subscription-confirmation': {
    id: 'subscription-confirmation',
    name: 'Subscription Confirmation',
    subject: 'Your JMEFit Subscription is Active!',
    category: 'transactional',
    description: 'Confirm subscription activation',
    variables: ['logoUrl', 'fullName', 'planName', 'billingCycle', 'amount', 'nextBillingDate', 'dashboardUrl', 'unsubscribeUrl', 'privacyUrl'],
    html: subscriptionConfirmationHtml
  },
  
  'thank-you': {
    id: 'thank-you',
    name: 'Thank You',
    subject: 'Thank You for Your Purchase!',
    category: 'transactional',
    description: 'Thank you for purchase',
    variables: ['logoUrl', 'fullName', 'orderNumber', 'items', 'shipping', 'total', 'orderTrackingUrl', 'unsubscribeUrl', 'privacyUrl'],
    html: thankYouHtml
  },
  
  // Marketing Templates
  'cold-lead-welcome': {
    id: 'cold-lead-welcome',
    name: 'Cold Lead Welcome',
    subject: 'Welcome to JME FIT! Your Fitness Journey Starts Here',
    category: 'marketing',
    description: 'Welcome email for new cold leads',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: coldLeadWelcomeHtml
  },
  
  'warm-lead-welcome': {
    id: 'warm-lead-welcome',
    name: 'Warm Lead Welcome',
    subject: '🌟 Ready to Take the Next Step with JME FIT?',
    category: 'marketing',
    description: 'Welcome email for warm leads with discount',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: warmLeadWelcomeHtml
  },
  
  'hot-lead-welcome': {
    id: 'hot-lead-welcome',
    name: 'Hot Lead Welcome',
    subject: '🔥 Your Perfect JME FIT Program is Ready!',
    category: 'marketing',
    description: 'Urgent welcome email for hot leads',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: hotLeadWelcomeHtml
  },
  
  // Program Welcome Templates
  'one-time-macros-welcome': {
    id: 'one-time-macros-welcome',
    name: 'One-Time Macros Welcome',
    subject: 'Your Custom Macros Are Ready! - JME FIT',
    category: 'program',
    description: 'Welcome email for macro calculation clients',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: oneTimeMacrosWelcomeHtml
  },
  
  'self-led-training-welcome': {
    id: 'self-led-training-welcome',
    name: 'Self-Led Training Welcome',
    subject: 'Welcome to JME FIT - Monthly App Access',
    category: 'program',
    description: 'Welcome email for self-led training program',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: selfLedTrainingWelcomeHtml
  },
  
  'shred-challenge-welcome': {
    id: 'shred-challenge-welcome',
    name: 'SHRED Challenge Welcome',
    subject: '🔥 Welcome to the SHRED Challenge! - JME FIT',
    category: 'program',
    description: 'Welcome email for SHRED challenge participants',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: shredChallengeWelcomeHtml
  },
  
  'nutrition-programs-welcome': {
    id: 'nutrition-programs-welcome',
    name: 'Nutrition Programs Welcome',
    subject: 'Welcome to JME FIT Nutrition!',
    category: 'program',
    description: 'Welcome email for nutrition program clients',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: nutritionProgramsWelcomeHtml
  }
};

// Helper functions
export const getEmailTemplatesList = () => Object.values(emailTemplates);
export const getEmailTemplateById = (id: string) => emailTemplates[id];
export const getTemplatesByCategory = (category: EmailTemplate['category']) => 
  Object.values(emailTemplates).filter(t => t.category === category);

// Replace variables in template
export function replaceTemplateVariables(html: string, variables: Record<string, string>): string {
  let processedHtml = html;
  
  // Set default values
  const defaults = {
    logoUrl: 'https://jmefit.com/JME_fit_black_purple.png',
    privacyUrl: 'https://jmefit.com/privacy',
    unsubscribeUrl: 'https://jmefit.com/unsubscribe',
    dashboardUrl: 'https://jmefit.com/dashboard',
    ...variables
  };
  
  // Replace all variables
  Object.entries(defaults).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedHtml = processedHtml.replace(regex, value || '');
  });
  
  return processedHtml;
} 