// Import all template HTML content
import { welcomeHtml } from './welcome';
import { passwordResetHtml } from './passwordReset';
import { verificationHtml } from './verification';
import { subscriptionConfirmationHtml } from './subscriptionConfirmation';
import { thankYouHtml } from './thankYou';
import { coldLeadWelcomeHtml } from './coldLeadWelcome';
import { warmLeadWelcomeHtml } from './warmLeadWelcome';
import { hotLeadWelcomeHtml } from './hotLeadWelcome';
import { oneTimeMacrosWelcomeHtml } from './oneTimeMacrosWelcome';
import { selfLedTrainingWelcomeHtml } from './selfLedTraining';
import { shredChallengeWelcomeHtml } from './shredChallenge';
import { nutritionProgramsWelcomeHtml } from './nutritionPrograms';

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
  
  passwordReset: {
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
  
  subscriptionConfirmation: {
    id: 'subscription-confirmation',
    name: 'Subscription Confirmation',
    subject: 'Your JMEFit Subscription is Active!',
    category: 'transactional',
    description: 'Confirm subscription activation',
    variables: ['logoUrl', 'fullName', 'planName', 'billingCycle', 'amount', 'nextBillingDate', 'dashboardUrl', 'unsubscribeUrl', 'privacyUrl'],
    html: subscriptionConfirmationHtml
  },
  
  thankYou: {
    id: 'thank-you',
    name: 'Thank You',
    subject: 'Thank You for Your Purchase!',
    category: 'transactional',
    description: 'Thank you for purchase',
    variables: ['logoUrl', 'fullName', 'orderNumber', 'items', 'shipping', 'total', 'orderTrackingUrl', 'unsubscribeUrl', 'privacyUrl'],
    html: thankYouHtml
  },
  
  // Marketing Templates
  coldLeadWelcome: {
    id: 'cold-lead-welcome',
    name: 'Cold Lead Welcome',
    subject: 'Welcome to JME FIT! Your Fitness Journey Starts Here',
    category: 'marketing',
    description: 'Welcome email for new cold leads',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: coldLeadWelcomeHtml
  },
  
  warmLeadWelcome: {
    id: 'warm-lead-welcome',
    name: 'Warm Lead Welcome',
    subject: '🌟 Ready to Take the Next Step with JME FIT?',
    category: 'marketing',
    description: 'Welcome email for warm leads with discount',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: warmLeadWelcomeHtml
  },
  
  hotLeadWelcome: {
    id: 'hot-lead-welcome',
    name: 'Hot Lead Welcome',
    subject: '🔥 Your Perfect JME FIT Program is Ready!',
    category: 'marketing',
    description: 'Urgent welcome email for hot leads',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: hotLeadWelcomeHtml
  },
  
  // Program Welcome Templates
  oneTimeMacrosWelcome: {
    id: 'one-time-macros-welcome',
    name: 'One-Time Macros Welcome',
    subject: 'Your Custom Macros Are Ready! - JME FIT',
    category: 'program',
    description: 'Welcome email for macro calculation clients',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: oneTimeMacrosWelcomeHtml
  },
  
  selfLedTrainingWelcome: {
    id: 'self-led-training-welcome',
    name: 'Self-Led Training Welcome',
    subject: 'Welcome to JME FIT - Monthly App Access',
    category: 'program',
    description: 'Welcome email for self-led training program',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: selfLedTrainingWelcomeHtml
  },
  
  shredChallengeWelcome: {
    id: 'shred-challenge-welcome',
    name: 'SHRED Challenge Welcome',
    subject: '🔥 Welcome to the SHRED Challenge! - JME FIT',
    category: 'program',
    description: 'Welcome email for SHRED challenge participants',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: shredChallengeWelcomeHtml
  },
  
  nutritionProgramsWelcome: {
    id: 'nutrition-programs-welcome',
    name: 'Nutrition Programs Welcome',
    subject: 'Welcome to JME FIT Nutrition!',
    category: 'program',
    description: 'Welcome email for nutrition program clients',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: nutritionProgramsWelcomeHtml
  }
};

// Export function to get all templates as array
export const getEmailTemplatesList = () => Object.values(emailTemplates);

// Export function to get template by ID
export const getEmailTemplateById = (id: string) => emailTemplates[id];

// Export categories
export const emailCategories = {
  transactional: 'Transactional',
  marketing: 'Marketing',
  program: 'Program Welcome',
  notification: 'Notification'
}; 