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
  verification: {
    id: 'verification',
    name: 'Email Verification',
    subject: 'Verify Your JME FIT Account',
    category: 'transactional',
    description: 'Email verification for new accounts',
    variables: ['logoUrl', 'userName', 'verificationUrl'],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your JME FIT Account</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      line-height: 1.6;
      color: #1a1a1a;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: #ffffff; 
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    }
    
    .header { 
      background: #ffffff; 
      padding: 50px 30px; 
      text-align: center; 
      color: #1a1a1a;
      position: relative;
      overflow: hidden;
      border-bottom: 4px solid transparent;
      border-image: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%) 1;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(34, 211, 238, 0.05) 0%, transparent 50%);
      animation: shimmer 3s ease-in-out infinite;
    }
    
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    
    .logo-img { 
      height: 80px;
      width: auto;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .header-title {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    
    .tagline { 
      font-size: 18px; 
      font-weight: 500; 
      margin: 0;
      color: #6b7280;
      position: relative;
      z-index: 1;
    }
    
    .content { 
      padding: 50px 40px; 
      background: #ffffff;
    }
    
    .main-text { 
      font-size: 16px; 
      margin-bottom: 24px; 
      color: #4a4a4a;
      line-height: 1.7;
    }
    
    .main-text strong {
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .verify-button {
      display: inline-block;
      padding: 18px 50px;
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .verify-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(139, 92, 246, 0.4);
    }
    
    .footer {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-brand {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    
    .footer-text {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{logoUrl}}" alt="JME FIT Logo" class="logo-img">
      <div class="header-title">Verify Your Account</div>
      <div class="tagline">Almost There!</div>
    </div>
    
    <div class="content">
      <div class="main-text">
        Hi {{userName}},
      </div>
      
      <div class="main-text">
        Welcome to JME FIT! Please verify your email address to complete your account setup and start your transformation journey.
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{verificationUrl}}" class="verify-button">
          ✅ Verify Email Address
        </a>
      </div>
      
      <div class="main-text">
        If the button doesn't work, copy and paste this link into your browser:
        <br>
        <a href="{{verificationUrl}}" style="color: #8B5CF6; word-break: break-all;">{{verificationUrl}}</a>
      </div>
      
      <div class="main-text">
        If you didn't create an account with JME FIT, you can safely ignore this email.
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-brand">JME FIT Online Training</div>
      <div class="footer-text">Transform Mind & Body, Elevate Life</div>
    </div>
  </div>
</body>
</html>`
  },

  passwordReset: {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your JMEFit Password',
    category: 'transactional',
    description: 'Password reset request email',
    variables: ['logoUrl', 'resetPasswordUrl', 'privacyUrl'],
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9f9f9;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #eee;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(to right, #8b5cf6, #7c3aed);
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
      margin: 20px 0;
    }
    .alert {
      background-color: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 5px;
      padding: 10px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #888;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="JMEFit Logo" class="logo">
      <h1>Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      
      <p>We received a request to reset your password for your JMEFit account. If you didn't make this request, you can safely ignore this email.</p>
      
      <p>To reset your password, click the button below:</p>
      
      <div style="text-align: center;">
        <a href="{{resetPasswordUrl}}" class="button">Reset My Password</a>
      </div>
      
      <div class="alert">
        <p><strong>Note:</strong> This link will expire in 24 hours for security reasons.</p>
      </div>
      
      <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
      <p style="word-break: break-all; font-size: 12px;">{{resetPasswordUrl}}</p>
      
      <p>If you need any assistance, please contact our support team at <a href="mailto:support@jmefit.com">support@jmefit.com</a>.</p>
      
      <p>Best regards,</p>
      <p>The JMEFit Team</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2023 JMEFit. All rights reserved.</p>
      <p>123 Fitness Street, Workout City, WO 12345</p>
      <p>
        <a href="{{privacyUrl}}">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`
  },

  // Marketing Templates
  coldLeadWelcome: {
    id: 'cold-lead-welcome',
    name: 'Cold Lead Welcome',
    subject: 'Welcome to JME FIT! Your Fitness Journey Starts Here',
    category: 'marketing',
    description: 'Welcome email for new cold leads',
    variables: ['logoUrl', 'clientName', 'privacyUrl', 'unsubscribeUrl'],
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to JME FIT!</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      margin: 0; 
      padding: 0; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      line-height: 1.6;
      color: #1a1a1a;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: #ffffff; 
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0,0,0,0.15);
    }
    
    .header { 
      background: #ffffff; 
      padding: 50px 30px; 
      text-align: center; 
      color: #1a1a1a;
      position: relative;
      overflow: hidden;
      border-bottom: 4px solid transparent;
      border-image: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%) 1;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
                  radial-gradient(circle at 70% 70%, rgba(34, 211, 238, 0.05) 0%, transparent 50%);
      animation: shimmer 3s ease-in-out infinite;
    }
    
    @keyframes shimmer {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }
    
    .logo-img { 
      height: 80px;
      width: auto;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .header-title {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 12px;
      background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    
    .tagline { 
      font-size: 18px; 
      font-weight: 500; 
      margin: 0;
      color: #6b7280;
      position: relative;
      z-index: 1;
    }
    
    .content { 
      padding: 50px 40px; 
      background: #ffffff;
    }
    
    .greeting { 
      font-size: 24px; 
      font-weight: 700; 
      margin-bottom: 25px; 
      color: #1a1a1a;
      line-height: 1.2;
    }
    
    .main-text { 
      font-size: 16px; 
      margin-bottom: 24px; 
      color: #4a4a4a;
      line-height: 1.7;
    }
    
    .main-text strong {
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .welcome-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 16px;
      padding: 35px;
      margin: 35px 0;
      border-left: 6px solid #22D3EE;
      text-align: center;
    }
    
    .welcome-title {
      font-size: 22px;
      font-weight: 700;
      color: #0891b2;
      margin-bottom: 15px;
    }
    
    .welcome-subtitle {
      font-size: 16px;
      color: #0e7490;
      margin-bottom: 20px;
    }
    
    .tips-section {
      background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
      border-radius: 16px;
      padding: 35px;
      margin: 35px 0;
      border-left: 6px solid #8B5CF6;
    }
    
    .tips-title {
      font-size: 24px;
      font-weight: 700;
      color: #8B5CF6;
      margin-bottom: 25px;
      text-align: center;
    }
    
    .tip-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 20px;
      background: rgba(255, 255, 255, 0.7);
      padding: 20px;
      border-radius: 12px;
      transition: all 0.3s ease;
    }
    
    .tip-item:hover {
      transform: translateX(5px);
      box-shadow: 0 5px 15px rgba(139, 92, 246, 0.1);
    }
    
    .tip-number {
      background: #8B5CF6;
      color: white;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      margin-right: 20px;
      flex-shrink: 0;
    }
    
    .tip-content {
      flex: 1;
    }
    
    .tip-title {
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
      font-size: 17px;
    }
    
    .tip-description {
      color: #6b7280;
      font-size: 15px;
      line-height: 1.6;
    }
    
    .cta-section {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 16px;
      padding: 40px;
      margin: 35px 0;
      text-align: center;
      border: 2px solid #fbbf24;
    }
    
    .cta-title {
      font-size: 24px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 15px;
    }
    
    .cta-subtitle {
      font-size: 16px;
      color: #b45309;
      margin-bottom: 25px;
    }
    
    .cta-button {
      display: inline-block;
      padding: 18px 50px;
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
      transition: all 0.3s ease;
      margin: 10px;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px rgba(139, 92, 246, 0.4);
    }
    
    .secondary-cta {
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      color: #5b21b6;
      box-shadow: 0 10px 25px rgba(91, 33, 182, 0.1);
    }
    
    .secondary-cta:hover {
      box-shadow: 0 15px 35px rgba(91, 33, 182, 0.2);
    }
    
    .footer {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    
    .footer-brand {
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, #8B5CF6 0%, #22D3EE 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    
    .footer-tagline {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 20px;
      font-style: italic;
    }
    
    .footer-links {
      margin: 20px 0;
    }
    
    .footer-link {
      color: #8B5CF6;
      text-decoration: none;
      margin: 0 15px;
      font-size: 14px;
      transition: color 0.3s ease;
    }
    
    .footer-link:hover {
      color: #7C3AED;
      text-decoration: underline;
    }
    
    .footer-text {
      color: #9ca3af;
      font-size: 13px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{logoUrl}}" alt="JME FIT Logo" class="logo-img">
      <div class="header-title">Welcome to JME FIT!</div>
      <div class="tagline">Your Fitness Journey Starts Here</div>
    </div>
    
    <div class="content">
      <div class="greeting">Hello {{clientName}}!</div>
      
      <div class="main-text">
        Welcome to the JME FIT community! I'm Jaime, and I'm thrilled you've taken the first step toward transforming your health and fitness.
      </div>
      
      <div class="welcome-section">
        <div class="welcome-title">🎉 You're in Great Company!</div>
        <div class="welcome-subtitle">
          Join thousands of people who have already started their transformation journey with JME FIT
        </div>
      </div>
      
      <div class="main-text">
        Whether you're just starting out or looking to take your fitness to the next level, I want to share some valuable insights that will help you succeed on your journey.
      </div>
      
      <div class="tips-section">
        <div class="tips-title">🌟 5 Tips for Fitness Success</div>
        
        <div class="tip-item">
          <div class="tip-number">1</div>
          <div class="tip-content">
            <div class="tip-title">Start Where You Are</div>
            <div class="tip-description">
              Every fitness journey is unique. Don't compare yourself to others - focus on becoming 1% better each day.
            </div>
          </div>
        </div>
        
        <div class="tip-item">
          <div class="tip-number">2</div>
          <div class="tip-content">
            <div class="tip-title">Consistency Over Perfection</div>
            <div class="tip-description">
              Small, consistent actions lead to remarkable results. It's better to do something small every day than to aim for perfection.
            </div>
          </div>
        </div>
        
        <div class="tip-item">
          <div class="tip-number">3</div>
          <div class="tip-content">
            <div class="tip-title">Nutrition is Key</div>
            <div class="tip-description">
              You can't out-train a poor diet. Focus on nourishing your body with whole foods and proper portions.
            </div>
          </div>
        </div>
        
        <div class="tip-item">
          <div class="tip-number">4</div>
          <div class="tip-content">
            <div class="tip-title">Rest and Recovery</div>
            <div class="tip-description">
              Your body transforms during rest. Make sure to get quality sleep and take recovery days seriously.
            </div>
          </div>
        </div>
        
        <div class="tip-item">
          <div class="tip-number">5</div>
          <div class="tip-content">
            <div class="tip-title">Find Your Community</div>
            <div class="tip-description">
              Surround yourself with people who support your goals. Our JME FIT community is here to cheer you on!
            </div>
          </div>
        </div>
      </div>
      
      <div class="main-text">
        I've helped thousands of people transform their bodies and minds through my proven programs. Each one is designed to meet you where you are and take you where you want to be.
      </div>
      
      <div class="cta-section">
        <div class="cta-title">Ready to Explore?</div>
        <div class="cta-subtitle">Take a look around and see what resonates with you</div>
        
        <a href="https://jmefit.com" class="cta-button">
          🌐 Explore Website
        </a>
        
        <a href="https://jmefit.com/programs" class="cta-button secondary-cta">
          📋 View Programs
        </a>
      </div>
      
      <div class="main-text">
        <strong>{{clientName}}</strong>, I'm here to support you every step of the way. Feel free to reach out if you have any questions or just want to say hello!
      </div>
      
      <div class="main-text">
        Your fitness journey is unique to you, and I'm excited to be part of it. Take your time exploring, and remember - there's no rush. When you're ready, I'll be here to help.
      </div>
      
      <div class="main-text">
        <strong>Welcome to the family,</strong><br>
        Jaime & The JME FIT Team
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-brand">JME FIT Online Training</div>
      <div class="footer-tagline">Transform Mind & Body, Elevate Life</div>
      <div class="footer-links">
        <a href="https://jmefit.com" class="footer-link">Website</a>
        <a href="https://instagram.com/jmefit_" class="footer-link">Instagram</a>
        <a href="{{privacyUrl}}" class="footer-link">Privacy Policy</a>
        <a href="{{unsubscribeUrl}}" class="footer-link">Unsubscribe</a>
      </div>
      <div class="footer-text">
        Join thousands following the transformation journey!
      </div>
    </div>
  </div>
</body>
</html>`
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