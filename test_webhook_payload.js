// Test payload for n8n webhook - EMAIL TEST to mattystjh@gmail.com

const emailTestLeadData = {
  // Basic info (using the real email to test email system)
  email: "mattystjh@gmail.com",
  first_name: "Matt",
  last_name: "Test", 
  phone: "+1234567890",
  
  // Lead source
  source: "chatbot",
  
  // Preferences
  fitness_goals: ["weight_loss"],
  experience_level: "beginner",
  
  // Social/behavioral data
  social_data: {
    platform: "website_chatbot",
    engagement_level: 8,
    time_spent: 180000,
    pages_visited: ["chatbot", "program-recommender"],
    actionTaken: "email_test",
    completedQuiz: true
  },
  
  // High-intent lead data for testing
  age: 35,
  gender: "female",
  annual_income: 75000,
  
  // Test note
  test_campaign: "n8n_email_integration_test"
};

console.log('Sending EMAIL TEST data to trigger email to mattystjh@gmail.com:', emailTestLeadData);

// Send the test data with better error handling
fetch('https://jmefit.app.n8n.cloud/webhook/lead-capture', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(emailTestLeadData)
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);
  
  // Check if response is ok
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Check content type
  const contentType = response.headers.get('content-type');
  console.log('Content-Type:', contentType);
  
  // Try to get response as text first
  return response.text().then(text => {
    console.log('Response text:', text);
    
    // If it's JSON, parse it
    if (contentType && contentType.includes('application/json') && text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return { raw: text };
      }
    }
    
    // Return as text if not JSON
    return { message: text || 'Email test sent successfully!' };
  });
})
.then(data => {
  console.log('✅ EMAIL TEST SUCCESS - Check mattystjh@gmail.com inbox:', data);
  console.log('🔍 Also check n8n workflow execution logs for email status');
})
.catch(error => {
  console.error('❌ EMAIL TEST ERROR:', error);
});

/* 
=== CURL COMMAND FOR JME@JMEFIT.COM EMAIL TEST ===

Copy and paste this curl command into your terminal:

curl -X POST "https://jmefit.app.n8n.cloud/webhook/lead-capture" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jme@jmefit.com",
    "first_name": "Jamie",
    "last_name": "JMEFit",
    "phone": "+1987654321",
    "source": "chatbot",
    "fitness_goals": ["muscle_gain"],
    "experience_level": "intermediate",
    "social_data": {
      "platform": "website_chatbot",
      "engagement_level": 9,
      "time_spent": 240000,
      "pages_visited": ["chatbot", "program-recommender", "checkout"],
      "actionTaken": "high_intent_lead",
      "completedQuiz": true,
      "purchaseIntent": true
    },
    "age": 32,
    "gender": "female",
    "annual_income": 85000,
    "test_campaign": "jmefit_owner_email_test"
  }'

*/ 