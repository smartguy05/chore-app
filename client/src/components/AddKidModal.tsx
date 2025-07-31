import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AddKidModalProps {
  onClose: () => void;
  onKidAdded: () => void;
}

const AddKidModal: React.FC<AddKidModalProps> = ({ onClose, onKidAdded }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState('default');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (pin.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error('PIN must contain only numbers');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/parent/kids', { name: name.trim(), pin, avatar });
      toast.success(`${name} has been added successfully!`);
      onKidAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add kid');
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Kid</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kid's Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Enter their name"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4-Digit PIN
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  className="input-field w-full pr-10"
                  placeholder="0000"
                  maxLength={4}
                  required
                  inputMode="numeric"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This PIN will be used by your kid to log in
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar
              </label>
              <select
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="input-field w-full"
              >
                <option value="default">Default Avatar</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
                <option value="robot">Robot</option>
                <option value="superhero">Superhero</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim() || pin.length !== 4}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Adding...
                  </div>
                ) : (
                  'Add Kid'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddKidModal; 