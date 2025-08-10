import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Users, 
  CheckSquare, 
  Gift, 
  LogOut, 
  Settings,
  TrendingUp,
  Calendar,
  Star
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AddKidModal from '../components/AddKidModal';
import CreateTaskModal from '../components/CreateTaskModal';
import CheckinSettingsModal from '../components/CheckinSettingsModal';
import TasksView from '../components/TasksView';
import KidsView from '../components/KidsView';
import RewardsView from '../components/RewardsView';

interface Kid {
  id: number;
  name: string;
  avatar: string;
  points: number;
  level: number;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'completed' | 'cancelled';
  kid_id: number;
  kid_name: string;
  due_date: string;
  created_at: string;
  is_recurring?: boolean;
  recurring_type?: 'daily' | 'weekly' | 'monthly';
  recurring_days?: string;
  is_recurring_instance?: boolean;
}

interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_points_awarded: number;
}

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [kids, setKids] = useState<Kid[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'kids' | 'rewards'>('overview');
  const [showAddKid, setShowAddKid] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCheckinSettings, setShowCheckinSettings] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [kidsRes, tasksRes, statsRes] = await Promise.all([
        axios.get('/api/parent/kids'),
        axios.get('/api/tasks/parent'),
        axios.get('/api/tasks/stats/parent')
      ]);

      setKids(kidsRes.data.kids);
      setTasks(tasksRes.data.tasks);
      setStats(statsRes.data.stats);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your family dashboard...</p>
        </div>
      </div>
    );
  }

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
                <Star className="w-8 h-8 text-primary-500 mr-3" />
              </motion.div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                Family Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.name}!</span>
              <button
                onClick={() => setShowCheckinSettings(true)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                title="Check-in Settings"
              >
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </button>
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'tasks', label: 'Tasks', icon: CheckSquare },
            { id: 'kids', label: 'Kids', icon: Users },
            { id: 'rewards', label: 'Rewards', icon: Gift },
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
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card-hover">
                  <div className="flex items-center">
                    <div className="p-3 bg-primary-100 rounded-xl">
                      <CheckSquare className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.total_tasks || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card-hover">
                  <div className="flex items-center">
                    <div className="p-3 bg-success-100 rounded-xl">
                      <CheckSquare className="w-6 h-6 text-success-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.completed_tasks || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card-hover">
                  <div className="flex items-center">
                    <div className="p-3 bg-warning-100 rounded-xl">
                      <Calendar className="w-6 h-6 text-warning-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.pending_tasks || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="card-hover">
                  <div className="flex items-center">
                    <div className="p-3 bg-secondary-100 rounded-xl">
                      <Star className="w-6 h-6 text-secondary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Points Awarded</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.total_points_awarded || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kids Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Kids</h3>
                  {kids.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No kids added yet</p>
                      <button 
                        className="btn-primary mt-4"
                        onClick={() => setShowAddKid(true)}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Your First Kid
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {kids.map((kid) => (
                        <div key={kid.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-lg font-bold text-primary-600">
                                {kid.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <p className="font-semibold text-gray-900">{kid.name}</p>
                              <p className="text-sm text-gray-600">
                                Level {kid.level} • {kid.points} points
                              </p>
                            </div>
                          </div>
                          <div className="level-badge level-{kid.level}">
                            {kid.level}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No tasks created yet</p>
                      <button 
                        className="btn-primary mt-4"
                        onClick={() => setShowCreateTask(true)}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your First Task
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{task.title}</p>
                              {task.is_recurring && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  🔄 {task.recurring_type}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {task.kid_name} • {task.points} points
                              {task.due_date && (
                                <span className="ml-2">
                                  • Due {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.status === 'completed' 
                              ? 'bg-success-100 text-success-800'
                              : task.status === 'pending'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowCreateTask(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Task
                </button>
              </div>
              <TasksView onTaskUpdated={fetchDashboardData} />
            </div>
          )}

          {activeTab === 'kids' && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Kid Management</h2>
                <button 
                  className="btn-primary"
                  onClick={() => setShowAddKid(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Kid
                </button>
              </div>
              <KidsView onKidUpdated={fetchDashboardData} />
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <RewardsView onRewardUpdated={fetchDashboardData} />
            </div>
          )}
        </div>
      </div>

      {/* Add Kid Modal */}
      {showAddKid && (
        <AddKidModal
          onClose={() => setShowAddKid(false)}
          onKidAdded={fetchDashboardData}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onTaskCreated={fetchDashboardData}
        />
      )}

      {/* Check-in Settings Modal */}
      {showCheckinSettings && (
        <CheckinSettingsModal
          isOpen={showCheckinSettings}
          onClose={() => setShowCheckinSettings(false)}
          onSave={() => {
            // Settings saved, could refresh data if needed
          }}
        />
      )}
    </div>
  );
};

export default ParentDashboard; 