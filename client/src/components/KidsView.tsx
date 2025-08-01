import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Star, Trophy, User, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getLevelProgress, LevelProgress } from '../utils/levelingSystem';

interface Kid {
  id: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
  created_at: string;
}

interface KidsViewProps {
  onKidUpdated: () => void;
}

const KidsView: React.FC<KidsViewProps> = ({ onKidUpdated }) => {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchKids();
  }, []);

  const fetchKids = async () => {
    try {
      const response = await axios.get('/api/parent/kids');
      setKids(response.data.kids);
    } catch (error) {
      console.error('Failed to fetch kids:', error);
      toast.error('Failed to load kids');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKid = async (kidId: number) => {
    if (!window.confirm('Are you sure you want to delete this kid? This will also delete all their tasks and progress.')) return;

    try {
      await axios.delete(`/api/kids/${kidId}`);
      toast.success('Kid deleted successfully');
      fetchKids();
      onKidUpdated();
    } catch (error) {
      console.error('Failed to delete kid:', error);
      toast.error('Failed to delete kid');
    }
  };

  const handleEditKid = (kid: Kid) => {
    setEditingKid(kid);
    setShowEditModal(true);
  };

  const handleKidUpdated = () => {
    setShowEditModal(false);
    setEditingKid(null);
    fetchKids();
    onKidUpdated();
  };

  const getAvatarEmoji = (avatar: string) => {
    const avatarMap: { [key: string]: string } = {
      'default': '👤',
      'boy': '👦',
      'girl': '👧',
      'baby': '👶',
      'cat': '🐱',
      'dog': '🐕',
      'rabbit': '🐰',
      'bear': '🐻',
      'penguin': '🐧',
      'dragon': '🐉',
      'unicorn': '🦄',
      'robot': '🤖',
      'alien': '👽',
      'ninja': '🥷',
      'princess': '👸',
      'prince': '🤴',
      'wizard': '🧙‍♂️',
      'fairy': '🧚‍♀️',
      'superhero': '🦸‍♂️',
      'astronaut': '👨‍🚀'
    };
    return avatarMap[avatar] || '👤';
  };

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-purple-100 text-purple-800';
    if (level >= 7) return 'bg-blue-100 text-blue-800';
    if (level >= 4) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">All Kids</h2>
        <div className="text-sm text-gray-600">
          {kids.length} kid{kids.length !== 1 ? 's' : ''}
        </div>
      </div>

      {kids.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No kids yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add your first kid to get started.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {kids.map((kid) => (
            <motion.div
              key={kid.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{getAvatarEmoji(kid.avatar)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{kid.name}</h3>
                    <p className="text-sm text-gray-500">Added {new Date(kid.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditKid(kid)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit kid"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteKid(kid.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete kid"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    Points
                  </span>
                  <span className="font-semibold text-gray-900">{kid.points}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm text-gray-600">
                    <Trophy className="w-4 h-4 mr-1 text-yellow-600" />
                    Level
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(kid.level)}`}>
                    Level {kid.level}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  {(() => {
                    const progress: LevelProgress = getLevelProgress(kid.points);
                    return (
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Progress to next level</span>
                          <span className="text-gray-900">
                            {progress.pointsInCurrentLevel}/{progress.pointsNeededForNextLevel}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress.progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 text-center">
                          {progress.pointsToNextLevel} points to level {progress.currentLevel + 1}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Kid Modal */}
      {showEditModal && editingKid && (
        <EditKidModal
          kid={editingKid}
          onClose={() => setShowEditModal(false)}
          onKidUpdated={handleKidUpdated}
        />
      )}
    </div>
  );
};

// Edit Kid Modal Component
interface EditKidModalProps {
  kid: Kid;
  onClose: () => void;
  onKidUpdated: () => void;
}

const EditKidModal: React.FC<EditKidModalProps> = ({ kid, onClose, onKidUpdated }) => {
  const [name, setName] = useState(kid.name);
  const [avatar, setAvatar] = useState(kid.avatar);
  const [points, setPoints] = useState(kid.points);
  const [level, setLevel] = useState(kid.level);
  const [loading, setLoading] = useState(false);

  const avatarOptions = [
    { value: 'default', emoji: '👤', label: 'Default' },
    { value: 'boy', emoji: '👦', label: 'Boy' },
    { value: 'girl', emoji: '👧', label: 'Girl' },
    { value: 'baby', emoji: '👶', label: 'Baby' },
    { value: 'cat', emoji: '🐱', label: 'Cat' },
    { value: 'dog', emoji: '🐕', label: 'Dog' },
    { value: 'rabbit', emoji: '🐰', label: 'Rabbit' },
    { value: 'bear', emoji: '🐻', label: 'Bear' },
    { value: 'penguin', emoji: '🐧', label: 'Penguin' },
    { value: 'dragon', emoji: '🐉', label: 'Dragon' },
    { value: 'unicorn', emoji: '🦄', label: 'Unicorn' },
    { value: 'robot', emoji: '🤖', label: 'Robot' },
    { value: 'alien', emoji: '👽', label: 'Alien' },
    { value: 'ninja', emoji: '🥷', label: 'Ninja' },
    { value: 'princess', emoji: '👸', label: 'Princess' },
    { value: 'prince', emoji: '🤴', label: 'Prince' },
    { value: 'wizard', emoji: '🧙‍♂️', label: 'Wizard' },
    { value: 'fairy', emoji: '🧚‍♀️', label: 'Fairy' },
    { value: 'superhero', emoji: '🦸‍♂️', label: 'Superhero' },
    { value: 'astronaut', emoji: '👨‍🚀', label: 'Astronaut' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const kidData = {
        name: name.trim(),
        avatar,
        points: parseInt(points.toString()),
        level: parseInt(level.toString())
      };

      await axios.put(`/api/kids/${kid.id}`, kidData);
      toast.success('Kid updated successfully');
      onKidUpdated();
    } catch (err: any) {
      console.error('Kid update error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.error || 'Failed to update kid');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Kid</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Enter kid's name"
                required
              />
            </div>

            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAvatar(option.value)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      avatar === option.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={option.label}
                  >
                    <div className="text-2xl">{option.emoji}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Points and Level */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    className="input-field w-full pr-10"
                  />
                  <Star className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={level}
                    onChange={(e) => setLevel(parseInt(e.target.value))}
                    className="input-field w-full pr-10"
                  />
                  <Trophy className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Kid'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default KidsView; 