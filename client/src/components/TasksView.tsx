import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, RefreshCw, Calendar, Users, Star, CheckSquare, Clock, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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

interface TasksViewProps {
  onTaskUpdated: () => void;
}

const TasksView: React.FC<TasksViewProps> = ({ onTaskUpdated }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/api/tasks/parent');
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await axios.delete(`/api/tasks/${taskId}`);
      toast.success('Task deleted successfully');
      fetchTasks();
      onTaskUpdated();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleTaskUpdated = () => {
    setShowEditModal(false);
    setEditingTask(null);
    fetchTasks();
    onTaskUpdated();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800';
      case 'pending': return 'bg-warning-100 text-warning-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecurringDescription = (task: Task) => {
    if (!task.is_recurring || !task.recurring_type) return '';
    
    switch (task.recurring_type) {
      case 'daily':
        return '🔄 Daily';
      case 'weekly':
        const days = task.recurring_days ? JSON.parse(task.recurring_days) : [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = days.map((day: number) => dayNames[day]).join(', ');
        return `🔄 Weekly (${selectedDays})`;
      case 'monthly':
        const monthDays = task.recurring_days ? JSON.parse(task.recurring_days) : [];
        return `🔄 Monthly (${monthDays.join(', ')})`;
      default:
        return '🔄 Recurring';
    }
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
        <h2 className="text-2xl font-bold text-gray-900">All Tasks</h2>
        <div className="text-sm text-gray-600">
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
          <p className="mt-1 text-sm text-gray-500">Create your first task to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                    {task.is_recurring && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Recurring
                      </span>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 mb-3">{task.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      {task.points} points
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                      {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {task.kid_name || 'Unassigned'}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(task.due_date)}
                    </span>
                  </div>

                  {task.is_recurring && (
                    <div className="text-sm text-blue-600 mb-3">
                      {getRecurringDescription(task)}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditModal && editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setShowEditModal(false)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </div>
  );
};

// Edit Task Modal Component
interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdated: () => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose, onTaskUpdated }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [points, setPoints] = useState(task.points);
  const [difficulty, setDifficulty] = useState(task.difficulty);
  const [kidId, setKidId] = useState<number | null>(task.kid_id || null);
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.slice(0, 16) : '');
  const [isRecurring, setIsRecurring] = useState(task.is_recurring || false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>(task.recurring_type || 'daily');
  const [recurringDays, setRecurringDays] = useState<number[]>(task.recurring_days ? JSON.parse(task.recurring_days) : []);
  const [kids, setKids] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKids, setLoadingKids] = useState(true);

  useEffect(() => {
    fetchKids();
  }, []);

  const fetchKids = async () => {
    try {
      const response = await axios.get('/api/kids');
      setKids(response.data.kids);
    } catch (error) {
      console.error('Failed to fetch kids:', error);
    } finally {
      setLoadingKids(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const taskData: any = {
        title: title.trim(),
        description: description.trim() || null,
        points: parseInt(points.toString()),
        difficulty,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        recurring_type: isRecurring ? recurringType : null,
        recurring_days: isRecurring ? recurringDays : null
      };

      if (kidId) {
        taskData.kid_id = parseInt(kidId.toString());
      }

      await axios.put(`/api/tasks/${task.id}`, taskData);
      toast.success('Task updated successfully');
      onTaskUpdated();
    } catch (err: any) {
      console.error('Task update error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.error || 'Failed to update task');
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
            <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>
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
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="Enter task title"
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
                placeholder="Enter task description"
              />
            </div>

            {/* Points and Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value))}
                    className="input-field w-full pr-10"
                    required
                  />
                  <Star className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty *
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="input-field w-full"
                  required
                >
                  <option value="easy">Easy 😊</option>
                  <option value="medium">Medium 😐</option>
                  <option value="hard">Hard 😰</option>
                </select>
              </div>
            </div>

            {/* Assign to Kid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Kid
              </label>
              <select
                value={kidId || ''}
                onChange={(e) => setKidId(e.target.value ? parseInt(e.target.value) : null)}
                className="input-field w-full"
              >
                <option value="">Unassigned</option>
                {kids.map((kid) => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field w-full pr-10"
                />
                <Calendar className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Recurring Options */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                  Make this task recurring
                </label>
              </div>

              {isRecurring && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recurring Type
                    </label>
                    <select
                      value={recurringType}
                      onChange={(e) => setRecurringType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                      className="input-field w-full"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {recurringType === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of the Week
                      </label>
                      <div className="grid grid-cols-7 gap-1">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (recurringDays.includes(index)) {
                                setRecurringDays(recurringDays.filter(d => d !== index));
                              } else {
                                setRecurringDays([...recurringDays, index]);
                              }
                            }}
                            className={`p-2 text-xs rounded ${
                              recurringDays.includes(index)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {recurringType === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of the Month
                      </label>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              if (recurringDays.includes(day)) {
                                setRecurringDays(recurringDays.filter(d => d !== day));
                              } else {
                                setRecurringDays([...recurringDays, day]);
                              }
                            }}
                            className={`p-2 text-xs rounded ${
                              recurringDays.includes(day)
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  'Update Task'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default TasksView; 