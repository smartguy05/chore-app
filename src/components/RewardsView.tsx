import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Edit, Trash2, Plus, TrendingUp, Award, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Reward {
  id: number;
  title: string;
  description: string;
  points_cost: number;
  is_active: boolean;
  created_at: string;
}

interface RewardsViewProps {
  onRewardUpdated: () => void;
}

const RewardsView: React.FC<RewardsViewProps> = ({ onRewardUpdated }) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await axios.get('/api/rewards/parent');
      setRewards(response.data.rewards);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReward = async (rewardId: number) => {
    if (!window.confirm('Are you sure you want to delete this reward? This will also remove all redemption history.')) return;

    try {
      await axios.delete(`/api/rewards/${rewardId}`);
      toast.success('Reward deleted successfully');
      fetchRewards();
      onRewardUpdated();
    } catch (error) {
      console.error('Failed to delete reward:', error);
      toast.error('Failed to delete reward');
    }
  };

  const handleEditReward = (reward: Reward) => {
    setEditingReward(reward);
    setShowEditModal(true);
  };

  const handleRewardUpdated = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingReward(null);
    fetchRewards();
    onRewardUpdated();
  };

  const getPointsColor = (points: number) => {
    if (points <= 50) return 'text-green-600 bg-green-100';
    if (points <= 100) return 'text-yellow-600 bg-yellow-100';
    if (points <= 200) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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
        <h2 className="text-2xl font-bold text-gray-900">Rewards Store</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {rewards.length} reward{rewards.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Reward
          </button>
        </div>
      </div>

      {rewards.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first reward to motivate your kids!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Reward
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
                !reward.is_active ? 'opacity-60 border-gray-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                    <Gift className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                    {!reward.is_active && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditReward(reward)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit reward"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReward(reward.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete reward"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {reward.description && (
                <p className="text-gray-600 mb-4 text-sm">{reward.description}</p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPointsColor(reward.points_cost)}`}>
                    {reward.points_cost} points
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(reward.created_at).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Reward Modal */}
      {showAddModal && (
        <AddRewardModal
          onClose={() => setShowAddModal(false)}
          onRewardAdded={handleRewardUpdated}
        />
      )}

      {/* Edit Reward Modal */}
      {showEditModal && editingReward && (
        <EditRewardModal
          reward={editingReward}
          onClose={() => setShowEditModal(false)}
          onRewardUpdated={handleRewardUpdated}
        />
      )}
    </div>
  );
};

// Add Reward Modal Component
interface AddRewardModalProps {
  onClose: () => void;
  onRewardAdded: () => void;
}

const AddRewardModal: React.FC<AddRewardModalProps> = ({ onClose, onRewardAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState(50);
  const [loading, setLoading] = useState(false);

  // Fun default reward options
  const defaultRewards = [
    { title: '30 minutes extra screen time', description: 'Extra gaming or TV time on weekends', points: 50 },
    { title: 'Choose dinner for the family', description: 'Pick what everyone eats tonight!', points: 75 },
    { title: 'Skip one chore', description: 'Get out of doing one chore this week', points: 100 },
    { title: 'Friend sleepover', description: 'Have a friend over for a sleepover weekend', points: 200 },
    { title: 'Movie theater trip', description: 'Go see any movie you want at the theater', points: 150 },
    { title: 'Ice cream store visit', description: 'Pick any flavor and toppings you want', points: 80 },
    { title: 'Stay up 1 hour later', description: 'Extended bedtime for one night', points: 60 },
    { title: 'Pick the music in the car', description: 'Control the playlist for a whole week', points: 40 },
    { title: '$10 spending money', description: 'Cash to spend however you want', points: 250 },
    { title: 'New toy or book', description: 'Pick out something special under $20', points: 300 },
    { title: 'Arcade/Fun center trip', description: 'Spend an afternoon at your favorite fun place', points: 180 },
    { title: 'Special one-on-one time', description: 'Do any activity with mom or dad for 2 hours', points: 120 }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rewardData = {
        title: title.trim(),
        description: description.trim() || null,
        points_cost: pointsCost
      };

      await axios.post('/api/rewards', rewardData);
      toast.success('Reward created successfully');
      onRewardAdded();
    } catch (err: any) {
      console.error('Reward creation error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.error || 'Failed to create reward');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectDefaultReward = (reward: any) => {
    setTitle(reward.title);
    setDescription(reward.description);
    setPointsCost(reward.points);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add New Reward</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Select Options */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Select (or create your own below):</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {defaultRewards.map((reward, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectDefaultReward(reward)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-sm">{reward.title}</div>
                  <div className="text-xs text-gray-600 mt-1">{reward.description}</div>
                  <div className="text-xs text-primary-600 font-medium mt-1">{reward.points} points</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="Enter reward title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full"
                rows={3}
                placeholder="Describe what this reward includes"
              />
            </div>

            {/* Points Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points Cost *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(parseInt(e.target.value) || 1)}
                  className="input-field w-full pr-16"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 ml-1">points</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                💡 Suggestion: Use 50-100 points for small rewards, 100-200 for medium, 200+ for big rewards
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
                    Creating...
                  </div>
                ) : (
                  'Create Reward'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// Edit Reward Modal Component
interface EditRewardModalProps {
  reward: Reward;
  onClose: () => void;
  onRewardUpdated: () => void;
}

const EditRewardModal: React.FC<EditRewardModalProps> = ({ reward, onClose, onRewardUpdated }) => {
  const [title, setTitle] = useState(reward.title);
  const [description, setDescription] = useState(reward.description || '');
  const [pointsCost, setPointsCost] = useState(reward.points_cost);
  const [isActive, setIsActive] = useState(reward.is_active);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rewardData = {
        title: title.trim(),
        description: description.trim() || null,
        points_cost: pointsCost,
        is_active: isActive
      };

      await axios.put(`/api/rewards/${reward.id}`, rewardData);
      toast.success('Reward updated successfully');
      onRewardUpdated();
    } catch (err: any) {
      console.error('Reward update error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.error || 'Failed to update reward');
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
            <h2 className="text-xl font-semibold text-gray-900">Edit Reward</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reward Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="Enter reward title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full"
                rows={3}
                placeholder="Describe what this reward includes"
              />
            </div>

            {/* Points Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points Cost *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={pointsCost}
                  onChange={(e) => setPointsCost(parseInt(e.target.value) || 1)}
                  className="input-field w-full pr-16"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-500 ml-1">points</span>
                </div>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Reward is active (kids can redeem it)
              </label>
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
                  'Update Reward'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RewardsView;