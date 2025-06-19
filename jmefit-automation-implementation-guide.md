# JMEFIT Marketing Automation Implementation Guide

## **System Overview**

This marketing automation system creates a sophisticated, multi-path lead nurturing experience that:
- ✅ Captures leads from multiple sources with progressive profiling
- ✅ Scores prospects using AI-driven ICP analysis including social media data
- ✅ Delivers hyper-personalized email sequences based on behavior and goals
- ✅ Automatically routes leads to optimal products based on likelihood to convert
- ✅ Tracks engagement and optimizes conversion paths in real-time

## **Phase 1: Infrastructure Setup**

### **1.1 Database Schema Implementation**
```bash
# Run this in your Supabase SQL editor
psql -h db.jjmaxsmlrcizxfgucvzx.supabase.co -p 5432 -d postgres -f jmefit-automation-database-schema.sql
```

### **1.2 n8n Installation & Configuration**
```bash
# Install n8n (if not already installed)
npm install n8n -g

# Start n8n with custom configurations
n8n start --tunnel
```

### **1.3 Required Integrations**
- **Supabase:** Database connections for prospect management
- **SMTP:** Email delivery (recommend SendGrid or Mailgun)
- **Instagram/Facebook APIs:** Social media data collection
- **Stripe:** Customer and subscription data sync
- **Google Analytics:** Website behavior tracking

## **Phase 2: Lead Capture Implementation**

### **2.1 Quiz Creation**
Create an interactive quiz at `/quiz` with these questions:

```javascript
// Quiz Questions for ICP Scoring
const quizQuestions = [
  {
    id: 'goals',
    question: 'What are your primary fitness goals? (Select all that apply)',
    type: 'multiple',
    options: [
      { value: 'weight_loss', label: 'Lose weight', weight: 20 },
      { value: 'muscle_building', label: 'Build muscle', weight: 15 },
      { value: 'nutrition_guidance', label: 'Learn proper nutrition', weight: 15 },
      { value: 'general_fitness', label: 'Get in better shape', weight: 8 }
    ]
  },
  {
    id: 'experience',
    question: 'How would you describe your fitness experience?',
    type: 'single',
    options: [
      { value: 'complete_beginner', label: 'Complete beginner', weight: 12 },
      { value: 'beginner', label: 'Beginner (some experience)', weight: 15 },
      { value: 'intermediate', label: 'Intermediate', weight: 10 },
      { value: 'advanced', label: 'Advanced', weight: 5 }
    ]
  },
  {
    id: 'age',
    question: 'What\'s your age range?',
    type: 'single',
    options: [
      { value: '18-24', label: '18-24', weight: 5 },
      { value: '25-29', label: '25-29', weight: 15 },
      { value: '30-39', label: '30-39', weight: 25 },
      { value: '40-49', label: '40-49', weight: 20 },
      { value: '50+', label: '50+', weight: 10 }
    ]
  },
  {
    id: 'budget',
    question: 'What\'s your monthly budget for fitness/nutrition coaching?',
    type: 'single',
    options: [
      { value: 'under_25', label: 'Under $25', weight: 0 },
      { value: '25_50', label: '$25-$50', weight: 5 },
      { value: '50_100', label: '$50-$100', weight: 10 },
      { value: '100_200', label: '$100-$200', weight: 15 },
      { value: 'over_200', label: '$200+', weight: 20 }
    ]
  }
];
```

### **2.2 Lead Capture Form Integration**
```javascript
// Lead capture webhook payload
const leadCapturePayload = {
  email: 'prospect@example.com',
  first_name: 'Sarah',
  last_name: 'Johnson',
  source: 'quiz', // 'quiz', 'website_form', 'social_media'
  utm_source: 'google',
  utm_campaign: 'fitness_quiz',
  quiz_results: {
    goals: ['weight_loss', 'muscle_building'],
    experience: 'beginner',
    age: '30-39',
    budget: '100_200'
  },
  social_login_data: {
    provider: 'google',
    profile_picture: 'url',
    // Additional OAuth data
  }
};
```

## **Phase 3: n8n Workflow Configuration**

### **3.1 Import Workflow**
1. Open n8n dashboard
2. Click "Import from URL or file"
3. Upload `jmefit-n8n-automation.json`
4. Configure credentials for each service

### **3.2 Webhook Endpoints**
```
Primary Lead Capture: https://your-n8n-instance.com/webhook/lead-capture
Quiz Completion: https://your-n8n-instance.com/webhook/quiz-complete
Email Tracking: https://your-n8n-instance.com/webhook/email-track
Social Auth: https://your-n8n-instance.com/webhook/social-auth
```

