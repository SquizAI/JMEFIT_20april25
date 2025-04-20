import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowRight, Dumbbell, Scale, Target, CheckCircle2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

type FitnessGoal = 'lose-fat' | 'build-muscle' | 'get-stronger' | 'improve-health';
type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
type TrainingLocation = 'gym' | 'home' | 'both';

interface OnboardingFormData {
  fitnessGoals: FitnessGoal[];
  experienceLevel: ExperienceLevel | null;
  trainingLocation: TrainingLocation | null;
  height: string;
  weight: string;
  age: string;
  gender: 'male' | 'female' | 'other' | null;
  medicalConditions: string;
  dietaryRestrictions: string;
}

function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    fitnessGoals: [],
    experienceLevel: null,
    trainingLocation: null,
    height: '',
    weight: '',
    age: '',
    gender: null,
    medicalConditions: '',
    dietaryRestrictions: ''
  });

  const selectedPlan = location.state?.plan;

  const handleGoalToggle = (goal: FitnessGoal) => {
    setFormData(prev => ({
      ...prev,
      fitnessGoals: prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter(g => g !== goal)
        : [...prev.fitnessGoals, goal]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Save onboarding data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          fitness_goals: formData.fitnessGoals,
          experience_level: formData.experienceLevel,
          training_location: formData.trainingLocation,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          age: parseInt(formData.age),
          gender: formData.gender,
          medical_conditions: formData.medicalConditions,
          dietary_restrictions: formData.dietaryRestrictions
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // If there's a selected plan, proceed to checkout
      if (selectedPlan) {
        navigate('/checkout', { state: { plan: selectedPlan } });
      } else {
        navigate('/dashboard');
      }
      
      toast.success('Profile setup complete!');
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to save profile information');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">What are your fitness goals?</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'lose-fat', label: 'Lose Fat', icon: Scale },
                { id: 'build-muscle', label: 'Build Muscle', icon: Dumbbell },
                { id: 'get-stronger', label: 'Get Stronger', icon: Target },
                { id: 'improve-health', label: 'Improve Health', icon: CheckCircle2 }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleGoalToggle(id as FitnessGoal)}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.fitnessGoals.includes(id as FitnessGoal)
                      ? 'border-jme-purple bg-purple-50'
                      : 'border-gray-200 hover:border-jme-purple'
                  }`}
                >
                  <Icon className="w-8 h-8 mb-4 text-jme-purple" />
                  <p className="font-medium">{label}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">What's your experience level?</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'beginner', label: 'Beginner' },
                { id: 'intermediate', label: 'Intermediate' },
                { id: 'advanced', label: 'Advanced' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFormData(prev => ({ ...prev, experienceLevel: id as ExperienceLevel }))}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.experienceLevel === id
                      ? 'border-jme-purple bg-purple-50'
                      : 'border-gray-200 hover:border-jme-purple'
                  }`}
                >
                  <p className="font-medium">{label}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">Where will you train?</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'gym', label: 'At the Gym' },
                { id: 'home', label: 'At Home' },
                { id: 'both', label: 'Both' }
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFormData(prev => ({ ...prev, trainingLocation: id as TrainingLocation }))}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.trainingLocation === id
                      ? 'border-jme-purple bg-purple-50'
                      : 'border-gray-200 hover:border-jme-purple'
                  }`}
                >
                  <p className="font-medium">{label}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">Tell us about yourself</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as typeof formData.gender }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-8">Additional Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions or Injuries
                </label>
                <textarea
                  value={formData.medicalConditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicalConditions: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                  rows={3}
                  placeholder="List any relevant medical conditions or injuries..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dietary Restrictions
                </label>
                <textarea
                  value={formData.dietaryRestrictions}
                  onChange={(e) => setFormData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent"
                  rows={3}
                  placeholder="List any dietary restrictions or preferences..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.fitnessGoals.length > 0;
      case 2:
        return formData.experienceLevel !== null;
      case 3:
        return formData.trainingLocation !== null;
      case 4:
        return formData.height && formData.weight && formData.age && formData.gender;
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-jme-purple rounded-full transition-all"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600 text-right">
            Step {step} of 5
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="mt-12 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Back
            </button>
          )}
          <button
            onClick={() => step === 5 ? handleSubmit() : setStep(step + 1)}
            disabled={!canProceed() || loading}
            className={`ml-auto flex items-center px-6 py-2 rounded-lg bg-jme-purple text-white transition-all ${
              canProceed() && !loading
                ? 'hover:bg-purple-700'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {step === 5 ? 'Complete Setup' : 'Continue'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;