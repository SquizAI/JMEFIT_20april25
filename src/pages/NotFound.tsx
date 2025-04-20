import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Dumbbell, ArrowRight, RefreshCw } from 'lucide-react';
import SEO from '../components/SEO';

const WORKOUT_JOKES = [
  "Looks like this page skipped leg day!",
  "This page is taking a rest day... permanently.",
  "404: Gains not found",
  "This page must be doing cardio, because it's nowhere to be seen!",
  "Oops! This page needs a spotter",
];

const EXERCISE_SUGGESTIONS = [
  { name: '10 Push-ups', icon: '💪' },
  { name: '20 Squats', icon: '🏋️' },
  { name: '30s Plank', icon: '🧘' },
  { name: '15 Jumping Jacks', icon: '⭐' },
];

function NotFound() {
  const [joke, setJoke] = useState('');
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    setJoke(WORKOUT_JOKES[Math.floor(Math.random() * WORKOUT_JOKES.length)]);
  }, []);

  const handleExerciseClick = (index: number) => {
    setCompletedExercises(prev => [...prev, index]);
    setIsSpinning(true);
    setTimeout(() => setIsSpinning(false), 1000);
  };

  return (
    <>
      <SEO 
        title="Page Not Found" 
        description="404 - Page not found. But don't worry, we've got some exercises for you while you're here!"
        noindex={true}
      />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-jme-purple flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="relative mb-8 inline-block">
            <Dumbbell 
              className={`w-32 h-32 text-white ${isSpinning ? 'animate-spin' : 'animate-bounce'}`}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="text-5xl font-bold text-jme-purple">404</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {joke}
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            While you're here, why not get a quick workout in?
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {EXERCISE_SUGGESTIONS.map((exercise, index) => (
              <button
                key={index}
                onClick={() => handleExerciseClick(index)}
                className={`p-4 rounded-xl transition-all transform hover:scale-105 ${
                  completedExercises.includes(index)
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="text-3xl mb-2">{exercise.icon}</div>
                <div className="font-semibold">{exercise.name}</div>
                {completedExercises.includes(index) && (
                  <div className="text-sm">Completed! 🎉</div>
                )}
              </button>
            ))}
          </div>

          {completedExercises.length === EXERCISE_SUGGESTIONS.length && (
            <div className="bg-green-500 text-white p-4 rounded-lg mb-8 animate-bounce">
              <p className="font-bold">Amazing workout! 🎉</p>
              <p>You've completed all exercises while being lost!</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-all group"
            >
              <Home className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              Back to Home
            </Link>
            <Link
              to="/programs"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-jme-purple text-white hover:bg-purple-700 transition-all group"
            >
              <Dumbbell className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
              View Programs
            </Link>
            <Link
              to="/train"
              className="inline-flex items-center px-6 py-3 rounded-lg border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all group"
            >
              Start Training
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center text-gray-400">
            <RefreshCw className={`w-5 h-5 mr-2 ${isSpinning ? 'animate-spin' : ''}`} />
            Getting stronger by the second...
          </div>
        </div>
      </div>
    </>
  );
}

export default NotFound;