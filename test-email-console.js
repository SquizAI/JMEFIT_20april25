// JMEFit Email Styling Test - Browser Console
// Copy and paste this entire script into your browser console on your JMEFit site

(async function testJMEFitEmailStyling() {
  console.log('🎨 Testing JMEFit Beautiful Email Styling...');
  
  // Import the email functions (adjust path if needed)
  const { sendTestEmail } = await import('./src/lib/email.js');
  const { sendLeadEmail } = await import('./src/lib/email-automation.js');
  
  try {
    console.log('📧 Sending stunning test email to jme@jmefit.com...');
    
    // Test 1: Beautiful system test email
    const testResult = await sendTestEmail('jme@jmefit.com');
    if (testResult.success) {
      console.log('✅ Test email sent with beautiful JMEFit styling!');
    } else {
      console.log('📧 Email preview mode - check console for styling preview');
    }
    
    // Test 2: HOT Lead Email (Perfect Match - 95% Score) 🔥
    console.log('🔥 Sending HOT lead email (95% match score)...');
    const hotLead = {
      email: 'jme@jmefit.com',
      first_name: 'Jamie',
      segment: 'hot',
      icp_score: 95,
      recommended_product: 'Nutrition & Training Program',
      fitness_goals: ['weight loss', 'strength building'],
      experience_level: 'beginner',
      budget_range: '$200-300'
    };
    await sendLeadEmail(hotLead);
    console.log('✅ HOT lead email sent! (20% discount offer)');
    
    // Test 3: WARM Lead Email (Good Fit - Free Trial) 💪
    console.log('💪 Sending WARM lead email (free trial offer)...');
    const warmLead = {
      email: 'jme@jmefit.com',
      first_name: 'Jamie',
      segment: 'warm',
      icp_score: 65,
      recommended_product: 'Nutrition Only Program',
      experience_level: 'intermediate',
      budget_range: '$100-200'
    };
    await sendLeadEmail(warmLead);
    console.log('✅ WARM lead email sent! (7-day free trial)');
    
    // Test 4: COLD Lead Email (Educational Content) 🏃‍♀️
    console.log('🏃‍♀️ Sending COLD lead email (educational content)...');
    const coldLead = {
      email: 'jme@jmefit.com',
      first_name: 'Jamie',
      segment: 'cold',
      icp_score: 35,
      experience_level: 'beginner',
      budget_range: 'under $50'
    };
    await sendLeadEmail(coldLead);
    console.log('✅ COLD lead email sent! (free guide)');
    
    console.log('');
    console.log('🎉 ALL EMAIL STYLING TESTS COMPLETED!');
    console.log('');
    console.log('📬 Check jme@jmefit.com inbox for 4 STUNNING emails:');
    console.log('   1. 🧪 System Test Email - Beautiful JMEFit branding');
    console.log('   2. 🔥 HOT Lead Email - 20% discount + urgency');
    console.log('   3. 💪 WARM Lead Email - Free trial + community');
    console.log('   4. 🏃‍♀️ COLD Lead Email - Educational + gentle CTA');
    console.log('');
    console.log('🎨 EMAIL STYLING FEATURES:');
    console.log('   ✨ Gradient headers with shimmer effects');
    console.log('   💎 Animated CTA buttons');
    console.log('   📱 Mobile-responsive design');
    console.log('   🎯 Brand-consistent purple/blue colors');
    console.log('   💜 Professional Inter font');
    console.log('   🌟 Interactive hover effects');
    console.log('   📧 Social media integration');
    console.log('   🏆 Professional footer');
    console.log('');
    console.log('Your customers will be absolutely WOWed! 🤩');
    
  } catch (error) {
    console.error('❌ Email test error:', error);
    console.log('🔍 Make sure you\'re on your JMEFit site and the email modules are available');
  }
})();

// Helper function to test individual templates
window.testSingleEmail = async function(type = 'hot') {
  console.log(`🎨 Testing ${type.toUpperCase()} email template...`);
  
  const prospects = {
    hot: {
      email: 'jme@jmefit.com',
      first_name: 'Jamie',
      segment: 'hot',
      icp_score: 92,
      recommended_product: 'SHRED Challenge',
      fitness_goals: ['fat loss', 'muscle toning'],
      experience_level: 'beginner'
    },
    warm: {
      email: 'jme@jmefit.com',
      first_name: 'Jamie',
      segment: 'warm',
      icp_score: 58,
      recommended_product: 'Self-Led Training Program',
      experience_level: 'intermediate'
    },
    cold: {
      email: 'jme@jmefit.com',
      first_name: 'Jamie',
      segment: 'cold',
      icp_score: 28,
      experience_level: 'beginner'
    }
  };
  
  try {
    const { sendLeadEmail } = await import('./src/lib/email-automation.js');
    await sendLeadEmail(prospects[type]);
    console.log(`✅ ${type.toUpperCase()} email sent with beautiful styling!`);
  } catch (error) {
    console.error(`❌ ${type} email test failed:`, error);
  }
};

console.log('🎨 JMEFit Email Styling Test Ready!');
console.log('📧 The test will run automatically, or use testSingleEmail("hot"|"warm"|"cold")'); 