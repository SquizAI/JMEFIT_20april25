import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Salad, 
  Apple, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  Star, 
  Trophy, 
  Clock, 
  ShoppingCart, 
  Flame, 
  Heart, 
  Brain, 
  Target,
  MessageSquare,
  Users,
  Video,
  Smartphone,
  GraduationCap,
  Info,
  X
} from 'lucide-react';
import { useCartStore } from '../store/cart';
import { calculateYearlyPrice, formatPrice, parsePrice } from '../lib/pricing';
import PricingToggle from '../components/PricingToggle';
import { getProducts } from '../lib/api/products';
import { getSubscriptionPlans } from '../lib/api/subscriptions';
import toast from 'react-hot-toast';

type Goal = 'build-muscle' | 'lose-fat' | 'get-stronger' | 'improve-health';
type Experience = 'beginner' | 'intermediate' | 'advanced';
type Location = 'gym' | 'home' | 'both';

interface Program {
  name: string;
  price: string;
  annualPrice?: string;
  link: string;
  description: string;
  features: string[];
  icon: any;
  recommended?: boolean;
  badge?: string;
  timeCommitment?: string;
  idealFor?: string[];
}

function ProductSelector() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const { items, addItem, removeItem, total } = useCartStore();
  const [intervals, setIntervals] = useState<Record<string, 'month' | 'year'>>({});
  const [experience, setExperience] = useState<Experience | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedProgramInfo, setSelectedProgramInfo] = useState<typeof nutritionProgram.whoIsItFor | null>(null);

  const getPrice = (basePrice: number, programName: string) => {
    return (intervals[programName] || 'year') === 'year'
      ? formatPrice(calculateYearlyPrice(basePrice), 'year')
      : formatPrice(basePrice, 'month');
  };

  // Define icons for different features
  const featureIcons = {
    nutrition: Apple,
    workout: Dumbbell,
    tracking: Target,
    support: MessageSquare,
    community: Users,
    form: Video,
    app: Smartphone,
    education: GraduationCap
  };

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
  
  // Define dynamic prices based on database data
  const NUTRITION_ONLY_PRICE = getProductPrice(getSubscriptionPlan('Nutrition Only'), 'month') || 99;
  const NUTRITION_TRAINING_PRICE = getProductPrice(getSubscriptionPlan('Nutrition & Training'), 'month') || 149;

  const nutritionProgram = {
    name: "Nutrition Only",
    price: getPrice(NUTRITION_ONLY_PRICE, "Nutrition Only"),
    link: "/signup/nutrition",
    description: "Custom nutrition plan, guidance & anytime support (3 month minimum commitment)",
    icon: Apple,
    idealFor: ["Nutrition focus", "Meal planning", "Macro tracking"],
    whoIsItFor: {
      title: "Who Is This Plan For?",
      description: "This nutrition plan is designed for you if you're ready to transform your eating habits in a sustainable way. Here's what you can expect:",
      benefits: [
        {
          title: "Personalized Meal Plans and Snacks",
          description: "You'll start with meal plans and snack ideas tailored specifically to your macros. More importantly, you'll learn how to build your own plans that work in real life—so you can confidently eat anywhere, anytime."
        },
        {
          title: "Real-World Learning",
          description: "Rather than relying on rigid meal plans that quickly become outdated, this plan provides you with a solid starting point and a wealth of ideas. You'll discover how to adapt your eating habits to fit your lifestyle, ensuring long-term success."
        },
        {
          title: "Customized Coaching",
          description: "Your nutrition is personalized based on your TDEE, height, weight, body fat percentage, and activity level. You'll receive ongoing coaching and macro adjustments to help you stay on track as your needs evolve."
        },
        {
          title: "Flexible, Non-Restrictive Approach",
          description: "This plan is all about building what you love to eat while helping you achieve fat loss or muscle gain. Once you hit your target body fat percentage, you'll transition smoothly into a reverse diet—adding calories back gradually to maintain your results."
        },
        {
          title: "Sustainable Results",
          description: "After the reverse diet phase, you'll move into maintenance or recomp, setting you up for long-term success before any future adjustments."
        }
      ],
      conclusion: "If you're looking for a nutrition strategy that empowers you to take control of your eating habits while enjoying flexibility and real-world results, this plan is for you."
    },
    features: [
      "Personalized macro calculations",
      "Weekly check-ins and adjustments",
      "Custom meal planning guidance",
      "24/7 chat support",
      "Private community access",
      "Lifestyle integration tips",
      "Restaurant dining guidance",
      "Travel nutrition strategies"
    ]
  };

  const nutritionTrainingProgram = {
    name: "Nutrition & Training",
    price: getPrice(NUTRITION_TRAINING_PRICE, "Nutrition & Training"),
    link: "/signup/nutrition-training",
    description: "Complete transformation package with nutrition and custom workouts (3 month minimum commitment)",
    icon: Target,
    badge: "Most Popular",
    recommended: true,
    idealFor: ["Full support", "Custom programming", "Nutrition guidance"],
    features: [
      "Everything in Nutrition Only",
      "Custom workout programming",
      "Form check videos & feedback",
      "Weekly progress updates & adjustments",
      "Premium app features",
      "Exercise technique guidance",
      "Program modifications as needed"
    ]
  };

  const getRecommendedPrograms = () => {
    if (!goals.length || !experience || !location) return null;

    const programs: Program[] = [];

    // Always include nutrition programs first
    programs.push(nutritionProgram);
    programs.push(nutritionTrainingProgram);

    // Always include SHRED Challenge for fat loss goals
    if (goals.includes('lose-fat') || goals.includes('improve-health')) {
      const shredProgram = {
        name: "SHRED Challenge",
        price: "$249",
        link: "/shred-waitlist",
        description: "This 6-week, kick-start challenge is designed not only to build muscle, lose fat & gain strength simultaneously, but to also teach you how to eat for life, all while living life!",
        icon: Flame,
        badge: "Limited Time",
        timeCommitment: "6 weeks",
        idealFor: ["Quick results", "Structured approach", "Accountability"],
        whoIsItFor: {
          title: "Who Is This Plan For?",
          description: "This 6-week challenge is designed for anyone ready to transform their body and lifestyle. Here's what you'll get:",
          benefits: [
            {
              title: "Custom Macros & Nutrition",
              description: "Personalized fat loss macros, maintenance calories for body recomp, and detailed meal guidance."
            },
            {
              title: "Direct Access to Jaime",
              description: "Two interactive check-in sessions with Jaime for progress tracking and adjustments."
            },
            {
              title: "Complete Workout Program",
              description: "5 workouts per week with both home and gym options, updated after 4 weeks to keep challenging you."
            },
            {
              title: "MyPTHub App Access",
              description: "Track your workouts, log your nutrition, and communicate during check-ins through our professional training app."
            }
          ],
          conclusion: "Whether you're just starting your fitness journey or looking to break through a plateau, the SHRED Challenge provides the structure, support, and accountability you need to achieve real results."
        },
        features: [
          "Complete nutrition plan with macro calculations",
          "2 personal check-ins with Jaime",
          "5 workouts per week (gym & home options)",
          "Workouts update after 4 weeks",
          "Private community access",
          "Progress tracking in MyPTHub app",
          "Macro coaching guidebook",
          "Custom meal plan with snacks",
          "Tracking, weighing & grocery guides",
          "Comprehensive SHRED guide"
        ]
      };
      programs.push(shredProgram);
    }

    const plusProgram = {
      name: "Plus Program",
      price: getPrice(34.99, "Plus Program"),
      link: "/signup/trainer-feedback",
      description: "Premium coaching with personalized feedback and support",
      icon: Brain,
      timeCommitment: "Monthly subscription",
      idealFor: ["Form improvement", "Personalized guidance", "Flexible schedule"],
      features: [
        "Everything in Self-Led plan",
        "Form check video reviews",
        "Direct messaging with Jaime",
        "Workout adaptations & swaps",
        "Access to previous workouts",
        "Premium support access",
        "Cancel anytime"
      ]
    };
    programs.push(plusProgram);

    // Self-Led Program for experienced users
    if (experience === 'intermediate' || experience === 'advanced') {
      const selfLedProgram = {
        name: "Self-Led Program",
        price: getPrice(19.99, "Self-Led Program"),
        link: "/signup/self-led",
        description: "Flexible program for independent trainers",
        icon: Dumbbell,
        timeCommitment: "Monthly subscription",
        idealFor: ["Self-motivated", "Experienced", "Budget-friendly"],
        features: [
          "Monthly workout plans",
          "Exercise video library",
          "Progress tracking",
          "Basic app access",
          "Cancel anytime"
        ]
      };
      programs.push(selfLedProgram);
    }

    return programs;
  };

  const toggleGoal = (goalId: Goal) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const recommendedPrograms = getRecommendedPrograms();

  const handleAddToCart = (program: Program) => {
    // Get the current interval for this program, defaulting to 'year'
    const interval = intervals[program.name] || 'year';
    
    // Parse the price from the formatted string
    const price = parsePrice(program.price);
    
    addItem({
      id: program.name,
      name: program.name,
      price: price,
      description: program.description,
      billingInterval: interval
    });
  };

  const handleShowInfo = (programInfo: typeof nutritionProgram.whoIsItFor) => {
    setSelectedProgramInfo(programInfo);
    setShowInfoModal(true);
  };

  const handleIntervalChange = (programName: string, newInterval: 'month' | 'year') => {
    setIntervals(prev => ({
      ...prev,
      [programName]: newInterval
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Transform Your Body with JMEFit</h1>
        <p className="text-gray-600 text-center mb-8">Expert-guided nutrition and training programs customized for your goals</p>
        
        {/* Goal Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Start Programs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setGoals(['lose-fat']);
                setExperience('beginner');
                setLocation('both');
              }}
              className="p-4 rounded-lg bg-jme-purple text-white hover:bg-purple-700 transition-all"
            >
              Weight Loss Starter
            </button>
            <button
              onClick={() => {
                setGoals(['build-muscle']);
                setExperience('intermediate');
                setLocation('gym');
              }}
              className="p-4 rounded-lg bg-jme-purple text-white hover:bg-purple-700 transition-all"
            >
              Muscle Building Pro
            </button>
          </div>
        </div>

        {/* Multi-Goal Selection */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">What's your main goal?</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'build-muscle', label: 'Build Muscle' },
              { id: 'lose-fat', label: 'Lose Fat' },
              { id: 'get-stronger', label: 'Get Stronger' },
              { id: 'improve-health', label: 'Improve Health' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => toggleGoal(item.id as Goal)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  goals.includes(item.id as Goal)
                    ? 'border-jme-purple bg-jme-purple/90 text-white'
                    : 'border-gray-200 hover:border-jme-purple'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Shopping Cart Preview */}
        <div className="hidden lg:block fixed top-24 right-4 bg-white rounded-lg shadow-lg p-4 w-72 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Cart</h3>
            <ShoppingCart className="w-5 h-5" />
          </div>
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center mb-2 text-sm">
              <span>{item.name}</span>
              <span>${item.price}</span>
            </div>
          ))}
          {items.length > 0 && (
            <>
              <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-4 w-full bg-jme-purple text-white text-center py-2 rounded-lg hover:bg-purple-700 transition-all"
              >
                Checkout
              </Link>
            </>
          )}
        </div>

        {/* Mobile Cart Preview */}
        {items.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t p-4 z-50">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">{items.length} item(s)</span>
                <p className="font-bold">${total.toFixed(2)}</p>
              </div>
              <Link
                to="/checkout"
                className="bg-jme-purple text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-all"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}

        {/* Experience Level */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">What's your experience level?</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'beginner', label: 'Beginner' },
              { id: 'intermediate', label: 'Intermediate' },
              { id: 'advanced', label: 'Advanced' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setExperience(item.id as Experience)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  experience === item.id
                    ? 'border-jme-purple bg-jme-purple text-white'
                    : 'border-gray-200 hover:border-jme-purple'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Training Location */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Where will you train?</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'gym', label: 'At the Gym' },
              { id: 'home', label: 'At Home' },
              { id: 'both', label: 'Both' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setLocation(item.id as Location)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  location === item.id
                    ? 'border-jme-purple bg-jme-purple text-white'
                    : 'border-gray-200 hover:border-jme-purple'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendation */}
        {recommendedPrograms && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">Recommended Programs</h2>
            {recommendedPrograms.map((program, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-xl shadow-lg p-8 relative transform transition-all duration-300 hover:scale-[1.02] ${
                  program.recommended ? 'border-2 border-jme-purple' : ''
                } ${program.name === "SHRED Challenge" ? 'bg-gradient-to-r from-jme-cyan via-jme-purple to-jme-cyan bg-[length:200%_100%] hover:bg-[100%] text-white' : ''}`}
              >
                {program.name === "SHRED Challenge" && (
                  <div className="absolute inset-0 bg-gradient-to-r from-jme-cyan/20 via-jme-purple/20 to-jme-cyan/20 rounded-xl animate-pulse"></div>
                )}
                <div className="relative">
                <div className="flex items-start gap-6">
                  <div className="hidden md:block flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-jme-purple/10 to-purple-100 flex items-center justify-center">
                      <program.icon className="w-10 h-10 text-jme-purple" />
                    </div>
                  </div>
                  <div className="flex-grow relative">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="text-2xl font-bold mb-2 text-gray-900">{program.name}</h3>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        {program.badge && (
                          <div className="bg-gradient-to-r from-jme-purple to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md whitespace-nowrap">
                            {program.badge}
                          </div>
                        )}
                        {program.recommended && (
                          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-md whitespace-nowrap">
                            Recommended
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{program.description}</p>
                    {program.whoIsItFor && (
                      <button
                        onClick={() => handleShowInfo(program.whoIsItFor)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all transform hover:scale-105 mb-4 ${
                          program.name === "SHRED Challenge" 
                            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
                            : 'bg-purple-50 hover:bg-purple-100 text-jme-purple border border-purple-100'
                        }`}
                      >
                        <Info className="w-5 h-5" />
                        <span className="font-medium">More Info</span>
                      </button>
                    )}
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600 mb-4">
                    </div>
                    {program.idealFor && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-700 mb-2">Perfect for:</p>
                        <div className="flex flex-wrap gap-2">
                          {program.idealFor.map((item, i) => (
                            <span key={i} className="bg-purple-50 text-jme-purple px-3 py-1 rounded-full text-sm font-medium">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-6 mt-6">
                      {program.name !== "SHRED Challenge" && (
                        <div className="mb-6">
                          <PricingToggle
                            interval={intervals[program.name] || 'year'}
                            onChange={(newInterval) => handleIntervalChange(program.name, newInterval)}
                            monthlyPrice={program.name === "Nutrition Only" ? NUTRITION_ONLY_PRICE : NUTRITION_TRAINING_PRICE}
                          />
                        </div>
                      )}
                      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                        {program.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-gray-700">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              program.name === "SHRED Challenge" ? 'bg-white/10' : 'bg-green-50'
                            }`}>
                              <CheckCircle2 className={`w-5 h-5 ${
                                program.name === "SHRED Challenge" ? 'text-white' : 'text-green-500'
                              }`} />
                            </div>
                            <span className={`text-sm font-medium ${
                              program.name === "SHRED Challenge" ? 'text-white' : ''
                            }`}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <p className={`text-3xl font-bold ${
                            program.name === "SHRED Challenge" 
                              ? 'text-white' 
                              : 'bg-gradient-to-r from-jme-purple to-purple-600 bg-clip-text text-transparent'
                          }`}>
                            {program.price}{program.name === "SHRED Challenge" && <span className="text-lg font-normal ml-2">one-time payment</span>}
                          </p>
                          {(intervals[program.name] || 'year') === 'year' && program.name !== "SHRED Challenge" && (
                            <p className="text-sm text-green-600 font-semibold">
                              Save 20% with annual commitment
                            </p>
                          )}
                          {(program.name === "Nutrition Only" || program.name === "Nutrition & Training") && (
                            <p className="text-sm text-gray-600 font-medium mt-1">
                              3-month minimum commitment required
                            </p>
                          )}
                        </div>
                        <Link
                          to={program.name === "SHRED Challenge" ? "/shred-waitlist#shred-challenge" : "#"}
                          onClick={(e) => {
                            if (program.name !== "SHRED Challenge") {
                              e.preventDefault();
                              handleAddToCart(program);
                            }
                          }}
                          className={`w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-md text-sm ${
                            program.name === "SHRED Challenge"
                              ? 'bg-white text-jme-purple hover:bg-opacity-90'
                              : 'bg-gradient-to-r from-jme-purple to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                          }`}
                        >
                          {program.name === "SHRED Challenge" ? "Select Start Date" : "Add to Cart"}
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && selectedProgramInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">More Info</h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-8">{selectedProgramInfo.description}</p>
                <div className="space-y-6">
                  {selectedProgramInfo.benefits.map((benefit, index) => (
                    <div key={index} className="bg-purple-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-jme-purple mb-2">{benefit.title}</h4>
                      <p className="text-gray-700">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductSelector