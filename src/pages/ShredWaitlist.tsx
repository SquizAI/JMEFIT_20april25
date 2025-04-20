import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../store/cart';
import toast from 'react-hot-toast';

// Next 6 start dates (specific dates for 2025)
const getNextStartDates = () => {
  return [
    new Date('2025-04-14'),
    new Date('2025-05-19'),
    new Date('2025-07-07'),
    new Date('2025-08-25'),
    new Date('2025-10-06')
  ];
};

function ShredWaitlist() {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { addItem } = useCartStore();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [emailError, setEmailError] = useState('');

  const startDates = getNextStartDates();

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData(prev => ({ ...prev, email }));
    
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleAddToCart = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !selectedDate || !validateEmail(formData.email)) {
      toast.error('Please fill in all fields and select a start date');
      return;
    }

    addItem({
      id: 'shred-challenge',
      name: 'SHRED Challenge',
      price: 249,
      description: `SHRED Challenge starting ${selectedDate?.toLocaleDateString('en-US', { 
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })}`,
      billingInterval: 'year', // SHRED Challenge is a one-time payment, but we'll set it to yearly for consistency
      customer: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        startDate: selectedDate
      }
    });
    toast.success('Added to cart!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error('Please select a preferred start date');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('shred_waitlist')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            preferred_start_date: selectedDate.toISOString()
          }
        ]);

      if (error) throw error;

      toast.success('You have been added to the SHRED waitlist!');
      setFormData({ firstName: '', lastName: '', email: '' });
      setSelectedDate(null);
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      toast.error('Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link 
          to="/programs" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Programs
        </Link>

        <div id="shred-challenge" className="bg-gradient-to-r from-jme-cyan via-jme-purple to-jme-cyan bg-[length:200%_100%] hover:bg-[100%] transition-all duration-500 rounded-2xl text-white p-8 shadow-[0_0_30px_rgba(139,92,246,0.3)] border-4 border-white/30 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-jme-cyan/20 via-jme-purple/20 to-jme-cyan/20 rounded-2xl animate-pulse"></div>
          <div className="relative">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">SHRED with JmeFit!</h2>
              <div className="text-3xl font-bold mb-4">$249<span className="text-lg font-normal ml-2">one-time payment</span></div>
              <p className="text-lg mb-4">
                This 6-week, kick-start challenge is designed not only to build muscle, lose fat & gain strength simultaneously, 
                but to also teach you how to eat for life, all while living life!
              </p>
              <p className="text-lg mb-8">
                Whether you're in the beginning of your journey with zero experience, a seasoned lifter, or somewhere in the middle- 
                this challenge will guide you & create results.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:transform hover:scale-105 shadow-lg">
                  <h3 className="font-semibold mb-2">Custom Macros</h3>
                  <ul className="text-sm text-left space-y-2">
                    <li>• Personalized fat loss macros</li>
                    <li>• Maintenance calories for body recomp</li>
                    <li>• Sample meal plan with snacks</li>
                  </ul>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:transform hover:scale-105 shadow-lg">
                  <h3 className="font-semibold mb-2">Check-Ins</h3>
                  <ul className="text-sm text-left space-y-2">
                    <li>• Interactive check-in with Jaime</li>
                    <li>• Progress tracking & adjustments</li>
                    <li>• Comprehensive tracking guides</li>
                   <li>• Tracking, weighing & grocery guides</li>
                    <li>• Educational content & tips</li>
                  </ul>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:transform hover:scale-105 shadow-lg">
                  <h3 className="font-semibold mb-2">MyPTHub App</h3>
                  <ul className="text-sm text-left space-y-2">
                    <li>• Free access included</li>
                    <li>• Track workouts & nutrition</li>
                    <li>• Direct Q&A with Jaime</li>
                  </ul>
                </div>
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-4 hover:bg-black/30 transition-all duration-300 border-2 border-white/20 hover:border-white/40 hover:transform hover:scale-105 shadow-lg">
                  <h3 className="font-semibold mb-2">Exclusive Workouts</h3>
                  <ul className="text-sm text-left space-y-2">
                    <li>• 5 workouts per week with progressive overload</li>
                    <li>• Home and gym options</li>
                    <li>• Updates after 4 weeks</li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">Join the Waitlist</h3>
                  <div className="w-24 h-1 bg-gradient-to-r from-white/0 via-white to-white/0 mx-auto mt-4"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/30 text-white placeholder-white/30 transition-all duration-300 hover:bg-white/10"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/30 text-white placeholder-white/30 transition-all duration-300 hover:bg-white/10"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-white/80">Email Address</label>
                  <input
                    type="email"
                    required
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                    value={formData.email}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-3 bg-white/5 border-2 ${
                      emailError ? 'border-red-400' : 'border-white/20'
                    } rounded-xl focus:ring-2 focus:ring-white/30 focus:border-white/30 text-white placeholder-white/30 transition-all duration-300 hover:bg-white/10`}
                    placeholder="Enter your email"
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-400">{emailError}</p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-4 text-white/80">Select Your Preferred Start Date</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {startDates.map((date, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                          selectedDate?.getTime() === date.getTime()
                            ? 'border-white bg-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                        <CheckCircle2 className={`w-5 h-5 mx-auto mb-2 ${
                          selectedDate?.getTime() === date.getTime() ? 'text-white' : 'text-white/50'
                        }`} />
                        <p className="text-sm font-medium text-center">
                          {date.toLocaleDateString('en-US', { 
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-white via-purple-100 to-white text-jme-purple font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
                      loading ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Joining Waitlist...
                      </>
                    ) : (
                      'Join the Waitlist'
                    )}
                  </button>
                  
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex items-center justify-center px-8 py-4 rounded-xl bg-white/20 text-white font-semibold border-2 border-white/30 hover:bg-white/30 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </button>
                  )}
                </div>
                <p className="text-sm text-white/60 text-center mt-6">
                  If joining the waitlist only, you'll receive an email with payment instructions & next steps. Your spot is not confirmed until payment is received.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShredWaitlist;