import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, CheckCircle2, MessageSquare, Flame, Scale, LineChart, Smartphone, Apple, Info, X } from 'lucide-react';
import TransformationsBanner from '../components/TransformationsBanner';
import FAQAccordion from '../components/FAQAccordion';
import SEO from '../components/SEO';

import PricingToggle from '../components/PricingToggle';
import { useCartStore } from '../store/cart';
import toast from 'react-hot-toast';
import { getProducts } from '../lib/api/products';
import { getSubscriptionPlans } from '../lib/api/subscriptions';

function Programs() {

  const [selectedShredDate, setSelectedShredDate] = useState<string>('');
  const shredDateRef = useRef<HTMLSelectElement>(null);
  const [showNutritionDetails, setShowNutritionDetails] = useState(false);
  const [showNutritionTrainingDetails, setShowNutritionTrainingDetails] = useState(false);
  const [showSelfLedDetails, setShowSelfLedDetails] = useState(false);
  const [showTrainerFeedbackDetails, setShowTrainerFeedbackDetails] = useState(false);
  const [displayIntervals, setDisplayIntervals] = useState<{
    selfLed: 'month' | 'year',
    trainerFeedback: 'month' | 'year',
    nutritionOnly: 'month' | 'year',
    nutritionTraining: 'month' | 'year'
  }>({
    selfLed: 'year',
    trainerFeedback: 'year',
    nutritionOnly: 'year',
    nutritionTraining: 'year'
  });
  
  // State for database products
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  
  // Fetch products and subscription plans from database
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch one-time products
        const productsData = await getProducts();
        setDbProducts(productsData || []);
        
        // Fetch subscription plans
        const plansData = await getSubscriptionPlans();
        setSubscriptionPlans(plansData || []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
        toast.error('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Helper functions to find products in the fetched data
  const getOneTimeProduct = (name: string) => {
    return dbProducts.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase()) && 
      p.metadata?.product_type === 'one-time'
    );
  };
  
  const getSubscriptionPlan = (name: string) => {
    return subscriptionPlans.find(p => 
      p.name.toLowerCase().includes(name.toLowerCase())
    );
  };
  
  // Get price for a product based on interval
  const getProductPrice = (product: any, interval?: 'month' | 'year') => {
    if (!product || !product.prices || product.prices.length === 0) return 0;
    
    // For one-time products
    if (!interval) {
      return product.prices[0]?.price / 100 || 0;
    }
    
    // For subscription products
    const price = product.prices.find((p: any) => p.interval === interval);
    return price ? price.price / 100 : 0;
  };
  
  // Computed products based on database data
  const products = {
    nutritionOnly: {
      id: getSubscriptionPlan('Nutrition Only')?.id || 'nutrition-only',
      name: 'Nutrition Only',
      monthlyPrice: getProductPrice(getSubscriptionPlan('Nutrition Only'), 'month'),
      yearlyPrice: getProductPrice(getSubscriptionPlan('Nutrition Only'), 'year'),
      description: getSubscriptionPlan('Nutrition Only')?.description || 'Custom nutrition plan, guidance & anytime support',
      features: getSubscriptionPlan('Nutrition Only')?.features || []
    },
    nutritionTraining: {
      id: getSubscriptionPlan('Nutrition & Training')?.id || 'nutrition-training',
      name: 'Nutrition & Training',
      monthlyPrice: getProductPrice(getSubscriptionPlan('Nutrition & Training'), 'month'),
      yearlyPrice: getProductPrice(getSubscriptionPlan('Nutrition & Training'), 'year'),
      description: getSubscriptionPlan('Nutrition & Training')?.description || 'Complete transformation package with nutrition and custom workouts',
      features: getSubscriptionPlan('Nutrition & Training')?.features || []
    },
    selfLedTraining: {
      id: getSubscriptionPlan('Self-Led Training')?.id || 'self-led-training',
      name: 'Self-Led Training',
      monthlyPrice: getProductPrice(getSubscriptionPlan('Self-Led Training'), 'month'),
      yearlyPrice: getProductPrice(getSubscriptionPlan('Self-Led Training'), 'year'),
      description: getSubscriptionPlan('Self-Led Training')?.description || 'Complete app access with monthly workout plans',
      features: getSubscriptionPlan('Self-Led Training')?.features || []
    },
    trainerFeedback: {
      id: getSubscriptionPlan('Trainer Feedback')?.id || 'trainer-feedback',
      name: 'Trainer Feedback',
      monthlyPrice: getProductPrice(getSubscriptionPlan('Trainer Feedback'), 'month'),
      yearlyPrice: getProductPrice(getSubscriptionPlan('Trainer Feedback'), 'year'),
      description: getSubscriptionPlan('Trainer Feedback')?.description || 'Personal guidance & form checks',
      features: getSubscriptionPlan('Trainer Feedback')?.features || []
    },
    macrosCalculation: {
      id: getOneTimeProduct('Macros Calculation')?.id || 'macros-calculation',
      name: 'One-Time Macros Calculation',
      price: getProductPrice(getOneTimeProduct('Macros Calculation')),
      description: getOneTimeProduct('Macros Calculation')?.description || 'Complete macro calculation with comprehensive guides'
    },
    shredChallenge: {
      id: getOneTimeProduct('SHRED Challenge')?.id || 'shred-challenge',
      name: 'SHRED Challenge',
      price: getProductPrice(getOneTimeProduct('SHRED Challenge')),
      description: getOneTimeProduct('SHRED Challenge')?.description || 'This 6-week, kick-start challenge'
    }
  };
  
  const getAppPrice = (basePrice: number, interval: 'month' | 'year' = 'year') => {
    // Return monthly price or calculate yearly price with discount
    return interval === 'month' ? basePrice : basePrice * 12 * 0.8; // 20% discount for annual
  };

  const handleAddToCart = (productId: string, price: number, name: string, isSubscription: boolean = true) => {
    // Always use yearly billing interval for subscription products
    // The user can toggle to monthly in the cart if desired
    const defaultBillingInterval: 'month' | 'year' = 'year';
    
    // For yearly subscription products, use the yearly price
    const finalPrice = isSubscription && defaultBillingInterval === 'year' ? 
      (productId === products.nutritionOnly.id ? products.nutritionOnly.yearlyPrice : 
       productId === products.nutritionTraining.id ? products.nutritionTraining.yearlyPrice :
       productId === products.selfLedTraining.id ? products.selfLedTraining.yearlyPrice :
       productId === products.trainerFeedback.id ? products.trainerFeedback.yearlyPrice : price) : price;
    
    // Get the appropriate stripe_price_id from the database products
    const getStripePriceId = () => {
      if (!isSubscription) {
        // For one-time products
        if (productId === products.macrosCalculation.id) {
          const product = getOneTimeProduct('Macros Calculation');
          return product?.prices[0]?.stripe_price_id;
        } else if (productId === products.shredChallenge.id) {
          const product = getOneTimeProduct('SHRED Challenge');
          return product?.prices[0]?.stripe_price_id;
        }
      } else {
        // For subscription products
        const billingInterval = defaultBillingInterval;
        let plan;
        
        if (productId === products.nutritionOnly.id) {
          plan = getSubscriptionPlan('Nutrition Only');
        } else if (productId === products.nutritionTraining.id) {
          plan = getSubscriptionPlan('Nutrition & Training');
        } else if (productId === products.selfLedTraining.id) {
          plan = getSubscriptionPlan('Self-Led Training');
        } else if (productId === products.trainerFeedback.id) {
          plan = getSubscriptionPlan('Trainer Feedback');
        }
        
        if (plan && plan.prices) {
          const price = plan.prices.find((p: any) => p.interval === billingInterval);
          return price?.stripe_price_id;
        }
      }
      return undefined;
    };
    
    const stripePriceId = getStripePriceId();
    
    addItem({
      id: productId,
      name: name,
      price: finalPrice,
      billingInterval: isSubscription ? defaultBillingInterval : undefined,
      description: '',
      stripe_price_id: stripePriceId
    });
    
    // Go directly to checkout instead of cart
    navigate('/checkout');
  };
  
  const handleAppAddToCart = (program: { name: string; price: number; description: string }) => {
    // Get the current interval for this program
    let programKey: keyof typeof displayIntervals;
    
    if (program.name === "Self-Led Training") {
      programKey = "selfLed";
    } else if (program.name === "Trainer Feedback") {
      programKey = "trainerFeedback";
    } else if (program.name === "Nutrition Only Program") {
      programKey = "nutritionOnly";
    } else {
      programKey = "nutritionTraining";
    }
    
    // Get the interval for this program
    const interval = displayIntervals[programKey];
    
    addItem({
      id: program.name,
      name: program.name,
      price: program.price,
      description: program.description,
      billingInterval: interval
    });
    toast.success('Added to cart!');
    
    // Go directly to checkout instead of cart
    navigate('/checkout');
  };
  const faqItems = [
    {
      question: "How do I get started?",
      answer: "Choose a program that matches your fitness level and goals. Once you subscribe, you'll get immediate access to your workouts and meal plans through our MyPTHub app."
    },
    {
      question: "Can I switch programs?",
      answer: "Yes! You can upgrade or change your program at any time. Your progress will be saved and transferred to your new program. Contact us if you need help deciding which program is right for you."
    },
    {
      question: "What equipment do I need?",
      answer: "It depends on your program. The Basic Plan requires dumbbells, resistance bands, and optional equipment like TRX or stability balls. Premium and Elite programs offer both gym and home workout options with equipment substitutions available."
    },
    {
      question: "Is there a refund policy?",
      answer: "Because of the nature of the programs, we do not offer a refund. You will have access to the program purchased until canceled at your request. We are confident you will love our services!"
    },
    {
      question: "How often are the workouts updated?",
      answer: "Workouts change monthly with continued subscription. For the SHRED challenge, workouts are updated after 3 weeks to keep your routine fresh and challenging."
    },
    {
      question: "Can I access previous workout plans?",
      answer: "Premium and Elite members have access to both current and previous training blocks, giving you more flexibility in your workout schedule."
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <div className="relative h-[400px] mb-24">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/unsplash-images/fitness-journey.jpg")'
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            <i>Transform</i> Your Body & Mind with JMEFit
          </h1>
          <p className="text-2xl text-white font-medium max-w-3xl bg-gradient-to-r from-jme-cyan via-white to-jme-purple bg-clip-text text-transparent animate-gradient">
            Comprehensive nutrition and training programs designed to help you reach your fitness goals
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
      <SEO 
        title="Training Programs"
        description="Transform your body with our comprehensive nutrition and training programs."
      />
        <div className="text-center mb-12">
          <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px'}}>Nutrition Programs</h2>
          <p className="text-xl text-gray-300 text-center mb-4">
            Subscription-based programs with a 3-month minimum commitment
          </p>
          <p className="text-lg text-gray-400 text-center mb-8">
            Continue your journey month-to-month after the initial commitment
          </p>
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
              <h3 className="text-2xl font-bold mb-2 relative z-10">Nutrition Only</h3>
              <p className="text-lg opacity-90 mb-4 relative z-10">Custom nutrition plan, guidance & anytime support</p>
              <div className="text-sm text-teal-200 mb-4 relative z-10">3-month minimum commitment</div>
              <button 
                onClick={() => setShowNutritionDetails(true)}
                className="bg-white/20 text-white text-sm py-1.5 px-5 rounded-full flex items-center gap-1.5 mx-auto mb-3 hover:bg-white/30 hover:scale-105 transition-all duration-300 relative z-20 shadow-sm hover:shadow-md"
              >
                <Info className="w-4 h-4" /> 
                <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all hover:after:w-full">More Info</span>
              </button>
              <PricingToggle
                interval={displayIntervals.nutritionOnly}
                monthlyPrice={149}
                onChange={(newInterval) => setDisplayIntervals(prev => ({ ...prev, nutritionOnly: newInterval }))}
              />
            </div>
            <div className="program-card-body">
              <ul className="program-card-features">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Personalized macro calculations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Weekly check-ins and adjustments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Custom meal planning guidance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>24/7 chat support with Jaime</span>
                </li>
              </ul>
              <div className="program-card-button-container">
                <button
                  onClick={() => handleAppAddToCart({
                    name: "Nutrition Only Program",
                    price: getAppPrice(149),
                    description: `Nutrition Only Program (Annual) - Custom nutrition plan & support`
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
              <h3 className="text-2xl font-bold mb-2 relative z-10">Nutrition & Training</h3>
              <p className="text-lg opacity-90 mb-4 relative z-10">Complete transformation package with nutrition and custom workouts</p>
              <div className="text-sm text-purple-300 mb-4 relative z-10">3-month minimum commitment</div>
              <button 
                onClick={() => setShowNutritionTrainingDetails(true)}
                className="bg-white/20 text-white text-sm py-1.5 px-5 rounded-full flex items-center gap-1.5 mx-auto mb-3 hover:bg-white/30 hover:scale-105 transition-all duration-300 relative z-20 shadow-sm hover:shadow-md"
              >
                <Info className="w-4 h-4" /> 
                <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-white after:transition-all hover:after:w-full">More Info</span>
              </button>
              <PricingToggle
                interval={displayIntervals.nutritionTraining}
                monthlyPrice={199}
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
                  onClick={() => handleAppAddToCart({
                    name: "Nutrition & Training Program",
                    price: getAppPrice(199),
                    description: `Nutrition & Training Program (Annual) - Complete transformation package`
                  })}
                  className="program-button block w-full bg-gradient-to-r from-jme-purple to-purple-700 text-white"
                >
                  Start Complete Program
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Nutrition Details Modal */}
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
                <div className="text-xl font-bold text-gray-800 mb-2">$149 <span className="text-base font-normal text-gray-600">(minimum 3 month commitment, billed monthly)</span></div>
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
                    handleAppAddToCart({
                      name: "Nutrition Only Program",
                      price: getAppPrice(149),
                      description: `Nutrition Only Program (Annual) - Custom nutrition plan & support`
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
                <div className="text-xl font-bold text-gray-800 mb-2">$199 <span className="text-base font-normal text-gray-600">(minimum 3 month commitment, billed monthly)</span></div>
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
                    handleAppAddToCart({
                      name: "Nutrition & Training Program",
                      price: getAppPrice(199),
                      description: `Nutrition & Training Program (Annual) - Complete transformation package`
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
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-jme-purple to-purple-900 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">App Workouts Only</h2>
              </div>
              
              <div className="mb-6 text-gray-700">
                <p>
                  JmeFit workout options are monthly and have no long-term commitments- cancel anytime! Choose gym or home-based training that is focused on your long-term goals. By breaking each week into a 3, 4 or 5 day split, you'll reach your goals that fit your lifestyle & have no stress in planning! You'll have access to my exercise library and app to record your workout (reps / sets / weights), track your progress, and more! Workouts change monthly with continued subscription and are custom for equipment access and all fitness levels!
                </p>
              </div>
              
              <div className="bg-purple-50 p-5 rounded-xl mb-6">
                <div className="text-xl font-bold text-gray-800 mb-2">Trainer Feedback $34.99 <span className="text-base font-normal text-gray-600">(Month-to-Month)</span></div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Program Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Includes Everything from Self-Led</span> – Access to all features of the Self-Led membership.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Form Checks</span> – Submit workout videos for personalized feedback to ensure correct form and prevent injury.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Direct Access to Jaime</span> – Privately message Jaime anytime through the app for adjustments and advice.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Adaptable Workouts</span> – Swap exercises or add traveling programs based on your schedule or location, as well as rehabilitative plans as needed.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Full Workout Access</span> – Access to all previous workouts for as long as the membership is active.
                    </div>
                  </li>
                </ul>
                <div className="mt-6 bg-gray-100 p-4 rounded-lg text-gray-700">
                  <p>This program works for any experience level and provides access to more hands-on coaching and guidance. Gym/home equipment can be swapped if not accessible.</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleAppAddToCart({ 
                      name: "Trainer Feedback",
                      price: getAppPrice(34.99),
                      description: "Trainer Feedback (Annual) - Personal guidance & form checks"
                    });
                    setShowTrainerFeedbackDetails(false);
                  }}
                  className="bg-gradient-to-r from-jme-purple to-purple-700 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Start Trainer Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Self-Led Training Details Modal */}
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
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-jme-cyan to-cyan-700 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">App Workouts Only</h2>
              </div>
              
              <div className="mb-6 text-gray-700">
                <p>
                  JmeFit workout options are monthly and have no long-term commitments- cancel anytime! Choose gym or home-based training that is focused on your long-term goals. By breaking each week into a 3, 4 or 5 day split, you'll reach your goals that fit your lifestyle & have no stress in planning! You'll have access to my exercise library and app to record your workout (reps / sets / weights), track your progress, and more! Workouts change monthly with continued subscription and are custom for equipment access and all fitness levels!
                </p>
              </div>
              
              <div className="bg-cyan-50 p-5 rounded-xl mb-6">
                <div className="text-xl font-bold text-gray-800 mb-2">Self-Led $19.99 <span className="text-base font-normal text-gray-600">(Month-to-Month)</span></div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Program Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Access to "JMEFit" App</span> – Full access to Jaime Fit's app-based workouts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">New Monthly Workouts</span> – Choose from 3, 4, or 5-day workout plans updated each month.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Structured Progressions</span> – Programmed progressions to ensure continuous improvement.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Video Guidance</span> – Each exercise is paired with instructional videos and setup/execution breakdown for correct form.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Detailed Prescriptions</span> – Includes prescribed sets, reps, RPE (Rate of Perceived EXERTION), and rest times for each exercise.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Workout Logging</span> – Ability to record weights, reps, and notes each week directly within the app.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">No Long-Term Commitment</span> – Month-to-month membership with the flexibility to cancel anytime.
                    </div>
                  </li>
                </ul>
                <div className="mt-6 bg-gray-100 p-4 rounded-lg text-gray-700">
                  <p>This program works for any experience level, but has no coaching guidance. Dumbbells and/or bars, optional bands and/or TRX, stability and/or Bosu balls needed for home plans.</p>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    handleAppAddToCart({ 
                      name: "Self-Led Training",
                      price: getAppPrice(19.99, displayIntervals.selfLed),
                      description: displayIntervals.selfLed === 'month' ? "Monthly Self-Led Training - Monthly workout plans & app access" : "Annual Self-Led Training - Monthly workout plans & app access"
                    });
                    setShowSelfLedDetails(false);
                  }}
                  className="bg-gradient-to-r from-jme-cyan to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Start Self-Led Training
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-16"></div>
      
      {/* Monthly App Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px'}}>Monthly App Training</h2>
          <p className="text-xl text-gray-300 text-center mb-4">
            Choose from flexible 3, 4, or 5-day splits customized to your schedule and goals
          </p>
          <p className="text-lg text-gray-400 text-center mb-8">
            Monthly updated workouts ensure continuous progress and adaptation to your fitness level
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Self-Led Plan */}
          <div className="program-card">
            <div className="program-card-header bg-gradient-to-br from-jme-cyan to-cyan-700">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-300/20 rounded-full -ml-12 -mb-12 blur-lg"></div>
              <div className="flex items-center justify-center w-16 h-16 bg-cyan-400/30 rounded-2xl mb-6 backdrop-blur-sm shadow-lg relative z-10">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2 relative z-10">Self-Led Training</h3>
              <p className="text-lg opacity-90 mb-4 relative z-10">Complete app access with monthly workout plans</p>
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
                onChange={(newInterval) => setDisplayIntervals(prev => ({ ...prev, selfLed: newInterval }))}
              />
            </div>
            <div className="program-card-body">
              <ul className="program-card-features">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Full access to JmeFit app</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>New monthly workout plans (3-5 days)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Structured progressions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Exercise video library</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Detailed workout logging</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-teal-500 flex-shrink-0" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <div className="program-card-button-container">
                <button
                  onClick={() => handleAppAddToCart({ 
                    name: "Self-Led Training",
                    price: getAppPrice(19.99, displayIntervals.selfLed),
                    description: displayIntervals.selfLed === 'month' ? "Monthly Self-Led Training - Monthly workout plans & app access" : "Annual Self-Led Training - Monthly workout plans & app access"
                  })}
                  className="program-button block w-full bg-gradient-to-r from-jme-cyan to-cyan-600 text-white"
                >
                  Start Self-Led Training
                </button>
              </div>
            </div>
          </div>

          {/* Trainer Feedback Plan */}
          <div className="program-card">
            <div className="best-value-badge">Most Popular</div>
            <div className="program-card-header bg-gradient-to-br from-jme-purple to-purple-900">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-300/20 rounded-full -ml-12 -mb-12 blur-lg"></div>
              <div className="flex items-center justify-center w-16 h-16 bg-purple-400/30 rounded-2xl mb-6 backdrop-blur-sm shadow-lg relative z-10">
                <MessageSquare className="w-8 h-8 text-white" />
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
                onChange={(newInterval) => setDisplayIntervals(prev => ({ ...prev, trainerFeedback: newInterval }))}
              />
            </div>
            <div className="program-card-body">
              <ul className="program-card-features">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Everything in Self-Led plan</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Form check video reviews</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Direct messaging with Jaime</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Workout adaptations & swaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Access to previous workouts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Premium support access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <div className="program-card-button-container">
                <button
                  onClick={() => handleAppAddToCart({
                    name: "Trainer Feedback Program",
                    price: getAppPrice(34.99),
                    description: "Annual Trainer Feedback Program - Premium training with personal guidance"
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
      
      {/* One-Time Macros Program */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px'}}>One-Time Offerings</h2>
          <p className="text-gray-400">Get started with a single purchase option</p>
        </div>
        <div 
          className="bg-gradient-to-br from-jme-cyan to-cyan-700 rounded-2xl p-8 text-white shadow-xl transform hover:scale-[1.01] transition-transform duration-300 relative overflow-hidden"
        >
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
                <div className="text-3xl font-bold mb-1">$99.00</div>
                <div className="text-sm opacity-80 mb-4">one-time payment</div>
                <button
                  onClick={() => handleAddToCart(
                    products.macrosCalculation.id, 
                    products.macrosCalculation.price, 
                    products.macrosCalculation.name,
                    false
                  )}
                  className="bg-white text-cyan-700 px-6 py-3 rounded-xl font-semibold hover:bg-cyan-50 transition-colors shadow-lg hover:shadow-xl duration-300"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHRED Challenge Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 0 5px rgba(100, 100, 255, 0.3)'}}>Special Challenge Program</h2>
          <p className="text-lg text-gray-400">Transform your body with our intensive 6-week program</p>
        </div>
        <div id="shred-challenge" className="bg-gradient-to-r from-jme-cyan via-jme-purple to-jme-cyan bg-[length:200%_100%] hover:bg-[100%] transition-all duration-500 rounded-2xl text-white p-8 shadow-[0_0_30px_rgba(139,92,246,0.3)] border-4 border-white/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-jme-cyan/20 via-jme-purple/20 to-jme-cyan/20 rounded-2xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          <div className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg transform hover:rotate-12 transition-all cursor-pointer group backdrop-blur-sm">
                  <Flame className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform" />
                </div>
                <h2 className="text-4xl font-bold">SHRED with JmeFit!</h2>
              </div>
              <div className="text-4xl font-bold mb-6">$249<span className="text-xl font-normal ml-2">one-time payment</span></div>
              
              <div className="mb-6 max-w-md mx-auto">
                <label htmlFor="shredDate" className="block text-white text-lg font-medium mb-2">Select Start Date:</label>
                <select
                  id="shredDate"
                  ref={shredDateRef}
                  value={selectedShredDate}
                  onChange={(e) => setSelectedShredDate(e.target.value)}
                  className="w-full bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                  required
                >
                  <option value="" disabled>Choose a start date</option>
                  <option value="2025-04-13">April 13, 2025</option>
                  <option value="2025-05-18">May 18, 2025</option>
                  <option value="2025-07-06">July 6, 2025</option>
                  <option value="2025-08-10">August 10, 2025</option>
                  <option value="2025-09-14">September 14, 2025</option>
                  <option value="2025-10-19">October 19, 2025</option>
                </select>
              </div>
              
              <button
                onClick={() => {
                  if (!selectedShredDate) {
                    alert('Please select a start date');
                    shredDateRef.current?.focus();
                    return;
                  }
                  handleAddToCart(
                    products.shredChallenge.id, 
                    products.shredChallenge.price, 
                    `${products.shredChallenge.name} - Starting ${new Date(selectedShredDate).toLocaleDateString()}`,
                    false
                  );
                }}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl duration-300 inline-block mb-6"
              >
                Add to Cart
              </button>
              <p className="text-xl mb-6 leading-relaxed">
                This 6-week, kick-start challenge is designed not only to build muscle, lose fat & gain strength simultaneously, 
                but to also teach you how to eat for life, all while living life!
              </p>
              <p className="text-xl mb-10 leading-relaxed">
                Whether you're in the beginning of your journey with zero experience, a seasoned lifter, or somewhere in the middle- 
                this challenge will guide you & create results.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4 mx-auto">
                    <Scale className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-3 text-center text-lg">Custom Macros</h3>
                  <ul className="text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Personalized fat loss macros</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Maintenance calories for body recomp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Sample meal plan with snacks</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4 mx-auto">
                    <LineChart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-3 text-center text-lg">Check-Ins</h3>
                  <ul className="text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Interactive check-in with Jaime</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Progress tracking & adjustments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Comprehensive tracking guides</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Educational content & tips</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4 mx-auto">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-3 text-center text-lg">MyPTHub App</h3>
                  <ul className="text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Free access included</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Track workouts & nutrition</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Direct Q&A with Jaime</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 transform hover:scale-105 shadow-lg hover:shadow-xl">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-4 mx-auto">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold mb-3 text-center text-lg">Exclusive Workouts</h3>
                  <ul className="text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>5 workouts per week with progressive overload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Home and gym options</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>Updates after 4 weeks</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <Link
                to="/shred-waitlist"
                className="inline-block bg-gradient-to-r from-white to-gray-100 text-jme-purple font-bold py-4 px-10 rounded-xl hover:from-gray-100 hover:to-white transform hover:scale-105 transition-all duration-300 mt-8 shadow-lg hover:shadow-xl border-2 border-white/50"
              >
                Join the SHRED Waitlist
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Transformations Banner */}
      <TransformationsBanner />

      {/* Free Consultation */}
      <div className="max-w-4xl mx-auto mt-24 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-jme-cyan/10 to-jme-purple/10 rounded-3xl p-10 text-center relative overflow-hidden border border-white/10 shadow-xl">
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.png')] opacity-5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-jme-cyan/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-jme-purple/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 0 5px rgba(100, 100, 255, 0.3)'}}>Not Sure Which Plan Is Right For You?</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">Schedule a free consultation with our fitness experts to find the perfect program for your goals and lifestyle.</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-jme-cyan to-jme-purple text-white font-semibold py-4 px-10 rounded-xl hover:from-jme-cyan hover:to-jme-purple hover:shadow-lg hover:shadow-jme-purple/20 transition-all transform hover:scale-105 duration-300"
            >
              <MessageSquare className="w-5 h-5" />
              Schedule a Free Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Merch Section */}
      <div className="max-w-5xl mx-auto mt-24 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-dark-card to-dark-card/80 rounded-3xl p-12 text-center relative overflow-hidden border border-dark-accent/30 shadow-2xl">
          <div className="absolute inset-0 bg-[url('/src/assets/pattern-dot.png')] opacity-5"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-jme-purple/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-jme-cyan/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="inline-block bg-gradient-to-r from-jme-cyan to-jme-purple p-2 rounded-xl mb-6">
              <div className="bg-dark-card/90 rounded-lg px-6 py-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-jme-cyan to-jme-purple font-bold">COMING SOON</span>
              </div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">JmeFit Merch</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">Exclusive apparel and accessories to represent your fitness journey</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-dark-accent/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-dark-accent/50 hover:border-jme-cyan/30 transition-all duration-300 hover:shadow-jme-cyan/10 hover:shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-jme-cyan/20 to-jme-cyan/5 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">👕</span>
                </div>
                <h3 className="font-bold text-white mb-2">Premium Apparel</h3>
                <p className="text-gray-400 text-sm">High-quality workout shirts, hoodies, and more</p>
              </div>
              
              <div className="bg-dark-accent/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-dark-accent/50 hover:border-jme-purple/30 transition-all duration-300 hover:shadow-jme-purple/10 hover:shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-jme-purple/20 to-jme-purple/5 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🧢</span>
                </div>
                <h3 className="font-bold text-white mb-2">Accessories</h3>
                <p className="text-gray-400 text-sm">Hats, bags, water bottles, and gym essentials</p>
              </div>
              
              <div className="bg-dark-accent/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-dark-accent/50 hover:border-jme-cyan/30 transition-all duration-300 hover:shadow-jme-cyan/10 hover:shadow-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-jme-cyan/20 to-jme-purple/20 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🎁</span>
                </div>
                <h3 className="font-bold text-white mb-2">Limited Editions</h3>
                <p className="text-gray-400 text-sm">Exclusive drops and special collections</p>
              </div>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-dark-accent/40 rounded-xl p-6 shadow-lg border border-dark-accent/60">
                <p className="text-gray-300 mb-4">
                  Get ready for exclusive JmeFit apparel and accessories. 
                  Sign up for our newsletter to be the first to know when our merch drops!
                </p>
                <button className="bg-gradient-to-r from-jme-cyan to-jme-purple text-white font-semibold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-jme-purple/20 transition-all transform hover:scale-105 duration-300">
                  Join the Waitlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-extrabold inline-block mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 0 5px rgba(100, 100, 255, 0.3)'}}>Frequently Asked Questions</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">Find answers to common questions about our fitness programs and services</p>
        </div>
        <div className="relative">
          <FAQAccordion items={faqItems} />
        </div>
      </div>
    </div>
  );
}

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

export default Programs;