import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Phone, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react';

interface LoginPageProps {
  isDark: boolean;
  onLogin: (truecallerId: string, password: string, isRegistering: boolean) => void;
  error?: string;
}

export function LoginPage({ isDark, onLogin, error }: LoginPageProps) {
  const [truecallerId, setTruecallerId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Validate Truecaller ID format (starts with + and country code)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(truecallerId)) {
      setValidationError('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    
    // Simulate Truecaller verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    onLogin(truecallerId, password, isRegistering);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`w-full max-w-md p-8 rounded-3xl shadow-2xl ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Truecaller Login</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            AI Call Assistant requires Truecaller verification
          </p>
        </div>

        {/* Features List */}
        <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
          <p className="text-xs font-medium mb-3 uppercase tracking-wider text-gray-500">
            Why Truecaller?
          </p>
          <div className="space-y-2">
            {[
              'Identify unknown callers instantly',
              'Spam detection & blocking',
              'View caller location & carrier',
              'Sync call history across devices'
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input - Only for registration */}
          {isRegistering && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Name (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={`w-full px-4 py-3 rounded-xl outline-none transition-all ${
                    isDark 
                      ? 'bg-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500' 
                      : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
              </div>
            </motion.div>
          )}

          {/* Truecaller ID Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Truecaller ID (Phone Number)
            </label>
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type="tel"
                value={truecallerId}
                onChange={(e) => setTruecallerId(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all ${
                  isDark 
                    ? 'bg-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500' 
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                }`}
                required
              />
            </div>
            <p className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Enter your phone number with country code
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={`w-full pl-10 pr-12 py-3 rounded-xl outline-none transition-all ${
                  isDark 
                    ? 'bg-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500' 
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
              >
                {showPassword ? (
                  <EyeOff className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                ) : (
                  <Eye className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {(validationError || error) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/20 text-red-500 text-sm flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              {validationError || error}
            </motion.div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Verifying Truecaller ID...
              </span>
            ) : (
              isRegistering ? 'Create Account' : 'Login with Truecaller'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center space-y-3">
          {/* Toggle Login/Register */}
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </p>
          
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            By logging in, you agree to share your Truecaller profile with AI Call Assistant
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-500" />
            </div>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Secured by Truecaller
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
