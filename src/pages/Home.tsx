
import { Link } from 'react-router-dom';
import { MessageSquare, Users, AppWindow, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';
import ParallaxEffect from '../components/ParallaxEffect';

function Home() {
  return (
    <>
      <ParallaxEffect />
    <div className="relative">
      <SEO 
        title="JMEFIT - Elite Fitness Training" 
        description="TRANSFORM YOUR BODY. TRANSFORM YOUR LIFE. Elite Fitness Training by Jaime. Expert-guided programs for sustainable transformation."
        image="https://jmefit.com/og/jmefit-og-image.png"
        url="https://jmefit.com"
        type="website"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'JMEFIT',
          alternateName: 'JME Fitness Training',
          url: 'https://jmefit.com',
          description: 'TRANSFORM YOUR BODY. TRANSFORM YOUR LIFE. Elite Fitness Training by Jaime.',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://jmefit.com/search?q={search_term_string}',
            query: 'required name=search_term_string'
          }
        }}
      />
      {/* Hero Section */}
      <div className="relative h-screen w-full hero-background">
        {/* We'll use CSS classes instead of inline styles for media queries */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        <div className="relative h-full flex items-center justify-center">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-8 hero-content scroll-fade-out">
            <h1 className="mb-8 space-y-4 sm:space-y-4 text-center sm:text-left hero-text-mobile animate-fadeIn" style={{ animationDuration: '800ms' }}>
              <div className="flex flex-col items-center sm:flex-row sm:items-baseline sm:gap-4">
                <span className="text-5xl sm:text-6xl md:text-7xl font-black text-[#FF1493] leading-none">TRANSFORM</span>
                <span className="text-xl sm:text-3xl md:text-4xl font-medium text-white italic">MIND & BODY.</span>
              </div>
              <div className="flex flex-col items-center sm:flex-row sm:items-baseline sm:gap-4">
                <span className="text-5xl sm:text-6xl md:text-7xl font-black text-[#FF1493] leading-none">ELEVATE</span>
                <span className="text-xl sm:text-3xl md:text-4xl font-medium text-white italic">LIFE.</span>
              </div>
            </h1>
            <h2 className="text-xl sm:text-3xl md:text-4xl text-white/90 mb-10 font-light tracking-wide flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 justify-center drop-shadow-md hero-text-mobile animate-fadeIn" style={{ animationDuration: '800ms', animationDelay: '200ms' }}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-3xl md:text-4xl font-normal text-white">Custom Training Programs</span>
              </div>
              <span className="hidden sm:inline mx-4 text-[#FF1493]">|</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-3xl md:text-4xl font-normal text-white">Expert Guidance</span>
              </div>
              <span className="hidden sm:inline mx-4 text-[#FF1493]">|</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-3xl md:text-4xl font-normal text-white">Real Accountability</span>
              </div>
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 animate-fadeIn" style={{ animationDuration: '800ms', animationDelay: '400ms' }}>
              <Link
                to="/programs"
                className="inline-flex items-center justify-center w-full sm:w-auto px-12 py-5 text-lg font-bold rounded-xl bg-gradient-to-r from-jme-cyan to-jme-purple text-white hover:from-jme-purple hover:to-jme-cyan transition-all transform hover:scale-105 hover:shadow-2xl uppercase tracking-wide shadow-xl mt-4 animate-pulse"
              >
                Train With Me
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Welcome Section */}
      <div className="py-24 bg-white" id="programs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-extrabold text-center mb-6 uppercase tracking-wider bg-gradient-to-r from-jme-purple via-purple-600 to-jme-cyan bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Transform Your Life with JMEFit!
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            Get started with one of our monthly subscription app-based or standalone training programs below:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <Link to="/shred-waitlist" className="group relative aspect-video overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <img 
                src="/unsplash-images/fitness-woman-1.jpg"
                alt="SHRED Challenge"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 transform-gpu"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wide">SHRED Challenge</h3>
              </div>
            </Link>
            <Link to="/nutrition-programs" className="group relative aspect-video overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <img 
                src="/unsplash-images/healthy-food-1.jpg"
                alt="Nutrition Programs"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 transform-gpu"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Nutrition Programs</h3>
              </div>
            </Link>
            <Link to="/monthly-app" className="group relative aspect-video overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1" id="monthly-membership">
              <img 
                src="/unsplash-images/workout-1.jpg"
                alt="Monthly Membership"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 transform-gpu"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <h3 className="text-2xl font-bold text-white uppercase tracking-wide">Monthly Membership</h3>
              </div>
            </Link>
            <Link to="/shop" className="group relative aspect-video overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1" id="merch-section">
              <img 
                src="/unsplash-images/nutrition-1.jpg"
                alt="Nutrition"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 transform-gpu"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-wide mb-2">MERCH</h3>
                  <span className="inline-block bg-green-500 text-white text-sm px-3 py-1 rounded-full">Coming Soon</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>


      
      {/* Community Section */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16 uppercase tracking-wide bg-gradient-to-r from-black to-jme-purple bg-clip-text text-transparent">
            Join the JMEFit Community
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <MessageSquare className="w-16 h-16 text-jme-purple mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4">Direct Messaging With Jaime</h3>
              <p className="text-gray-600">
                Gain exclusive access to direct messaging with Jaime and her support team (plan-dependent).
              </p>
            </div>
            <div>
              <AppWindow className="w-16 h-16 text-jme-purple mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4">Members-Only App</h3>
              <p className="text-gray-600">
                Stay on top of your workouts, track your stats, and get support in the JME app.
              </p>
            </div>
            <div>
              <Users className="w-16 h-16 text-jme-purple mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-4">Private Facebook Community</h3>
              <p className="text-gray-600">
                Our awesome community will help you stay motivated and accountable.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Journey Banner */}
      <div className="relative py-40 parallax-banner"
        style={{
          backgroundImage: 'url("/unsplash-images/fitness-journey.jpg")'
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-wider mb-8">
            Start Your Journey Towards the Best Version of Yourself!
          </h2>
          <Link
            to="/programs"
            className="inline-flex items-center px-12 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-jme-purple to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 uppercase tracking-wide shadow-lg"
          >
            Get Started Today
          </Link>
        </div>
      </div>
      
      {/* App Preview */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 uppercase tracking-wide mb-6">
              Your Training Journey Made Simple
            </h2>
            <p className="text-xl text-gray-600">
              Track your workouts, nutrition, and progress all in one place
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <img
              src="/IMG_3190.PNG"
              alt="Workout tracking"
              className="rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
            />
            <img
              src="/IMG_3186.PNG"
              alt="Progress tracking"
              className="rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
            />
            <img
              src="/IMG_3185.PNG"
              alt="Nutrition tracking"
              className="rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
            />
          </div>
        </div>
      </div>
      
      {/* Footer CTA */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-8 uppercase tracking-wide bg-gradient-to-r from-blue-500 via-purple-600 to-blue-400 bg-clip-text text-transparent drop-shadow-lg" style={{textShadow: '0 0 5px rgba(100, 100, 255, 0.3)'}}>
              Ready to Transform Your Life?
            </h2>
            <Link
              to="/programs"
              className="inline-flex items-center px-12 py-4 text-lg font-bold rounded-full bg-gradient-to-r from-jme-purple to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all transform hover:scale-105 uppercase tracking-wide shadow-lg"
            >
              Join Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </div> 
    </div>
    </>
  );
}

export default Home;