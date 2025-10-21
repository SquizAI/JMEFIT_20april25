import React, { useState } from 'react';
import { Mail, Send, CheckCircle, XCircle, Loader } from 'lucide-react';

interface EmailTestResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

const EmailTester: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [testType, setTestType] = useState<'basic' | 'welcome'>('basic');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailTestResult | null>(null);

  const testBasicEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/.netlify/functions/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult({
          success: true,
          message: 'Basic email test successful!',
          messageId: data.messageId
        });
      } else {
        setResult({
          success: false,
          message: 'Basic email test failed',
          error: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Request failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const testWelcomeEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/.netlify/functions/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerEmail: email,
          customerName: name,
          packageName: 'SHRED Challenge',
          stripeProductId: 'prod_SKFYIDF5hBEx3o',
          isTest: true
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult({
          success: true,
          message: 'Welcome email test successful!',
          messageId: data.messageId
        });
      } else {
        setResult({
          success: false,
          message: 'Welcome email test failed',
          error: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Request failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      setResult({
        success: false,
        message: 'Please fill in all fields',
        error: 'Email and name are required'
      });
      return;
    }

    if (testType === 'basic') {
      await testBasicEmail();
    } else {
      await testWelcomeEmail();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-jme-purple" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Email System Tester
        </h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="test@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Test User"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Type
          </label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value as 'basic' | 'welcome')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-jme-purple focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="basic">Basic Email Test</option>
            <option value="welcome">Welcome Email Test</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-jme-purple text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Test Email
            </>
          )}
        </button>
      </form>
      
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success 
            ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
            : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{result.message}</span>
          </div>
          
          {result.messageId && (
            <p className="text-sm opacity-80">Message ID: {result.messageId}</p>
          )}
          
          {result.error && (
            <p className="text-sm opacity-80">Error: {result.error}</p>
          )}
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Basic Email Test:</strong> Tests the core email functionality</li>
          <li>• <strong>Welcome Email Test:</strong> Tests the welcome email system used after purchases</li>
          <li>• Check your email inbox (including spam folder) for the test email</li>
          <li>• Use your real email address to verify delivery</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTester; 