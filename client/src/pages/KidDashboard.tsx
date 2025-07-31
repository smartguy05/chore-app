import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckSquare, 
  Star, 
  Gift, 
  Trophy, 
  LogOut,
  Sparkles,
  Target,
  Award,
  Zap
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'completed';
  due_date: string;
  created_at: string;
  is_recurring?: boolean;
  recurring_type?: 'daily' | 'weekly' | 'monthly';
  recurring_days?: string;
  is_recurring_instance?: boolean;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  points_cost: number;
  canAfford: boolean;
}

const KidDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'profile'>('tasks');
  const [completingTask, setCompletingTask] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, rewardsRes] = await Promise.all([
        axios.get('/api/tasks/kid'),
        axios.get('/api/rewards/kid')
      ]);

      setTasks(tasksRes.data.tasks);
      setRewards(rewardsRes.data.rewards);
    } catch (error) {
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: number) => {
    setCompletingTask(taskId);
    try {
      const response = await axios.patch(`/api/tasks/${taskId}/complete`);
      const { pointsEarned, newTotalPoints, leveledUp, newLevel } = response.data;
      
      // Update tasks list
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Show success message
      toast.success(`🎉 Task completed! You earned ${pointsEarned} points!`);
      
      if (leveledUp) {
        toast.success(`🎊 LEVEL UP! You're now level ${newLevel}!`, { duration: 5000 });
      }
      
      // Refresh data to get updated points
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to complete task');
    } finally {
      setCompletingTask(null);
    }
  };

  const handleRedeemReward = async (rewardId: number) => {
    try {
      const response = await axios.post(`/api/rewards/${rewardId}/redeem`);
      const { reward, remainingPoints } = response.data;
      
      toast.success(`🎁 Reward redeemed: ${reward.title}!`);
      
      // Refresh data
      fetchDashboardData();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to redeem reward';
      toast.error(message);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600">Loading your awesome dashboard...</p>
        </div>
      </div>
    );
  }

  const progressToNextLevel = (user?.points || 0) % 100;
  const nextLevelPoints = 100 - progressToNextLevel;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="w-8 h-8 text-primary-500 mr-3" />
              </motion.div>
              <h1 className="text-2xl font-display font-bold text-primary-600">
                Hi, {user?.name}! 👋
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-primary-100 rounded-full px-4 py-2">
                <Star className="w-5 h-5 text-primary-600 mr-2" />
                <span className="font-bold text-primary-700">{user?.points || 0} points</span>
              </div>
              <div className="level-badge level-{user?.level || 1}">
                {user?.level || 1}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress to Level {(user?.level || 1) + 1}</span>
            <span className="text-sm text-gray-500">{progressToNextLevel}/100 points</span>
          </div>
          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${(progressToNextLevel / 100) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {nextLevelPoints} more points to level up! 🚀
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm mb-8">
          {[
            { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'profile', label: 'Profile', icon: Trophy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Target className="w-6 h-6 mr-2 text-primary-600" />
                  Your Tasks
                </h2>
                
                {tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet!</h3>
                    <p className="text-gray-600">Ask your parent to assign you some chores! 🎯</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`task-card ${task.difficulty} hover:shadow-lg transition-all duration-200`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{task.title}</h3>
                              {task.is_recurring && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  🔄 {task.recurring_type}
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center text-primary-600">
                                <Star className="w-4 h-4 mr-1" />
                                {task.points} points
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.difficulty === 'easy' 
                                  ? 'bg-success-100 text-success-800'
                                  : task.difficulty === 'medium'
                                  ? 'bg-warning-100 text-warning-800'
                                  : 'bg-danger-100 text-danger-800'
                              }`}>
                                {task.difficulty}
                              </span>
                              {task.due_date && (
                                <span className="text-gray-500">
                                  Due {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={completingTask === task.id}
                            className="btn-success ml-4 flex items-center"
                          >
                            {completingTask === task.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            ) : (
                              <Zap className="w-5 h-5 mr-2" />
                            )}
                            Complete!
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Gift className="w-6 h-6 mr-2 text-primary-600" />
                  Available Rewards
                </h2>
                
                {rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No rewards yet!</h3>
                    <p className="text-gray-600">Ask your parent to create some rewards! 🎁</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rewards.map((reward) => (
                      <motion.div
                        key={reward.id}
                        whileHover={{ scale: 1.02 }}
                        className={`reward-card ${reward.canAfford ? 'affordable' : 'unaffordable'}`}
                      >
                        <div className="text-center">
                          <h3 className="font-semibold text-gray-900 mb-2">{reward.title}</h3>
                          {reward.description && (
                            <p className="text-gray-600 text-sm mb-3">{reward.description}</p>
                          )}
                          <div className="flex items-center justify-center mb-4">
                            <Star className="w-5 h-5 text-primary-600 mr-2" />
                            <span className="font-bold text-primary-600">{reward.points_cost} points</span>
                          </div>
                          
                          <button
                            onClick={() => handleRedeemReward(reward.id)}
                            disabled={!reward.canAfford}
                            className={`w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                              reward.canAfford
                                ? 'bg-success-500 hover:bg-success-600 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {reward.canAfford ? 'Redeem! 🎉' : 'Not enough points'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-primary-600" />
                  Your Profile
                </h2>
                
                <div className="text-center">
                  <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-primary-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{user?.name}</h3>
                  <p className="text-gray-600 mb-6">Level {user?.level} Chore Champion! 🏆</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-primary-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-primary-600">{user?.points || 0}</div>
                      <div className="text-sm text-gray-600">Total Points</div>
                    </div>
                    <div className="bg-success-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-success-600">{user?.level || 1}</div>
                      <div className="text-sm text-gray-600">Current Level</div>
                    </div>
                    <div className="bg-secondary-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-secondary-600">
                        {Math.floor((user?.points || 0) / 100) + 1}
                      </div>
                      <div className="text-sm text-gray-600">Next Level</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KidDashboard; 