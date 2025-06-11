import { supabase } from './supabase';
import { sendEmail } from './email';

// Email template configurations
const EMAIL_TEMPLATES = {
  hot: {
    subject: '🎯 Your Perfect JMEFit Program is Ready!',
    template: 'hot-lead-welcome',
    followUpDelay: 24 // hours
  },
  warm: {
    subject: '💪 Ready to Start Your Fitness Journey?',
    template: 'warm-lead-welcome', 
    followUpDelay: 48 // hours
  },
  cold: {
    subject: '🏃‍♀️ Transform Your Health with JMEFit',
    template: 'cold-lead-educational',
    followUpDelay: 72 // hours
  }
};

// Shared email styles for consistent branding
const JMEFIT_EMAIL_STYLES = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body { 
      font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      line-height: 1.6;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 20px; 
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
      margin-top: 40px;
      margin-bottom: 40px;
    }
    
    .header { 
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%); 
      padding: 50px 30px; 
      text-align: center; 
      color: white;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
      opacity: 0.3;
    }
    
    .logo { 
      font-size: 38px; 
      font-weight: 700; 
      margin-bottom: 8px;
      text-shadow: 0 4px 8px rgba(0,0,0,0.2);
      letter-spacing: -1px;
      position: relative;
      z-index: 1;
    }
    
    .tagline {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    
    .content { 
      padding: 50px 40px; 
    }
    
    .greeting {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 25px;
    }
    
    .main-text {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 25px;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      padding: 35px;
      border-radius: 16px;
      margin: 35px 0;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .highlight-box::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: shimmer 3s ease-in-out infinite;
    }
    
    @keyframes shimmer {
      0%, 100% { transform: rotate(0deg); }
      50% { transform: rotate(180deg); }
    }
    
    .highlight-title {
      font-size: 26px;
      font-weight: 700;
      margin-bottom: 15px;
      position: relative;
      z-index: 1;
    }
    
    .highlight-subtitle {
      font-size: 16px;
      opacity: 0.95;
      position: relative;
      z-index: 1;
    }
    
    .features-list {
      background: #f8fafc;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      border-left: 4px solid #8b5cf6;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      margin: 15px 0;
      font-size: 15px;
      color: #374151;
    }
    
    .feature-icon {
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      text-decoration: none;
      padding: 18px 35px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 25px 0;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(139, 92, 246, 0.4);
    }
    
    .program-card {
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 25px;
      margin: 25px 0;
      background: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
    }
    
    .program-card:hover {
      border-color: #8b5cf6;
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.15);
    }
    
    .program-title {
      font-size: 20px;
      font-weight: 600;
      color: #8b5cf6;
      margin-bottom: 12px;
    }
    
    .program-description {
      color: #6b7280;
      font-size: 15px;
    }
    
    .tip-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-left: 4px solid #06b6d4;
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
    }
    
    .tip-title {
      font-size: 18px;
      font-weight: 600;
      color: #0891b2;
      margin-bottom: 12px;
    }
    
    .tip-content {
      color: #0e7490;
      font-size: 15px;
    }
    
    .footer { 
      background: linear-gradient(135deg, #1f2937 0%, #374151 100%); 
      padding: 40px 30px; 
      text-align: center; 
      color: white;
    }
    
    .footer-brand {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    
    .footer-tagline {
      opacity: 0.8;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .footer-links {
      margin: 20px 0;
    }
    
    .footer-link {
      color: #a5b4fc;
      text-decoration: none;
      margin: 0 15px;
      font-size: 13px;
    }
    
    .footer-link:hover {
      color: white;
    }
    
    .footer-text {
      color: #9ca3af; 
      font-size: 12px;
      margin: 5px 0;
    }
    
    .social-icons {
      margin: 20px 0;
    }
    
    .social-icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      margin: 0 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      line-height: 40px;
      text-align: center;
      color: white;
      text-decoration: none;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    
    .social-icon:hover {
      background: #8b5cf6;
      transform: translateY(-2px);
    }
    
    .mobile-responsive {
      width: 100% !important;
      max-width: 600px !important;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 20px 10px !important;
        border-radius: 16px !important;
      }
      
      .content {
        padding: 30px 25px !important;
      }
      
      .header {
        padding: 40px 25px !important;
      }
      
      .logo {
        font-size: 32px !important;
      }
      
      .highlight-box {
        padding: 25px !important;
        margin: 25px 0 !important;
      }
      
      .highlight-title {
        font-size: 22px !important;
      }
      
      .cta-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
`;

// Email content generators with stunning styling
function generateHotLeadEmail(prospect: any): { subject: string; htmlContent: string; textContent: string } {
  const { first_name, recommended_product, icp_score } = prospect;
  
  const subject = EMAIL_TEMPLATES.hot.subject;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${JMEFIT_EMAIL_STYLES}
    </head>
    <body>
      <div class="email-container mobile-responsive">
        <div class="header">
          <div class="logo">JMEFit</div>
          <div class="tagline">Transform Your Body, Transform Your Life</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${first_name}! 🎉</div>
          
          <div class="main-text">
            This is SO exciting! Based on our conversation, I've found your perfect fitness match. 
            After analyzing your goals, experience, and preferences, the results are crystal clear...
          </div>
          
          <div class="highlight-box">
            <div class="highlight-title">✨ ${recommended_product}</div>
            <div class="highlight-subtitle">
              Perfect Match Score: <strong>${icp_score}/100</strong> 🔥
              <br>This program was literally designed for someone exactly like you!
            </div>
          </div>
          
          <div class="main-text">
            <strong>Here's why this is your perfect program:</strong>
          </div>
          
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">🎯</div>
              <div>Perfectly aligned with your ${prospect.fitness_goals?.join(' and ') || 'fitness'} goals</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div>Designed specifically for your ${prospect.experience_level || 'current'} fitness level</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">💰</div>
              <div>Fits your budget and delivers incredible value</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">⏰</div>
              <div>Works perfectly with your busy lifestyle</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🏆</div>
              <div>Proven results with hundreds of success stories</div>
            </div>
          </div>
          
          <div class="main-text">
            <strong>Ready to transform your life?</strong> As a thank you for taking our assessment, 
            I'm offering you an exclusive <strong>20% discount</strong> on your first month!
          </div>
          
          <div style="text-align: center;">
            <a href="https://jmefit.com/programs/${recommended_product.toLowerCase().replace(/\s+/g, '-')}?discount=PERFECT20" class="cta-button">
              🚀 Claim Your 20% Discount Now!
            </a>
          </div>
          
          <div class="main-text">
            Have questions? Just hit reply - I personally read every email and love helping women 
            start their transformation journey. You've got this, ${first_name}! 💪
          </div>
          
          <div class="main-text" style="margin-top: 40px;">
            <strong>Jamie</strong><br>
            <em>Founder & Head Coach, JMEFit</em><br>
            <span style="color: #8b5cf6;">Transforming lives, one workout at a time</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-brand">JMEFit</div>
          <div class="footer-tagline">Your Fitness Journey Starts Here</div>
          
          <div class="social-icons">
            <a href="https://instagram.com/jmefit" class="social-icon">📸</a>
            <a href="https://facebook.com/jmefit" class="social-icon">📘</a>
            <a href="https://tiktok.com/@jmefit" class="social-icon">🎵</a>
          </div>
          
          <div class="footer-links">
            <a href="https://jmefit.com/programs" class="footer-link">Programs</a>
            <a href="https://jmefit.com/success-stories" class="footer-link">Success Stories</a>
            <a href="https://jmefit.com/contact" class="footer-link">Contact</a>
          </div>
          
          <div class="footer-text">© 2024 JMEFit. All rights reserved.</div>
          <div class="footer-text">
            <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> | 
            <a href="https://jmefit.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
    Hi ${first_name}! 🎉
    
    This is SO exciting! Based on our conversation, I've found your perfect fitness match.
    
    ✨ ${recommended_product}
    Perfect Match Score: ${icp_score}/100 🔥
    
    Here's why this is your perfect program:
    🎯 Perfectly aligned with your fitness goals
    📊 Designed for your experience level  
    💰 Fits your budget and delivers incredible value
    ⏰ Works perfectly with your busy lifestyle
    🏆 Proven results with hundreds of success stories
    
    Ready to transform your life? As a thank you for taking our assessment, I'm offering you an exclusive 20% discount on your first month!
    
    Claim your discount: https://jmefit.com/programs/${recommended_product.toLowerCase().replace(/\s+/g, '-')}?discount=PERFECT20
    
    Have questions? Just hit reply - I personally read every email and love helping women start their transformation journey. You've got this!
    
    Jamie
    Founder & Head Coach, JMEFit
    Transforming lives, one workout at a time
  `;
  
  return { subject, htmlContent, textContent };
}

function generateWarmLeadEmail(prospect: any): { subject: string; htmlContent: string; textContent: string } {
  const { first_name, recommended_product, experience_level } = prospect;
  
  const subject = EMAIL_TEMPLATES.warm.subject;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${JMEFIT_EMAIL_STYLES}
    </head>
    <body>
      <div class="email-container mobile-responsive">
        <div class="header">
          <div class="logo">JMEFit</div>
          <div class="tagline">Your Fitness Journey Starts Here</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hey ${first_name}! 👋</div>
          
          <div class="main-text">
            I've been thinking about our chat, and I'm genuinely excited about helping you reach your fitness goals! 
            As someone at the ${experience_level || 'current'} level, you're in the perfect position to see amazing results.
          </div>
          
          <div class="program-card">
            <div class="program-title">🎯 Perfect for You: ${recommended_product}</div>
            <div class="program-description">
              This program is specifically designed to build confidence, create sustainable habits, 
              and deliver real results without feeling overwhelming. You'll love how it fits into your life!
            </div>
          </div>
          
          <div class="main-text">
            <strong>What makes JMEFit different from everything else you've tried:</strong>
          </div>
          
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">✅</div>
              <div><strong>No guesswork</strong> - Every workout and meal planned for you</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📱</div>
              <div><strong>Everything on your phone</strong> - Work out anywhere, anytime</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">🤝</div>
              <div><strong>Amazing community</strong> - Connect with like-minded women</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div><strong>Track your wins</strong> - See your progress and celebrate every milestone</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">💕</div>
              <div><strong>Feel supported</strong> - Never feel alone on your journey</div>
            </div>
          </div>
          
          <div class="tip-box">
            <div class="tip-title">💡 Perfect Timing!</div>
            <div class="tip-content">
              Want to see if this is right for you? I'd love to offer you a <strong>FREE 7-day trial</strong> 
              to experience everything risk-free. No commitment, no pressure - just pure transformation!
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://jmefit.com/free-trial?utm_source=email&utm_campaign=warm_lead" class="cta-button">
              🎁 Start Your FREE 7-Day Trial
            </a>
          </div>
          
          <div class="main-text">
            I believe in you, ${first_name}! Every woman who's transformed her life with JMEFit started 
            exactly where you are right now. The only difference? They took that first step. 
          </div>
          
          <div class="main-text">
            Ready to surprise yourself with what you're capable of? 😊
          </div>
          
          <div class="main-text" style="margin-top: 40px;">
            <strong>Cheering you on,</strong><br>
            <strong>Jamie</strong><br>
            <em>Founder & Head Coach, JMEFit</em>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-brand">JMEFit</div>
          <div class="footer-tagline">Stronger Together</div>
          
          <div class="social-icons">
            <a href="https://instagram.com/jmefit" class="social-icon">📸</a>
            <a href="https://facebook.com/jmefit" class="social-icon">📘</a>
            <a href="https://tiktok.com/@jmefit" class="social-icon">🎵</a>
          </div>
          
          <div class="footer-links">
            <a href="https://jmefit.com/success-stories" class="footer-link">Success Stories</a>
            <a href="https://jmefit.com/community" class="footer-link">Community</a>
            <a href="https://jmefit.com/about" class="footer-link">About Jamie</a>
          </div>
          
          <div class="footer-text">© 2024 JMEFit. All rights reserved.</div>
          <div class="footer-text">
            <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> | 
            <a href="https://jmefit.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
    Hey ${first_name}! 👋
    
    I've been thinking about our chat, and I'm genuinely excited about helping you reach your fitness goals! As someone at the ${experience_level || 'current'} level, you're in the perfect position to see amazing results.
    
    🎯 Perfect for You: ${recommended_product}
    
    This program is specifically designed to build confidence, create sustainable habits, and deliver real results without feeling overwhelmed.
    
    What makes JMEFit different:
    ✅ No guesswork - Every workout and meal planned for you
    📱 Everything on your phone - Work out anywhere, anytime
    🤝 Amazing community - Connect with like-minded women
    📊 Track your wins - See your progress and celebrate
    💕 Feel supported - Never feel alone on your journey
    
    💡 Perfect Timing!
    Want to see if this is right for you? I'd love to offer you a FREE 7-day trial to experience everything risk-free. No commitment, no pressure!
    
    Start your free trial: https://jmefit.com/free-trial?utm_source=email&utm_campaign=warm_lead
    
    I believe in you! Every woman who's transformed her life with JMEFit started exactly where you are right now. Ready to surprise yourself with what you're capable of?
    
    Cheering you on,
    Jamie
    Founder & Head Coach, JMEFit
  `;
  
  return { subject, htmlContent, textContent };
}

function generateColdLeadEmail(prospect: any): { subject: string; htmlContent: string; textContent: string } {
  const { first_name } = prospect;
  
  const subject = EMAIL_TEMPLATES.cold.subject;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      ${JMEFIT_EMAIL_STYLES}
    </head>
    <body>
      <div class="email-container mobile-responsive">
        <div class="header">
          <div class="logo">JMEFit</div>
          <div class="tagline">Small Steps, Big Transformations</div>
        </div>
        
        <div class="content">
          <div class="greeting">Hi ${first_name} 💕</div>
          
          <div class="main-text">
            I wanted to share something with you that I hear from almost every woman I work with...
          </div>
          
          <div class="main-text" style="font-style: italic; font-size: 18px; color: #6b7280; text-align: center; padding: 20px 0;">
            "I know I should be taking better care of myself, but I just don't know where to start."
          </div>
          
          <div class="main-text">
            Does that sound familiar? If it does, I want you to know - you're not alone, and it's 
            not your fault. The fitness industry has made everything seem so complicated and overwhelming!
          </div>
          
          <div class="tip-box">
            <div class="tip-title">💡 Here's what I've learned after helping 1000+ women:</div>
            <div class="tip-content">
              The women who see the most dramatic changes don't overhaul their entire lives overnight. 
              They make small, consistent changes that compound into life-changing results. You don't 
              need to be perfect - you just need to start.
            </div>
          </div>
          
          <div class="main-text">
            <strong>This week, I'm sharing my top 3 simple strategies that any busy woman can implement:</strong>
          </div>
          
          <div class="features-list">
            <div class="feature-item">
              <div class="feature-icon">1</div>
              <div><strong>The 10-Minute Morning Rule</strong> - How to jumpstart your metabolism before your first coffee ☕</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">2</div>
              <div><strong>Smart Snacking Secrets</strong> - 5 protein-rich snacks that actually keep you satisfied 🥜</div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">3</div>
              <div><strong>Evening Wind-Down Routine</strong> - A simple 5-minute routine that improves sleep AND recovery 🌙</div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="https://jmefit.com/free-guide?utm_source=email&utm_campaign=cold_lead" class="cta-button">
              📚 Get Your Free Guide
            </a>
          </div>
          
          <div class="main-text">
            These aren't complicated fitness hacks or extreme diet changes. They're simple, proven 
            strategies that work for real women with real lives (kids, jobs, responsibilities - I get it!).
          </div>
          
          <div class="main-text" style="text-align: center; font-style: italic; color: #8b5cf6; font-size: 18px; padding: 20px 0;">
            "Sometimes the smallest step forward is the most important one." 
          </div>
          
          <div class="main-text">
            Your health and happiness matter, ${first_name}. You deserve to feel strong, confident, 
            and energized in your own body. 
          </div>
          
          <div class="main-text" style="margin-top: 40px;">
            <strong>Here if you need me,</strong><br>
            <strong>Jamie</strong><br>
            <em>Founder & Head Coach, JMEFit</em><br>
            <span style="color: #8b5cf6;">P.S. - Hit reply and tell me which strategy you're most excited to try! I read every email 💜</span>
          </div>
        </div>
        
        <div class="footer">
          <div class="footer-brand">JMEFit</div>
          <div class="footer-tagline">Every Journey Begins With A Single Step</div>
          
          <div class="social-icons">
            <a href="https://instagram.com/jmefit" class="social-icon">📸</a>
            <a href="https://facebook.com/jmefit" class="social-icon">📘</a>
            <a href="https://tiktok.com/@jmefit" class="social-icon">🎵</a>
          </div>
          
          <div class="footer-links">
            <a href="https://jmefit.com/blog" class="footer-link">Free Resources</a>
            <a href="https://jmefit.com/recipes" class="footer-link">Healthy Recipes</a>
            <a href="https://jmefit.com/tips" class="footer-link">Fitness Tips</a>
          </div>
          
          <div class="footer-text">© 2024 JMEFit. All rights reserved.</div>
          <div class="footer-text">
            <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> | 
            <a href="https://jmefit.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textContent = `
    Hi ${first_name} 💕
    
    I wanted to share something with you that I hear from almost every woman I work with...
    
    "I know I should be taking better care of myself, but I just don't know where to start."
    
    Does that sound familiar? If it does, you're not alone, and it's not your fault. The fitness industry has made everything seem so complicated!
    
    💡 Here's what I've learned after helping 1000+ women:
    
    The women who see the most dramatic changes don't overhaul their entire lives overnight. They make small, consistent changes that compound into life-changing results.
    
    This week, I'm sharing my top 3 simple strategies:
    
    1. The 10-Minute Morning Rule - Jumpstart your metabolism before coffee
    2. Smart Snacking Secrets - 5 protein-rich snacks that keep you satisfied  
    3. Evening Wind-Down Routine - Simple routine for better sleep & recovery
    
    Get your free guide: https://jmefit.com/free-guide?utm_source=email&utm_campaign=cold_lead
    
    These aren't complicated fitness hacks. They're simple, proven strategies that work for real women with real lives.
    
    "Sometimes the smallest step forward is the most important one."
    
    Your health and happiness matter. You deserve to feel strong, confident, and energized.
    
    Here if you need me,
    Jamie
    Founder & Head Coach, JMEFit
    
    P.S. - Hit reply and tell me which strategy you're most excited to try! I read every email 💜
  `;
  
  return { subject, htmlContent, textContent };
}

// Main email automation function
export async function sendLeadEmail(prospect: any): Promise<void> {
  try {
    const { segment, email, first_name } = prospect;
    
    console.log(`📧 Sending ${segment} lead email to ${email}`);
    
    // Generate appropriate email content based on segment
    let emailContent;
    switch (segment) {
      case 'hot':
        emailContent = generateHotLeadEmail(prospect);
        break;
      case 'warm':
        emailContent = generateWarmLeadEmail(prospect);
        break;
      case 'cold':
        emailContent = generateColdLeadEmail(prospect);
        break;
      default:
        emailContent = generateWarmLeadEmail(prospect); // fallback
    }
    
    // Send the email
    const emailResult = await sendEmail({
      to: email,
      subject: emailContent.subject,
      htmlContent: emailContent.htmlContent,
      textContent: emailContent.textContent
    });
    
    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send email');
    }
    
    // Schedule follow-up email in email_sequences table
    const followUpHours = EMAIL_TEMPLATES[segment as keyof typeof EMAIL_TEMPLATES].followUpDelay;
    const scheduledFor = new Date(Date.now() + followUpHours * 60 * 60 * 1000);
    
    await supabase
      .from('email_sequences')
      .insert({
        prospect_email: email,
        sequence_type: segment,
        email_number: 1,
        scheduled_for: scheduledFor.toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    
    console.log(`✅ ${segment} lead email sent successfully to ${email}`);
    
  } catch (error) {
    console.error('❌ Email automation error:', error);
    throw error;
  }
}

// Function to send follow-up emails (can be called by a cron job)
export async function processEmailSequences(): Promise<void> {
  try {
    console.log('🔄 Processing scheduled email sequences...');
    
    // Get emails scheduled to be sent
    const { data: sequences, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);
    
    if (error) {
      console.error('Error fetching email sequences:', error);
      return;
    }
    
    if (!sequences || sequences.length === 0) {
      console.log('No emails scheduled for sending');
      return;
    }
    
    console.log(`Found ${sequences.length} emails to send`);
    
    for (const sequence of sequences) {
      try {
        // Get prospect details
        const { data: prospect } = await supabase
          .from('prospects')
          .select('*')
          .eq('email', sequence.prospect_email)
          .single();
        
        if (!prospect) continue;
        
        // Send follow-up email based on sequence type and number
        await sendFollowUpEmail(prospect, sequence);
        
        // Mark as sent
        await supabase
          .from('email_sequences')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', sequence.id);
        
      } catch (error) {
        console.error(`Failed to send sequence ${sequence.id}:`, error);
        
        // Mark as failed
        await supabase
          .from('email_sequences')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', sequence.id);
      }
    }
    
    console.log('✅ Email sequence processing complete');
    
  } catch (error) {
    console.error('❌ Email sequence processing error:', error);
  }
}

// Helper function for follow-up emails
async function sendFollowUpEmail(prospect: any, sequence: any): Promise<void> {
  // This would contain follow-up email templates
  // For now, we'll just log it
  console.log(`📧 Sending follow-up email ${sequence.email_number} to ${prospect.email}`);
  
  // You can implement different follow-up emails based on:
  // - sequence.sequence_type (hot/warm/cold)
  // - sequence.email_number (1, 2, 3, etc.)
  // - prospect engagement history
} 