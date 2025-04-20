import { Link } from 'react-router-dom';
import { Users, MessageSquare, Heart, Trophy } from 'lucide-react';

function Community() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-cover bg-center h-[400px]"
        style={{
          backgroundImage: 'url("/unsplash-images/community-bg.jpg")'
        }}>
        <div className="absolute inset-0 bg-black bg-opacity-60" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">Join Our Community</h1>
            <p className="text-xl text-gray-200 max-w-2xl">
              Connect with like-minded individuals, share your progress, and get inspired by others on their fitness journey.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Users className="w-12 h-12 text-jme-purple mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Support Network</h3>
            <p className="text-gray-600">Connect with members who share your goals and motivate each other.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <MessageSquare className="w-12 h-12 text-jme-purple mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Group Discussions</h3>
            <p className="text-gray-600">Participate in daily threads about nutrition, workouts, and wellness.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Heart className="w-12 h-12 text-jme-purple mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Progress Sharing</h3>
            <p className="text-gray-600">Share your transformation journey and celebrate victories together.</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <Trophy className="w-12 h-12 text-jme-purple mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Monthly Challenges</h3>
            <p className="text-gray-600">Join community challenges and compete for prizes and recognition.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-jme-purple to-purple-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Ready to Join Our Community?</h2>
          <Link
            to="/train"
            className="inline-block bg-white text-jme-purple font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Join Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Community;