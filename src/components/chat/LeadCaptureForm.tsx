import React, { useState } from 'react';
import { Mail, Phone, X, Check } from 'lucide-react';

interface LeadCaptureFormProps {
  type: 'email' | 'phone';
  reason: string;
  onSubmit: (value: string, type: 'email' | 'phone') => void;
  onCancel: () => void;
}

const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ 
  type, 
  reason, 
  onSubmit, 
  onCancel 
}) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validate = (val: string) => {
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(val);
      setIsValid(isValidEmail);
      setErrorMessage(isValidEmail || val.length === 0 ? '' : 'Please enter a valid email');
    } else {
      // Basic phone validation - at least 10 digits
      const phoneRegex = /^[0-9]{10,}$/;
      const digitsOnly = val.replace(/\D/g, '');
      setIsValid(phoneRegex.test(digitsOnly));
      setErrorMessage(phoneRegex.test(digitsOnly) || val.length === 0 ? '' : 'Please enter a valid phone number');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    validate(newValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(value, type);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md mb-3 w-full max-w-[350px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          {type === 'email' ? <Mail size={16} className="text-jme-purple" /> : <Phone size={16} className="text-jme-purple" />}
          {type === 'email' ? 'Share your email' : 'Share your phone number'}
        </h3>
        <button 
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cancel"
        >
          <X size={16} />
        </button>
      </div>
      
      <p className="text-xs text-gray-600 mb-3">{reason}</p>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <input
            type={type === 'email' ? 'email' : 'tel'}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={type === 'email' ? 'your.email@example.com' : '(123) 456-7890'}
            className={`w-full py-2 px-3 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              isFocused 
                ? 'border-jme-purple ring-jme-purple/20' 
                : errorMessage 
                  ? 'border-red-300 bg-red-50' 
                  : isValid && value 
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300'
            }`}
          />
          {isValid && value && (
            <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-green-500">
              <Check size={16} />
            </div>
          )}
        </div>
        
        {errorMessage && (
          <p className="text-xs text-red-500">{errorMessage}</p>
        )}
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Not now
          </button>
          <button
            type="submit"
            disabled={!isValid}
            className="flex-1 py-2 text-sm bg-gradient-to-r from-jme-purple to-jme-cyan text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {type === 'email' ? 'Share Email' : 'Share Phone'}
          </button>
        </div>
        
        <p className="text-[10px] text-gray-500 text-center">
          We respect your privacy and will only use your {type} to send you relevant information about JMEFit programs.
        </p>
      </form>
    </div>
  );
};

export default LeadCaptureForm; 