import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, CheckCircle2, Scale, Info, X } from 'lucide-react';
import { useCartStore } from '../store/cart';
import PricingToggle from '../components/PricingToggle';
import toast from 'react-hot-toast';
import { STRIPE_PRODUCTS, getPriceAmount, getPriceId } from '../lib/stripe-products';

// Add keyframe animation for modal entry
const modalEntryStyles = `
@keyframes modalEntry {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.animate-modalEntry {
  animation: modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalEntryStyles;
  document.head.appendChild(styleElement);
}

function NutritionPrograms() {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [showNutritionDetails, setShowNutritionDetails] = React.useState(false);
  const [showNutritionTrainingDetails, setShowNutritionTrainingDetails] = React.useState(false);
  const [displayIntervals, setDisplayIntervals] = React.useState<{
    nutritionOnly: 'month' | 'year',
    nutritionTraining: 'month' | 'year'
  }>({
    nutritionOnly: 'year',
    nutritionTraining: 'year'
  });

  // Standardized function to get correct price based on current display interval using new Stripe products
  const getCorrectPrice = (productName: string, programKey: keyof typeof displayIntervals) => {
    const interval = displayIntervals[programKey];
    
    // Map product names to STRIPE_PRODUCTS keys
    const productMap: Record<string, keyof typeof STRIPE_PRODUCTS> = {
      "Nutrition Only Program": "NUTRITION_ONLY",
      "Nutrition Only": "NUTRITION_ONLY", 
      "Nutrition & Training Program": "NUTRITION_TRAINING",
      "Nutrition & Training": "NUTRITION_TRAINING",
      "One-Time Macros Calculation": "ONE_TIME_MACROS"
    };
    
    const productKey = productMap[productName];
    if (!productKey) {
      console.warn(`Unknown product: ${productName}`);
      return 0;
    }
    
    // Get price amount from centralized configuration
    const amountInCents = getPriceAmount(productKey as string, interval);
    return amountInCents / 100; // Convert from cents to dollars
  };

  const handleAddToCart = (program: { name: string; price: number; description: string }) => {
    // Get the current interval for this program
    let programKey: keyof typeof displayIntervals;
    
    if (program.name === "Nutrition Only Program") {
      programKey = "nutritionOnly";
    } else if (program.name === "Nutrition & Training Program") {
      programKey = "nutritionTraining";
    } else {
      // For one-time products, use a default key
      programKey = "nutritionOnly";
    }
    
    // Get the interval for this program
    const interval = displayIntervals[programKey];
    
    // Check if this is a one-time product like One-Time Macros
    const isOneTimeProduct = program.name.includes('One-Time') || program.name.includes('Macros');
    
    // Map program names to STRIPE_PRODUCTS keys for getting the correct Stripe price ID
    const productMap: Record<string, keyof typeof STRIPE_PRODUCTS> = {
      "Nutrition Only Program": "NUTRITION_ONLY",
      "Nutrition & Training Program": "NUTRITION_TRAINING",
      "One-Time Macros Calculation": "ONE_TIME_MACROS"
    };
    
    const productKey = productMap[program.name];
    let stripePriceId = '';
    
    if (productKey) {
      stripePriceId = getPriceId(productKey as string, isOneTimeProduct ? undefined : interval);
    }
    
    addItem({
      id: program.name,
      name: program.name,
      price: program.price,
      description: program.description,
      billingInterval: isOneTimeProduct ? 'one-time' : interval,
      stripe_price_id: stripePriceId
    });
    toast.success(`${program.name} added to cart!`);
    
    // Don't navigate to checkout automatically - same as Programs.tsx
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-12">
      {/* Nutrition Details Modal */}
      {/* Nutrition & Training Details Modal */}
      {showNutritionTrainingDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm transition-all duration-300"
             onClick={(e) => {
               // Close modal when clicking backdrop (outside modal)
               if (e.target === e.currentTarget) setShowNutritionTrainingDetails(false);
             }}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-modalEntry shadow-2xl"
            style={{
              animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              onClick={() => setShowNutritionTrainingDetails(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-jme-purple to-purple-900 rounded-xl">
                  <Scale className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Nutrition & Training Membership</h2>
              </div>
              
              <div className="bg-purple-50 p-5 rounded-xl mb-8">
                <div className="text-xl font-bold text-gray-800 mb-2">$249 <span className="text-base font-normal text-gray-600">(minimum 3 month commitment, billed monthly)</span></div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Program Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Comprehensive Offering</span> – Combines Nutrition Only One-on-One program & Custom Workouts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Custom Workout Plans</span> – Tailored workouts designed specifically for your fitness goals & equipment.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Custom Meal Plan</span> – A fully personalized meal plan supporting your lifestyle and workout regimen.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Weekly Check-Ins</span> – Consistent progress checks, biofeedback assessment, and plan adjustments from Jaime.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Macro Coaching Guidebook</span> – Same detailed guide as provided in Nutrition Only.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Grocery List</span> – Comprehensive list covering all meal plan items.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Anytime Access</span> – Message Jaime anytime for questions, help or adjustments.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Form and Progress Reviews</span> – Continuous feedback on exercise form and nutritional progress.
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">The Details</h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    I begin by providing you with customized meal plans and snack ideas tailored to your macros, while teaching you how to create your own. Traditional meal plans can only serve as a starting point and often fail in real-life situations because they don't teach you how to adapt to any environment or circumstance. My approach includes macro and nutrition personalization along with ongoing coaching and adjustments as needed.
                  </p>
                  <p>
                    I help you build a plan centered on the foods you love so that you can achieve fat loss and muscle gain without feeling restricted. Every detail is personalized based on your TDEE, height, weight, body fat percentage, and activity level. You'll receive a comprehensive guidebook filled with valuable information, weekly check-in guidelines, feedback protocols, a grocery list, and sample meals.
                  </p>
                  <p>
                    This plan lets you enjoy your favorite foods—as long as they fit your macros—ensuring you stay on track anywhere, anytime, while maintaining a balanced diet where fat accounts for about 25% of your intake. Once you reach your desired body fat percentage, we transition into a reverse diet by gradually adding calories (macros) with minimal weight gain. At that point, you typically move into a maintenance or recomposition phase before eventually entering another deficit, if needed.
                  </p>
                  <p>
                    The workout component includes a library of instructional videos for each movement to help you perfect your form. You'll receive detailed guidance on sets, reps, and the level of perceived exertion, and you'll track your weights and reps to monitor progress over time. New workout splits are provided every four weeks to promote progressive overload and allow your body to strengthen before switching up the exercises for each muscle group. Additionally, you can send me videos of your workouts through the app for personalized feedback or to address any questions during check-ins. Whether you follow a 3, 4, or 5-day split—using weights, bodyweight exercises, or bands—everything is designed to fit your schedule and seamlessly integrated into your nutrition plan.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-5 rounded-xl mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Notes</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">—</span>
                    <span>You will receive an email with the Macro Guidebook and a questionnaire to complete for your custom macros. There will also be a video of the walkthrough of navigating the workout portion of the app in the CHAT.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">-</span>
                    <span>Due to the digital nature of this program, all sales are final. Please ask all questions prior to purchase.</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleAddToCart({
                      name: "Nutrition & Training Program",
                      price: getCorrectPrice("Nutrition & Training Program", "nutritionTraining"),
                      description: `Nutrition & Training Program (${displayIntervals.nutritionTraining === 'month' ? 'Monthly' : 'Annual'}) - Complete transformation package`
                    });
                    setShowNutritionTrainingDetails(false);
                  }}
                  className="bg-gradient-to-r from-jme-purple to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Start Complete Program
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showNutritionDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm transition-all duration-300"
             onClick={(e) => {
               // Close modal when clicking backdrop (outside modal)
               if (e.target === e.currentTarget) setShowNutritionDetails(false);
             }}
        >
          <div 
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-modalEntry shadow-2xl"
            style={{
              animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <button
              onClick={() => setShowNutritionDetails(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-jme-cyan to-cyan-700 rounded-xl">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Nutrition Only Program</h2>
              </div>
              
              <div className="bg-cyan-50 p-5 rounded-xl mb-8">
                <div className="text-xl font-bold text-gray-800 mb-2">$179 <span className="text-base font-normal text-gray-600">(minimum 3 month commitment, billed monthly)</span></div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Program Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">One-on-One Coaching</span> – Work directly with Jaime throughout the 12 weeks.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Anytime Messaging</span> – Communicate with Jaime through the app for ongoing support.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Custom Meal Plans</span> – Tailored to individual goals, preferences, and any health restrictions. Detailed macro breakdown provided for each meal and snack.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Macro Coaching Guidebook</span> – A comprehensive guide explaining macronutrients, macro tracking, alcohol tracking, meal prep tips, best practices, and more.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Weekly Check-Ins</span> – Consistent progress checks, biofeedback assessment, and plan adjustments from Jaime.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Grocery List</span> – A detailed grocery list aligned with your custom meal plan and macro goals.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Adaptive Adjustments</span> – Macros and meals are adjusted throughout the program based on feedback and results.
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">The Details</h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    I begin by providing you with customized meal plans and snack ideas tailored to your macros, all while teaching you how to create your own. Pre-made meal plans can be a great starting point, but they often fall short in real-life situations because they don't teach you how to eat flexibly, anywhere and anytime. My approach includes macro and nutrition personalization, along with ongoing coaching and adjustments when necessary.
                  </p>
                  <p>
                    I help you design a plan based on the foods you love, so you can achieve fat loss or muscle gain while enjoying a non-restrictive lifestyle. Every detail is customized according to your Total Daily Energy Expenditure (TDEE), height, weight, body fat percentage, and activity level. Once you reach your desired body fat percentage, the goal is to transition into a reverse diet—gradually increasing calories (macros) with minimal weight gain. After that, you typically move into a maintenance or recomposition phase before entering another deficit if needed.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-100 p-5 rounded-xl mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Notes</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">—</span>
                    <span>You will receive an email with the Macro Guidebook and a questionnaire to complete for your custom macros, along with other guides and tools.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">-</span>
                    <span>Due to the digital nature of this program, all sales are final. Please ask all questions prior to purchase.</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleAddToCart({
                      name: "Nutrition Only Program",
                      price: getCorrectPrice("Nutrition Only Program", "nutritionOnly"),
                      description: `Nutrition Only Program (${displayIntervals.nutritionOnly === 'month' ? 'Monthly' : 'Annual'}) - Custom nutrition plan & support`
                    });
                    setShowNutritionDetails(false);
                  }}
                  className="bg-gradient-to-r from-jme-cyan to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Start Your Nutrition Journey
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hero Section */}
      <div className="relative h-[350px] mb-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transform scale-105 hover:scale-100 transition-transform duration-10000"
          style={{
            backgroundImage: 'url("/unsplash-images/healthy-food-1.jpg")'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 animate-fadeIn">
            Transform Your Nutrition Journey
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl">
            Expert-guided nutrition programs designed to help you achieve sustainable results
          </p>
        </div>
      </div>

      <div data-component-name="NutritionPrograms" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px'}}>Nutrition Programs</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Choose the perfect nutrition plan to fuel your fitness journey and achieve your goals</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nutrition Only */}
          <div className="program-card">
            <div className="program-card-header bg-gradient-to-br from-jme-cyan to-cyan-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-300/20 rounded-full -ml-12 -mb-12 blur-lg"></div>
              <div className="flex items-center justify-center w-16 h-16 bg-cyan-400/30 rounded-2xl mb-6 backdrop-blur-sm shadow-lg relative z-10">
                <Apple className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 relative z-10 h-8 flex items-center">Nutrition Only</h3>
              <p className="text-lg opacity-90 mb-5 relative z-10 h-16">Custom nutrition plan, guidance & anytime support</p>
              <div className="text-sm text-teal-200 mb-5 relative z-10">3-month minimum commitment</div>
              <button 
                onClick={() => setShowNutritionDetails(true)}
                className="bg-white/20 text-white text-sm py-1.5 px-5 rounded-full flex items-center gap-1.5 mx-auto mb-3 hover:bg-white/30 hover:scale-105 transition-all duration-300 relative z-20 shadow-sm hover:shadow-md"
              >
                <Info className="w-4 h-4" /> 
                <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all hover:after:w-full">More Info</span>
              </button>
              <PricingToggle
                interval={displayIntervals.nutritionOnly}
                monthlyPrice={179}
                onChange={(newInterval) => setDisplayIntervals(prev => ({ ...prev, nutritionOnly: newInterval }))}
              />
            </div>
            <div className="program-card-body">
              <ul className="program-card-features">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Personalized macro calculations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Weekly check-ins and adjustments</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Custom meal planning guidance</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>24/7 chat support with Jaime</span>
                </li>
              </ul>
              <div className="program-card-button-container">
                <button
                  onClick={() => handleAddToCart({
                    name: "Nutrition Only Program",
                    price: getCorrectPrice("Nutrition Only Program", "nutritionOnly"),
                    description: `Nutrition Only Program (${displayIntervals.nutritionOnly === 'month' ? 'Monthly' : 'Annual'}) - Custom nutrition plan & support`
                  })}
                  className="program-button block w-full bg-gradient-to-r from-jme-cyan to-cyan-600 text-white"
                >
                  Start Your Nutrition Journey
                </button>
              </div>
            </div>
          </div>

          {/* Nutrition & Training */}
          <div className="program-card">
            <div className="best-value-badge">Most Popular</div>
            <div className="program-card-header bg-gradient-to-br from-jme-purple to-purple-900">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/20 rounded-full -ml-12 -mb-12 blur-lg"></div>
              <div className="flex items-center justify-center w-16 h-16 bg-purple-400/30 rounded-2xl mb-6 backdrop-blur-sm shadow-lg relative z-10">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 relative z-10 h-8 flex items-center">Nutrition & Training</h3>
              <p className="text-lg opacity-90 mb-5 relative z-10 h-16">Complete transformation package with nutrition and custom workouts</p>
              <div className="text-sm text-purple-300 mb-5 relative z-10">3-month minimum commitment</div>
              <button 
                onClick={() => setShowNutritionTrainingDetails(true)}
                className="bg-white/20 text-white text-sm py-1.5 px-5 rounded-full flex items-center gap-1.5 mx-auto mb-3 hover:bg-white/30 hover:scale-105 transition-all duration-300 relative z-20 shadow-sm hover:shadow-md"
              >
                <Info className="w-4 h-4" /> 
                <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all hover:after:w-full">More Info</span>
              </button>
              <PricingToggle
                interval={displayIntervals.nutritionTraining}
                monthlyPrice={249}
                onChange={(newInterval) => setDisplayIntervals(prev => ({ ...prev, nutritionTraining: newInterval }))}
              />
            </div>
            <div className="program-card-body">
              <ul className="program-card-features">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Everything in Nutrition Only</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Customized training program</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Form check videos & feedback</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Premium app features</span>
                </li>
              </ul>
              <div className="program-card-button-container">
                <button
                  onClick={() => handleAddToCart({
                    name: "Nutrition & Training Program",
                    price: getCorrectPrice("Nutrition & Training Program", "nutritionTraining"),
                    description: `Nutrition & Training Program (${displayIntervals.nutritionTraining === 'month' ? 'Monthly' : 'Annual'}) - Complete transformation package`
                  })}
                  className="program-button block w-full bg-gradient-to-r from-jme-purple to-purple-700 text-white"
                >
                  Start Complete Program
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* One-Time Macros */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px'}}>One-Time Offerings</h2>
            <p className="text-gray-600">Get started with a single purchase option</p>
          </div>
          <div data-component-name="NutritionPrograms" className="bg-gradient-to-br from-jme-cyan to-cyan-700 rounded-2xl p-8 text-white shadow-xl transform hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm shadow-lg">
                  <Scale className="w-8 h-8 text-white" />
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold mb-2">One-Time Macros Calculation</h3>
                  <p className="text-lg opacity-90 mb-4">Complete macro calculation with comprehensive guides</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <span className="bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">Personalized macros</span>
                    <span className="bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">Detailed guides</span>
                    <span className="bg-white/20 rounded-full px-3 py-1 text-sm backdrop-blur-sm">Meal templates</span>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <div className="text-3xl font-bold mb-1">$99</div>
                  <div className="text-sm opacity-80 mb-4">one-time payment</div>
                  <button
                    onClick={() => handleAddToCart({
                      name: "One-Time Macros Calculation",
                      price: 99,
                      description: "One-Time Macros Calculation - Complete macro calculation with comprehensive guides"
                    })}
                    className="bg-white text-cyan-700 px-6 py-3 rounded-xl font-semibold hover:bg-cyan-50 transition-colors shadow-lg hover:shadow-xl duration-300"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonials Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-jme-cyan/10 to-jme-purple/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-center mb-8">What Our Clients Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-jme-cyan to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">RJ</div>
                  <div className="ml-4">
                    <p className="font-semibold">Rebecca J.</p>
                    <p className="text-sm text-gray-500">Nutrition Client</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"The personalized nutrition plan changed my relationship with food. I've lost 15 pounds and feel more energetic than ever!"</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-jme-purple to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-lg">DK</div>
                  <div className="ml-4">
                    <p className="font-semibold">David K.</p>
                    <p className="text-sm text-gray-500">Complete Program Client</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"The combination of nutrition guidance and custom workouts has been transformative. Jaime's support is incredible."</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">SL</div>
                  <div className="ml-4">
                    <p className="font-semibold">Sarah L.</p>
                    <p className="text-sm text-gray-500">Macros Client</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"Even the one-time macros calculation gave me so much clarity. The meal planning templates are easy to follow and customize."</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export default NutritionPrograms;