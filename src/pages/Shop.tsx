import React from 'react';
import { ShoppingBag, Clock, AlertCircle } from 'lucide-react';
import SEO from '../components/SEO';

function Shop() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Shop - Coming Soon" />
      
      <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-jme-cyan via-purple-600 to-jme-purple bg-clip-text text-transparent drop-shadow-lg" style={{ textShadow: 'rgba(100, 100, 255, 0.3) 0px 0px 5px' }}>
        JMEFit Shop
      </h1>
      
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-jme-purple to-purple-800 rounded-2xl p-12 text-center mb-16">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white/20 p-4 rounded-full mb-6">
            <ShoppingBag className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Coming Soon
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            We're working hard to bring you exclusive JMEFit merchandise. Sign up to be notified when our shop launches!
          </p>
          
          {/* Email Signup */}
          <div className="max-w-md w-full mx-auto">
            <form className="flex gap-2 flex-col sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
              />
              <button
                type="submit"
                className="bg-white text-jme-purple px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors sm:whitespace-nowrap"
              >
                Notify Me
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Preview Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          What to Expect
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46 16 2H8L3.62 3.46a4.5 4.5 0 0 0-2.5 4.27C1.09 8.9 1 11.44 1 12a4 4 0 0 0 4 12h14a4 4 0 0 0 4-12c0-.55-.09-3.09-.12-4.27a4.5 4.5 0 0 0-2.5-4.27Z"/>
                <path d="m8 2 2.83 10.5"/>
                <path d="m16 2-2.83 10.5"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Apparel</h3>
            <p className="text-gray-600">
              Premium quality t-shirts, hoodies, and workout gear featuring the JMEFit brand.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 21h10"/>
                <path d="M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
                <path d="M12 13V9"/>
                <path d="M10 11h4"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Supplements</h3>
            <p className="text-gray-600">
              High-quality nutrition supplements to enhance your fitness journey and support your goals.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 8h-4a5 5 0 0 0-5 5v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a5 5 0 0 0-5-5Z"/>
                <path d="M8 8a4 4 0 0 1 8 0M8 8v1M16 8v1"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Accessories</h3>
            <p className="text-gray-600">
              Water bottles, gym bags, resistance bands, and other fitness essentials.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-purple-100 p-4 rounded-full inline-block mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="14" rx="2"/>
                <path d="M12 8v14"/>
                <path d="M19 12H2v-4a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4z"/>
                <path d="M12 8H8c0 0 .5-3 4-3 s4.5 3 4 3h-4z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Gift Cards</h3>
            <p className="text-gray-600">
              Digital gift cards perfect for giving the gift of fitness to friends and family.
            </p>
          </div>
        </div>
      </div>
      
      {/* Launch Timeline */}
      <div className="bg-gray-50 rounded-xl p-8 mb-16">
        <div className="flex items-center justify-center mb-8">
          <Clock className="w-8 h-8 text-jme-purple mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Launch Timeline</h2>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 sm:left-1/2 ml-4 sm:ml-0 w-0.5 h-full bg-purple-200 transform -translate-x-1/2"></div>
            
            {/* Timeline items */}
            <div className="space-y-12">
              <div className="relative flex flex-col sm:flex-row items-center">
                <div className="flex items-center justify-center order-1 sm:order-1 sm:w-1/2 pb-8 sm:pb-0 sm:pr-8">
                  <div className="w-full text-right hidden sm:block">
                    <h3 className="text-lg font-bold text-gray-900">Design Phase</h3>
                    <p className="text-gray-600">Finalizing designs for our first collection</p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="bg-jme-purple text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
                    <span className="font-bold">1</span>
                  </div>
                </div>
                <div className="flex items-center justify-center order-2 sm:order-2 sm:w-1/2 pt-8 sm:pt-0 sm:pl-8">
                  <div className="w-full sm:hidden">
                    <h3 className="text-lg font-bold text-gray-900">Design Phase</h3>
                    <p className="text-gray-600">Finalizing designs for our first collection</p>
                  </div>
                </div>
              </div>
              
              <div className="relative flex flex-col sm:flex-row items-center">
                <div className="flex items-center justify-center order-1 sm:order-2 sm:w-1/2 pb-8 sm:pb-0 sm:pl-8">
                  <div className="w-full">
                    <h3 className="text-lg font-bold text-gray-900">Production</h3>
                    <p className="text-gray-600">Manufacturing our premium quality products</p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="bg-jme-purple text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
                    <span className="font-bold">2</span>
                  </div>
                </div>
                <div className="flex items-center justify-center order-2 sm:order-1 sm:w-1/2 pt-8 sm:pt-0 sm:pr-8">
                  <div className="w-full text-right hidden sm:block"></div>
                </div>
              </div>
              
              <div className="relative flex flex-col sm:flex-row items-center">
                <div className="flex items-center justify-center order-1 sm:order-1 sm:w-1/2 pb-8 sm:pb-0 sm:pr-8">
                  <div className="w-full text-right hidden sm:block">
                    <h3 className="text-lg font-bold text-gray-900">Beta Testing</h3>
                    <p className="text-gray-600">Limited release to select community members</p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="bg-jme-purple text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
                    <span className="font-bold">3</span>
                  </div>
                </div>
                <div className="flex items-center justify-center order-2 sm:order-2 sm:w-1/2 pt-8 sm:pt-0 sm:pl-8">
                  <div className="w-full sm:hidden">
                    <h3 className="text-lg font-bold text-gray-900">Beta Testing</h3>
                    <p className="text-gray-600">Limited release to select community members</p>
                  </div>
                </div>
              </div>
              
              <div className="relative flex flex-col sm:flex-row items-center">
                <div className="flex items-center justify-center order-1 sm:order-2 sm:w-1/2 pb-8 sm:pb-0 sm:pl-8">
                  <div className="w-full">
                    <h3 className="text-lg font-bold text-gray-900">Official Launch</h3>
                    <p className="text-gray-600">Full store launch with complete product line</p>
                  </div>
                </div>
                <div className="absolute left-0 sm:left-1/2 transform -translate-x-1/2 flex items-center justify-center">
                  <div className="bg-jme-purple text-white rounded-full w-10 h-10 flex items-center justify-center z-10">
                    <span className="font-bold">4</span>
                  </div>
                </div>
                <div className="flex items-center justify-center order-2 sm:order-1 sm:w-1/2 pt-8 sm:pt-0 sm:pr-8">
                  <div className="w-full text-right hidden sm:block"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 text-jme-purple mr-2" />
              When will the shop launch?
            </h3>
            <p className="text-gray-600">
              We're aiming to launch our shop in Summer 2025. Sign up for our newsletter to be the first to know the exact date!
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 text-jme-purple mr-2" />
              Will there be international shipping?
            </h3>
            <p className="text-gray-600">
              Yes! We plan to offer international shipping to most countries. Shipping rates will vary based on location.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 text-jme-purple mr-2" />
              Will there be exclusive items for members?
            </h3>
            <p className="text-gray-600">
              Absolutely! JMEFit program members will have access to exclusive merchandise and early access to new collections.
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 text-jme-purple mr-2" />
              Can I use my program credits in the shop?
            </h3>
            <p className="text-gray-600">
              Yes, we're working on integrating program credits with our shop, allowing you to use your earned credits towards merchandise.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shop;