### **3.3 Email Templates Configuration**
```html
<!-- Hot Lead Email Template -->
<template id="hot-lead-welcome">
  <div class="jmefit-email">
    <h1>Welcome {{first_name}}! Your Transformation Starts Now 🎯</h1>
    <p>Based on your goals: {{goals_formatted}}</p>
    
    <!-- Dynamic content based on ICP score -->
    {{#if icp_score >= 70}}
    <div class="premium-offer">
      <h2>🎯 Your Personalized Transformation Bundle</h2>
      <ul>
        <li>✅ Custom Macro Calculation (Worth $99) - FREE</li>
        <li>✅ 7-Day Meal Planning Template</li>
        <li>✅ Beginner-Friendly Workout Video Series</li>
        <li>✅ Private Access to Success Community</li>
      </ul>
      <a href="{{landing_page_url}}" class="cta-btn">Get My Free Bundle →</a>
    </div>
    {{/if}}
  </div>
</template>
```

## **Phase 4: Social Media Integration**

### **4.1 Instagram Data Collection**
```javascript
// Instagram API integration for ICP scoring
const instagramDataCollection = {
  async getProfileData(userId) {
    const response = await fetch(`https://graph.instagram.com/${userId}?fields=account_type,media_count,followers_count,follows_count&access_token=${accessToken}`);
    return response.json();
  },
  
  async analyzeContent(userId) {
    const media = await fetch(`https://graph.instagram.com/${userId}/media?fields=caption,media_type,like_count,comments_count&access_token=${accessToken}`);
    
    // Analyze for fitness content
    const fitnessKeywords = ['workout', 'fitness', 'gym', 'nutrition', 'health', 'diet', 'exercise'];
    let fitnessPostCount = 0;
    
    media.data.forEach(post => {
      if (fitnessKeywords.some(keyword => 
        post.caption?.toLowerCase().includes(keyword)
      )) {
        fitnessPostCount++;
      }
    });
    
    return { fitnessPostCount, totalPosts: media.data.length };
  }
};
```

### **4.2 Facebook Integration**
```javascript
// Facebook profile analysis for ICP scoring
const facebookIntegration = {
  interests: ['fitness', 'nutrition', 'wellness', 'weight loss'],
  demographics: ['age_range', 'gender', 'location'],
  behavior: ['page_likes', 'group_memberships', 'recent_activity']
};
```

## **Phase 5: Email Sequence Content**

### **5.1 Hot Lead Sequence (High ICP Score)**
```
Email 1 (Immediate): Welcome + Free Transformation Bundle
Email 2 (+2 hours): Social Proof + Success Stories
Email 3 (+1 day): Limited-Time Consultation Offer
Email 4 (+3 days): Objection Handling + FAQ
Email 5 (+7 days): Final Call-to-Action + Urgency
```

### **5.2 Warm Lead Sequence (Medium ICP Score)**
```
Email 1 (Immediate): Welcome + Quiz Results
Email 2 (+1 day): Free Workout Sample
Email 3 (+3 days): Nutrition Tips + Self-Led Training Intro
Email 4 (+7 days): Community Invitation
Email 5 (+14 days): Special Offer for Paid Program
```

### **5.3 Cold Lead Sequence (Low ICP Score)**
```
Email 1 (Immediate): Welcome + Free Resources
Email 2 (+3 days): Educational Content
Email 3 (+7 days): Success Story + Case Study
Email 4 (+14 days): Free Tool (Macro Calculator)
Email 5 (+30 days): Low-Barrier Offer ($99 Macros)
```

## **Phase 6: Behavioral Triggers & Automation**

### **6.1 Advanced Trigger Setup**
```javascript
// Behavioral trigger examples
const behavioralTriggers = {
  emailEngagement: {
    highEngagement: 'open_rate > 0.5 AND click_rate > 0.2',
    lowEngagement: 'open_rate < 0.2 OR no_opens_7_days',
    action: 'adjust_sequence_or_re_engage'
  },
  
  websiteBehavior: {
    pricingPageVisit: 'visited /programs within 24h',
    cartAbandonment: 'added_to_cart AND not_purchased_2h',
    programComparison: 'multiple_program_page_views'
  },
  
  socialMediaActivity: {
    increasedFitnessContent: 'fitness_posts_increased',
    mentionedWeightLoss: 'recent_posts_contain_weight_loss_keywords'
  }
};
```

### **6.2 Dynamic Sequence Adjustments**
```javascript
// n8n code node for dynamic sequence modification
const adjustSequence = (prospect, behavior) => {
  if (behavior.type === 'high_email_engagement' && prospect.segment === 'warm') {
    // Promote to hot lead sequence
    return {
      newSequence: 'hot_lead',
      skipToStep: 2,
      reason: 'elevated_engagement'
    };
  }
  
  if (behavior.type === 'pricing_page_visit' && prospect.daysInSequence > 3) {
    // Send immediate pricing email
    return {
      action: 'send_immediate_email',
      template: 'pricing_focused',
      reason: 'pricing_interest_detected'
    };
  }
  
  return { action: 'continue_sequence' };
};
```

## **Phase 7: Advanced Analytics & Optimization**

### **7.1 A/B Testing Framework**
```sql
-- A/B test tracking table
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name TEXT NOT NULL,
    variant_a_count INTEGER DEFAULT 0,
    variant_b_count INTEGER DEFAULT 0,
    variant_a_conversions INTEGER DEFAULT 0,
    variant_b_conversions INTEGER DEFAULT 0,
    statistical_significance DECIMAL(5,2),
    winner TEXT,
    active BOOLEAN DEFAULT true
);
```

### **7.2 Performance Monitoring Queries**
```sql
-- Segment performance analysis
SELECT 
    segment,
    COUNT(*) as total_prospects,
    AVG(icp_score) as avg_score,
    COUNT(CASE WHEN conversion_status = 'customer' THEN 1 END) as conversions,
    AVG(total_spent) as avg_revenue,
    AVG(EXTRACT(days FROM first_purchase_date - created_at)) as avg_days_to_convert
FROM prospects 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY segment;

-- Email sequence effectiveness
SELECT 
    sequence_type,
    email_number,
    ROUND(AVG(CASE WHEN opened_at IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 2) as open_rate,
    ROUND(AVG(CASE WHEN clicked_at IS NOT NULL THEN 1.0 ELSE 0.0 END) * 100, 2) as click_rate,
    COUNT(*) as total_sent
FROM email_sequences 
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY sequence_type, email_number
ORDER BY sequence_type, email_number;
```

## **Phase 8: Integration with Existing JMEFIT Systems**

### **8.1 Supabase Integration**
```javascript
// Sync prospects with existing user system
const syncWithSupabase = async (prospectData) => {
  const { data, error } = await supabase
    .from('prospects')
    .upsert({
      ...prospectData,
      updated_at: new Date().toISOString()
    }, { 
      onConflict: 'email',
      returning: 'representation' 
    });
    
  if (!error && prospectData.conversion_status === 'customer') {
    // Sync with existing users table
    await supabase.from('users').upsert({
      email: prospectData.email,
      first_name: prospectData.first_name,
      last_name: prospectData.last_name,
      stripe_customer_id: prospectData.stripe_customer_id
    });
  }
};
```

### **8.2 Stripe Integration**
```javascript
// Sync conversion data from Stripe
const stripeWebhookHandler = async (event) => {
  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    await supabase
      .from('prospects')
      .update({
        conversion_status: 'customer',
        first_purchase_date: new Date().toISOString(),
        first_purchase_product: subscription.items.data[0].price.id
      })
      .eq('email', customer.email);
  }
};
```

## **Phase 9: Testing & Launch Strategy**

### **9.1 Testing Checklist**
- [ ] Database schema deployed and tested
- [ ] n8n workflow imported and credentials configured
- [ ] Webhook endpoints responding correctly
- [ ] Email templates rendering properly
- [ ] ICP scoring algorithm validated with test data
- [ ] Social media integrations working
- [ ] Analytics and tracking functional

### **9.2 Soft Launch Plan**
1. **Week 1:** Deploy to 10% of new leads
2. **Week 2:** Monitor performance metrics and optimize
3. **Week 3:** Scale to 50% of new leads
4. **Week 4:** Full deployment with ongoing optimization

### **9.3 Success Metrics**
- **Lead Qualification:** >60% of leads properly scored and segmented
- **Email Performance:** >25% open rates, >5% click rates
- **Conversion Rates:** 15%+ for hot leads, 8%+ for warm leads
- **Revenue Impact:** 25%+ increase in customer acquisition

## **Phase 10: Ongoing Optimization**

### **10.1 Monthly Review Process**
1. Analyze segment performance and adjust ICP scoring
2. A/B test email subject lines and content
3. Review behavioral triggers and optimize timing
4. Update social media integration algorithms
5. Refine product recommendations based on conversion data

### **10.2 Quarterly Enhancements**
1. Add new lead magnets based on performance
2. Implement advanced AI scoring using ML models
3. Expand social media platform integrations
4. Develop predictive churn prevention
5. Create advanced customer lifetime value models

This implementation creates a sophisticated, data-driven marketing automation system that will significantly improve lead quality, conversion rates, and customer lifetime value for JMEFIT. 