import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Users, User, Mail, Lock, Key } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parent' | 'kid'>('parent');
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic-link'>('password');
  const [loading, setLoading] = useState(false);
  
  // Parent login form
  const [parentEmail, setParentEmail] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Kid login form
  const [pin, setPin] = useState('');
  
  const { login, kidLogin, register, requestMagicLink } = useAuth();

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isRegistering) {
        await register(parentEmail, parentPassword, parentName);
      } else if (loginMethod === 'password') {
        await login(parentEmail, parentPassword);
      } else {
        await requestMagicLink(parentEmail);
      }
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setLoading(false);
    }
  };

  const handleKidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) return;
    
    setLoading(true);
    try {
      await kidLogin(pin);
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-4"
          >
            <Sparkles className="w-16 h-16 text-primary-500 mx-auto" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-primary-600 mb-2">
            Chore App
          </h1>
          <p className="text-gray-600 text-lg">
            Fun chores for awesome kids! 🎉
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('parent')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'parent'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Parents
            </button>
            <button
              onClick={() => setActiveTab('kid')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === 'kid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              <User className="w-5 h-5 mr-2" />
              Kids
            </button>
          </div>

          {/* Parent Login */}
          {activeTab === 'parent' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Login Method Toggle */}
              <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setLoginMethod('password')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    loginMethod === 'password'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </button>
                <button
                  onClick={() => setLoginMethod('magic-link')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    loginMethod === 'magic-link'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  Magic Link
                </button>
              </div>

              <form onSubmit={handleParentSubmit} className="space-y-4">
                {isRegistering && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="input-field"
                      placeholder="Your name"
                      required={isRegistering}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="input-field"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                {loginMethod === 'password' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      className="input-field"
                      placeholder="••••••••"
                      required={loginMethod === 'password'}
                      minLength={6}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <>
                      {isRegistering ? 'Create Account' : loginMethod === 'password' ? 'Sign In' : 'Send Magic Link'}
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Kid Login */}
          {activeTab === 'kid' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="mb-6">
                <Key className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Enter Your PIN
                </h3>
                <p className="text-gray-600">
                  Ask your parent for your special 4-digit PIN!
                </p>
              </div>

              <form onSubmit={handleKidSubmit} className="space-y-6">
                <div className="flex justify-center space-x-3">
                  {[0, 1, 2, 3].map((index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={pin[index] || ''}
                      onChange={(e) => {
                        const newPin = pin.split('');
                        newPin[index] = e.target.value;
                        handlePinChange(newPin.join(''));
                        if (e.target.value && index < 3) {
                          const target = e.target as HTMLInputElement;
                          const nextInput = target.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement;
                          nextInput?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !pin[index] && index > 0) {
                          const target = e.target as HTMLInputElement;
                          const prevInput = target.parentElement?.previousElementSibling?.querySelector('input') as HTMLInputElement;
                          prevInput?.focus();
                        }
                      }}
                      className="pin-input"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || pin.length !== 4}
                  className="btn-secondary w-full flex items-center justify-center"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    'Enter Chore World! 🚀'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500">
          <p className="text-sm">
            Made with ❤️ for families everywhere
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage; 