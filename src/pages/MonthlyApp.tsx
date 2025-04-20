import { useEffect, useState } from 'react';
import { Dumbbell, CheckCircle2, MessageSquare, Info, X } from 'lucide-react';
import { useCartStore } from '../store/cart';
import PricingToggle from '../components/PricingToggle';
import toast from 'react-hot-toast';
import { getSubscriptionPlans } from '../lib/api/subscriptions';

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

const MonthlyApp = () => {
  const { addItem } = useCartStore();
  const [showSelfLedDetails, setShowSelfLedDetails] = useState(false);
  const [showTrainerFeedbackDetails, setShowTrainerFeedbackDetails] = useState(false);
  const [displayIntervals, setDisplayIntervals] = useState<{
    selfLed: 'month' | 'year',
    trainerFeedback: 'month' | 'year'
  }>({
    selfLed: 'month',
    trainerFeedback: 'month'
  });
  
  // Function to handle interval changes
  const handleIntervalChange = (program: 'selfLed' | 'trainerFeedback', newInterval: 'month' | 'year') => {
    setDisplayIntervals(prev => ({
      ...prev,
      [program]: newInterval
    }));
  };
  
  // State for database subscription plans
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch subscription plans
        const plansData = await getSubscriptionPlans();
        setSubscriptionPlans(plansData || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        setError('Failed to load subscription plans. Please try again later.');
        toast.error('Failed to load subscription plans. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Calculate price based on interval (month or year)
  const calculatePrice = (monthlyPrice: number, interval: 'month' | 'year') => {
    if (interval === 'month') {
      return monthlyPrice; // Return exact monthly price
    } else {
      // For yearly, calculate total yearly price with 20% discount
      return monthlyPrice * 12 * 0.8; 
    }
  };
  
  const handleAppAddToCart = (program: { name: string; price: number; description: string }) => {
    // Find the subscription plan that matches this product
    const matchingPlan = subscriptionPlans.find(plan => 
      plan.name.toLowerCase().includes(program.name.toLowerCase())
    );
    
    // Find the correct price based on interval
    let stripePriceId = '';
    // Determine which interval to use based on the program name
    const interval = program.name.includes("Self-Led") ? displayIntervals.selfLed : displayIntervals.trainerFeedback;
    
    if (matchingPlan && matchingPlan.subscription_prices) {
      const price = matchingPlan.subscription_prices.find((p: any) => 
        p.interval === (interval === 'month' ? 'monthly' : 'yearly')
      );
      
      if (price) {
        stripePriceId = price.stripe_price_id;
      }
    }
    
    addItem({
      id: matchingPlan?.id || 'app-' + Date.now(),
      name: program.name,
      price: program.price,
      description: program.description,
      billingInterval: interval,
      stripe_price_id: stripePriceId
    });
    toast.success('Added to cart!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-12">
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-jme-blue border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-lg mt-2">Loading subscription plans...</span>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded my-6 mx-auto max-w-4xl">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-red-700 underline"
          >
            Try again
          </button>
        </div>
      )}
      
      {/* Only show content when not loading and no error */}
      {!loading && !error && (
        <div className="w-full">
          {/* Trainer Feedback Details Modal */}
          {showTrainerFeedbackDetails && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm transition-all duration-300"
                onClick={(e) => {
                  // Close modal when clicking backdrop (outside modal)
                  if (e.target === e.currentTarget) setShowTrainerFeedbackDetails(false);
                }}
            >
              <div 
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-modalEntry shadow-2xl"
                style={{
                  animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <button
                  onClick={() => setShowTrainerFeedbackDetails(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Trainer Feedback</h2>
                  <p className="text-gray-600 mb-6">
                    Get personalized feedback on your workouts from our expert trainers. This program includes:
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Form Checks</h3>
                        <p className="text-gray-600">Submit videos of your exercises for expert form analysis and corrections</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Workout Adaptations</h3>
                        <p className="text-gray-600">Get suggestions for exercise modifications based on your equipment, limitations, or goals</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Progress Reviews</h3>
                        <p className="text-gray-600">Regular check-ins to evaluate your progress and adjust your program as needed</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Direct Messaging</h3>
                        <p className="text-gray-600">Ask questions and get answers from our trainers within 24-48 hours</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-6 rounded-xl mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">How It Works</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Subscribe to the Trainer Feedback program</li>
                      <li>Access the feedback portal in your dashboard</li>
                      <li>Submit your videos or questions</li>
                      <li>Receive personalized feedback within 24-48 hours</li>
                      <li>Implement the suggestions and track your improvements</li>
                    </ol>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Testimonials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 font-bold">
                            JD
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-800">John D.</h4>
                            <p className="text-sm text-gray-500">Member for 8 months</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">"The form corrections I received completely eliminated my shoulder pain during bench press. Worth every penny!"</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 font-bold">
                            SM
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-800">Sarah M.</h4>
                            <p className="text-sm text-gray-500">Member for 5 months</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">"Having direct access to Jaime for questions and workout adaptations has been a game-changer for my fitness journey."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Self-Led Details Modal */}
          {showSelfLedDetails && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm transition-all duration-300"
                onClick={(e) => {
                  // Close modal when clicking backdrop (outside modal)
                  if (e.target === e.currentTarget) setShowSelfLedDetails(false);
                }}
            >
              <div 
                className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-modalEntry shadow-2xl"
                style={{
                  animation: 'modalEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <button
                  onClick={() => setShowSelfLedDetails(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-4">Self-Led Program</h2>
                  <p className="text-gray-600 mb-6">
                    Our comprehensive self-led program gives you everything you need to transform your fitness on your own schedule. This program includes:
                  </p>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Customized Workout Plans</h3>
                        <p className="text-gray-600">Progressive workout routines tailored to your goals and experience level</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Exercise Library</h3>
                        <p className="text-gray-600">Access to 200+ exercise demonstrations with proper form guidance</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Progress Tracking</h3>
                        <p className="text-gray-600">Tools to log your workouts and monitor your improvements over time</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800">Workout Scheduling</h3>
                        <p className="text-gray-600">Calendar integration to plan your workouts and stay consistent</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-6 rounded-xl mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">How It Works</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Subscribe to the Self-Led program</li>
                      <li>Complete the fitness assessment</li>
                      <li>Receive your personalized workout plan</li>
                      <li>Follow the program at your own pace</li>
                      <li>Track your progress and see results</li>
                    </ol>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6 mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Testimonials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-500 font-bold">
                            MJ
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-800">Mike J.</h4>
                            <p className="text-sm text-gray-500">Member for 1 year</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">"I've tried many fitness apps, but this program's structure and progression has given me the best results by far."</p>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold">
                            KL
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-800">Karen L.</h4>
                            <p className="text-sm text-gray-500">Member for 7 months</p>
                          </div>
                        </div>
                        <p className="text-gray-600 italic">"The exercise library alone is worth the subscription. I finally understand proper form for all my lifts."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 0 5px rgba(100, 100, 255, 0.3)'}}>
                Monthly App Subscriptions
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the perfect subscription to elevate your fitness journey with our premium app features
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Self-Led Program Card */}
              <div className="bg-gradient-to-br from-jme-cyan to-blue-600 rounded-3xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                <div className="program-card-header text-white text-center p-8 relative">
                  <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex justify-center mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Dumbbell className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 relative z-10">Self-Led Program</h3>
                  <p className="text-lg opacity-90 mb-4 relative z-10">Complete workout plans & exercise library</p>
                  <button 
                    onClick={() => setShowSelfLedDetails(true)}
                    className="bg-white/20 text-white text-sm py-1.5 px-5 rounded-full flex items-center gap-1.5 mx-auto mb-3 hover:bg-white/30 hover:scale-105 transition-all duration-300 relative z-20 shadow-sm hover:shadow-md"
                  >
                    <Info className="w-4 h-4" /> 
                    <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all hover:after:w-full">More Info</span>
                  </button>
                  <PricingToggle
                    interval={displayIntervals.selfLed}
                    monthlyPrice={19.99}
                    onChange={(newInterval) => handleIntervalChange('selfLed', newInterval)}
                  />
                </div>
                <div className="program-card-body">
                  <ul className="program-card-features">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Personalized workout plans</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>200+ exercise library with demonstrations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Progress tracking tools</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Workout scheduling</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Access on all devices</span>
                    </li>
                  </ul>
                  
                  <div className="program-card-cta">
                    <button
                      onClick={() => handleAppAddToCart({
                        name: "Self-Led Program",
                        price: calculatePrice(19.99, displayIntervals.selfLed),
                        description: `Self-Led Program (${displayIntervals.selfLed === 'year' ? 'Annual' : 'Monthly'}) - Complete workout plans & exercise library`
                      })}
                      className="program-button block w-full bg-gradient-to-r from-jme-cyan to-cyan-600 text-white"
                    >
                      Start Your Fitness Journey
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Trainer Feedback Card */}
              <div className="bg-gradient-to-br from-jme-purple to-purple-700 rounded-3xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                <div className="program-card-header text-white text-center p-8 relative">
                  <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex justify-center mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 relative z-10">Trainer Feedback</h3>
                  <p className="text-lg opacity-90 mb-4 relative z-10">Personal guidance & form checks</p>
                  <button 
                    onClick={() => setShowTrainerFeedbackDetails(true)}
                    className="bg-white/20 text-white text-sm py-1.5 px-5 rounded-full flex items-center gap-1.5 mx-auto mb-3 hover:bg-white/30 hover:scale-105 transition-all duration-300 relative z-20 shadow-sm hover:shadow-md"
                  >
                    <Info className="w-4 h-4" /> 
                    <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all hover:after:w-full">More Info</span>
                  </button>
                  <PricingToggle
                    interval={displayIntervals.trainerFeedback}
                    monthlyPrice={34.99}
                    onChange={(newInterval) => handleIntervalChange('trainerFeedback', newInterval)}
                  />
                </div>
                <div className="program-card-body">
                  <ul className="program-card-features">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>All Self-Led Program features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Form check video analysis</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Workout adaptations & modifications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Direct messaging with trainers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span>Regular progress reviews</span>
                    </li>
                  </ul>
                  
                  <div className="program-card-cta">
                    <button
                      onClick={() => handleAppAddToCart({
                        name: "Trainer Feedback Program",
                        price: calculatePrice(34.99, displayIntervals.trainerFeedback),
                        description: `Trainer Feedback Program (${displayIntervals.trainerFeedback === 'year' ? 'Annual' : 'Monthly'}) - Premium training with personal guidance`
                      })}
                      className="program-button block w-full bg-gradient-to-r from-jme-purple to-purple-700 text-white"
                    >
                      Start With Trainer Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyApp;
