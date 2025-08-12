import React, { useState, useEffect, useRef } from 'react';
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
  Zap,
  Calendar,
  CheckCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getLevelProgress, LevelProgress } from '../utils/levelingSystem';

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
  is_anybody_task?: boolean;
  completed_by_kid_name?: string;
  is_missed_opportunity?: boolean;
  completed_at?: string;
}

interface MissedTask {
  title: string;
  points: number;
  completed_at: string;
  completed_by_kid_name: string;
}

interface AnybodyTaskStats {
  anybodyTasksCompleted: number;
  extraPointsEarned: number;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  points_cost: number;
  canAfford: boolean;
}

interface CheckinStatus {
  hasCheckedIn: boolean;
  checkinData: {
    check_date: string;
    points_earned: number;
    created_at: string;
  } | null;
}

const KidDashboard: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'rewards' | 'profile'>('tasks');
  const [completingTask, setCompletingTask] = useState<number | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>({ hasCheckedIn: false, checkinData: null });
  const [checkingIn, setCheckingIn] = useState(false);
  const [missedTasks, setMissedTasks] = useState<MissedTask[]>([]);
  const [anybodyStats, setAnybodyStats] = useState<AnybodyTaskStats>({ anybodyTasksCompleted: 0, extraPointsEarned: 0 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, rewardsRes, checkinRes, missedRes, statsRes] = await Promise.all([
        axios.get('/api/tasks/kid'),
        axios.get('/api/rewards/kid'),
        axios.get('/api/checkin/status'),
        axios.get('/api/tasks/missed-opportunities'),
        axios.get('/api/tasks/anybody-stats')
      ]);

      setTasks(tasksRes.data.tasks);
      setRewards(rewardsRes.data.rewards);
      setCheckinStatus(checkinRes.data);
      setMissedTasks(missedRes.data.missedTasks);
      setAnybodyStats(statsRes.data);
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
      const { pointsEarned, newTotalPoints, leveledUp, newLevel, levelsGained, isAnybodyTask } = response.data;
      
      // Update tasks list
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      // Show success message
      if (isAnybodyTask) {
        toast.success(`🏆 First to complete! You earned ${pointsEarned} bonus points!`);
      } else {
        toast.success(`🎉 Task completed! You earned ${pointsEarned} points!`);
      }
      
      if (leveledUp) {
        const levelMessage = levelsGained > 1 
          ? `🎊 AMAZING! You jumped ${levelsGained} levels to level ${newLevel}!`
          : `🎊 LEVEL UP! You're now level ${newLevel}!`;
        toast.success(levelMessage, { duration: 5000 });
      }
      
      // Refresh data to get updated points and user info
      await Promise.all([fetchDashboardData(), refreshUser()]);
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
      
      // Refresh data and user info
      await Promise.all([fetchDashboardData(), refreshUser()]);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to redeem reward';
      toast.error(message);
    }
  };

  const handleCheckin = async () => {
    setCheckingIn(true);
    try {
      const response = await axios.post('/api/checkin/checkin');
      const { pointsEarned, newTotalPoints, leveledUp, newLevel, levelsGained } = response.data;
      
      toast.success(`🌟 Daily check-in complete! You earned ${pointsEarned} points!`);
      
      if (leveledUp) {
        const levelMessage = levelsGained > 1 
          ? `🎊 AMAZING! You jumped ${levelsGained} levels to level ${newLevel}!`
          : `🎊 LEVEL UP! You're now level ${newLevel}!`;
        toast.success(levelMessage, { duration: 5000 });
      }
      
      // Refresh data and user info to get updated status
      await Promise.all([fetchDashboardData(), refreshUser()]);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Check-in failed';
      toast.error(message);
    } finally {
      setCheckingIn(false);
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

  const levelProgress: LevelProgress = getLevelProgress((user?.experience_points ?? user?.points) || 0);

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
                <span className="font-bold text-primary-700">{(user?.spendable_points ?? user?.points) || 0} spendable</span>
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
            <span className="text-sm font-medium text-gray-700">Progress to Level {levelProgress.currentLevel + 1}</span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-yellow-50 rounded-full px-3 py-1">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-sm font-medium text-yellow-700">{(user?.spendable_points ?? user?.points) || 0} spendable</span>
              </div>
              <span className="text-sm text-gray-500">{levelProgress.pointsInCurrentLevel}/{levelProgress.pointsNeededForNextLevel} XP</span>
            </div>
          </div>
          <div className="progress-bar">
            <motion.div
              key={`progress-${(user?.experience_points ?? user?.points) || 0}-${levelProgress.currentLevel}`}
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress.progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {levelProgress.pointsToNextLevel} more points to level up! 🚀
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {levelProgress.pointsInCurrentLevel}/{levelProgress.pointsNeededForNextLevel} points to level {levelProgress.currentLevel + 1}
          </p>
        </div>
      </div>

      {/* Daily Check-in */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 text-primary-600 mr-2" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Daily Check-in</h3>
                <p className="text-sm text-gray-600">
                  {checkinStatus.hasCheckedIn 
                    ? `✅ Already checked in today! You earned ${checkinStatus.checkinData?.points_earned} points.`
                    : 'Check in today to earn bonus points!'
                  }
                </p>
              </div>
            </div>
            
            {!checkinStatus.hasCheckedIn && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckin}
                disabled={checkingIn}
                className="btn-primary flex items-center"
              >
                {checkingIn ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {checkingIn ? 'Checking in...' : 'Check In!'}
              </motion.button>
            )}
            
            {checkinStatus.hasCheckedIn && (
              <div className="flex items-center text-success-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Checked In!</span>
              </div>
            )}
          </div>
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
                        className={`task-card ${task.difficulty} ${
                          task.is_missed_opportunity 
                            ? 'opacity-60 bg-gray-100 border-gray-300 relative' 
                            : 'hover:shadow-lg'
                        } transition-all duration-200`}
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
                              {task.is_anybody_task && !task.is_missed_opportunity && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                  ⚡ First Come First Served
                                </span>
                              )}
                              {task.is_missed_opportunity && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                  😞 MISSED OPPORTUNITY
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
                          
                          {task.is_missed_opportunity ? (
                            <div className="ml-4 flex flex-col items-end">
                              <div className="text-sm font-medium text-orange-600 mb-1">
                                Missed {task.points} bonus points
                              </div>
                              <div className="text-xs text-gray-500">
                                Completed {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'recently'}
                              </div>
                              <div className="text-xs text-orange-600 font-medium mt-1">
                                Someone else got there first!
                              </div>
                            </div>
                          ) : (
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
                          )}
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Gift className="w-6 h-6 mr-2 text-primary-600" />
                    Available Rewards
                  </h2>
                  <div className="flex items-center bg-yellow-50 rounded-full px-4 py-2">
                    <Star className="w-5 h-5 text-yellow-500 mr-2" />
                    <span className="font-medium text-yellow-700">{(user?.spendable_points ?? user?.points) || 0} points to spend</span>
                  </div>
                </div>
                
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-primary-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-primary-600">{(user?.spendable_points ?? user?.points) || 0}</div>
                      <div className="text-sm text-gray-600">Spendable Points</div>
                    </div>
                    <div className="bg-success-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-success-600">{user?.level || 1}</div>
                      <div className="text-sm text-gray-600">Current Level</div>
                    </div>
                    <div className="bg-secondary-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-secondary-600">
                        {levelProgress.currentLevel + 1}
                      </div>
                      <div className="text-sm text-gray-600">Next Level</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-orange-600">{anybodyStats.extraPointsEarned}</div>
                      <div className="text-sm text-gray-600">Bonus Points</div>
                      <div className="text-xs text-gray-500">{anybodyStats.anybodyTasksCompleted} first-come tasks</div>
                    </div>
                  </div>
                  
                  {/* Missed Opportunities */}
                  {missedTasks.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Calendar className="w-5 h-5 text-orange-600 mr-2" />
                        Missed Opportunities (Last 7 Days)
                      </h4>
                      <div className="space-y-2">
                        {missedTasks.slice(0, 3).map((missed, index) => (
                          <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-orange-900">{missed.title}</p>
                                <p className="text-sm text-orange-700">
                                  Someone else completed this and earned {missed.points} points
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-orange-600">
                                  -{missed.points} pts
                                </div>
                                <div className="text-xs text-orange-500">
                                  {new Date(missed.completed_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {missedTasks.length > 3 && (
                          <p className="text-sm text-gray-500 text-center">
                            And {missedTasks.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
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