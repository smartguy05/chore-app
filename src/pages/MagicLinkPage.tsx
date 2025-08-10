import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, CheckCircle, XCircle, Loader } from 'lucide-react';

const MagicLinkPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithMagicLink } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No magic link token found');
      return;
    }

    const verifyToken = async () => {
      try {
        await loginWithMagicLink(token);
        setStatus('success');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.error || 'Failed to verify magic link');
      }
    };

    verifyToken();
  }, [token, loginWithMagicLink, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="card">
          {status === 'verifying' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <XCircle className="w-16 h-16 text-danger-500 mx-auto mb-4" />
            </motion.div>
          )}

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {status === 'verifying' && 'Verifying Magic Link...'}
            {status === 'success' && 'Welcome Back!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          <p className="text-gray-600 mb-6">
            {status === 'verifying' && 'Please wait while we verify your magic link...'}
            {status === 'success' && 'Your magic link was verified successfully! Redirecting...'}
            {status === 'error' && errorMessage}
          </p>

          {status === 'error' && (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              Back to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default MagicLinkPage; 