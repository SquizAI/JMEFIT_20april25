import { Link } from 'react-router-dom';
import { Home, Target, Clock } from 'lucide-react';

function StandalonePrograms() {
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center h-[600px]"
        style={{
          backgroundImage: 'url("/images/JMEFIT_photo.png")'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Standalone & Home Programs
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              Transform your body with our comprehensive home and gym-based training programs.
            </p>
            <Link
              to="/signup/standalone"
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-jme-purple hover:bg-purple-700 md:text-lg"
            >
              View Programs
            </Link>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-dark-card rounded-xl overflow-hidden">
              <img 
                src="/unsplash-images/home-workout.jpg"
                alt="Home Basics"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">Home Basics</h3>
                <p className="text-gray-300 mb-4">Perfect for beginners starting their fitness journey at home.</p>
                <div className="flex items-center text-gray-400 text-sm">
                  <Home className="w-4 h-4 mr-2" />
                  <span>Minimal equipment needed</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-card rounded-xl overflow-hidden">
              <img 
                src="/unsplash-images/strength-training.jpg"
                alt="Strength Builder"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">Strength Builder</h3>
                <p className="text-gray-300 mb-4">Build muscle and strength with this comprehensive program.</p>
                <div className="flex items-center text-gray-400 text-sm">
                  <Target className="w-4 h-4 mr-2" />
                  <span>Gym access required</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-card rounded-xl overflow-hidden">
              <img 
                src="/unsplash-images/hiit-workout.jpg"
                alt="HIIT & Conditioning"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">HIIT & Conditioning</h3>
                <p className="text-gray-300 mb-4">High-intensity workouts for maximum fat burn.</p>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>30-45 minute workouts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StandalonePrograms;