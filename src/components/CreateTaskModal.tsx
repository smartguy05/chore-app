import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Calendar, Users, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Kid {
  id: number;
  name: string;
  avatar: string;
}

interface CreateTaskModalProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [kidId, setKidId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKids, setLoadingKids] = useState(true);
  const [isAnybodyTask, setIsAnybodyTask] = useState(false);

  useEffect(() => {
    fetchKids();
  }, []);

  const fetchKids = async () => {
    try {
      const response = await axios.get('/api/parent/kids');
      setKids(response.data.kids);
      if (response.data.kids.length > 0 && !isAnybodyTask) {
        setKidId(response.data.kids[0].id);
      }
    } catch (error) {
      toast.error('Failed to load kids');
    } finally {
      setLoadingKids(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (kids.length > 0 && !kidId && !isAnybodyTask) {
      toast.error('Please select a kid for this task or make it an "anybody" task');
      return;
    }

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
        recurring_days: isRecurring ? recurringDays : null,
        is_anybody_task: isAnybodyTask
      };

      if (kidId && !isAnybodyTask) {
        taskData.kid_id = parseInt(kidId.toString());
      }

      console.log('Sending task data:', taskData);
      await axios.post('/api/tasks', taskData);
      toast.success('Task created successfully!');
      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error('Task creation error:', err.response?.data);
      if (err.response?.data?.errors) {
        const errorMessages = err.response.data.errors.map((e: any) => e.msg).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(err.response?.data?.error || 'Failed to create task');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-success-600 bg-success-100';
      case 'medium': return 'text-warning-600 bg-warning-100';
      case 'hard': return 'text-danger-600 bg-danger-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyIcon = (diff: string) => {
    switch (diff) {
      case 'easy': return '😊';
      case 'medium': return '😐';
      case 'hard': return '😰';
      default: return '📝';
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
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                <CheckSquare className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
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
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Clean your room, Do homework"
                required
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field w-full resize-none"
                placeholder="Add more details about the task..."
                rows={3}
                maxLength={500}
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
                    value={points}
                    onChange={(e) => setPoints(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="input-field w-full pr-10"
                    min="1"
                    max="100"
                    required
                  />
                  <Star className="w-5 h-5 text-yellow-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
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
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Difficulty Preview */}
            <div className={`p-3 rounded-lg ${getDifficultyColor(difficulty)}`}>
              <div className="flex items-center">
                <span className="text-2xl mr-2">{getDifficultyIcon(difficulty)}</span>
                <div>
                  <p className="font-medium capitalize">{difficulty} Task</p>
                  <p className="text-sm opacity-75">
                    {difficulty === 'easy' && 'Quick and simple tasks'}
                    {difficulty === 'medium' && 'Moderate effort required'}
                    {difficulty === 'hard' && 'Challenging tasks that take time'}
                  </p>
                </div>
              </div>
            </div>

            {/* Anybody Task Option */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnybodyTask}
                  onChange={(e) => {
                    setIsAnybodyTask(e.target.checked);
                    if (e.target.checked) {
                      setKidId(null);
                    } else if (kids.length > 0) {
                      setKidId(kids[0].id);
                    }
                  }}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Make this an "Anybody" Task
                  </span>
                  <p className="text-xs text-gray-500">
                    First kid to complete gets the points - encourages quick action!
                  </p>
                </div>
              </label>
            </div>

            {/* Assign to Kid */}
            {!loadingKids && !isAnybodyTask && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Kid {kids.length > 0 ? '*' : ''}
                </label>
                {kids.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">No kids added yet</p>
                    <p className="text-gray-500 text-xs">Add a kid first to assign tasks</p>
                  </div>
                ) : (
                  <select
                    value={kidId || ''}
                    onChange={(e) => setKidId(e.target.value ? parseInt(e.target.value) : null)}
                    className="input-field w-full"
                    required={!isAnybodyTask}
                  >
                    <option value="">Select a kid...</option>
                    {kids.map((kid) => (
                      <option key={kid.id} value={kid.id}>
                        {kid.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

                         {/* Due Date */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Due Date (Optional)
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

             {/* Recurring Task Options */}
             <div>
               <div className="flex items-center mb-4">
                 <input
                   type="checkbox"
                   id="isRecurring"
                   checked={isRecurring}
                   onChange={(e) => setIsRecurring(e.target.checked)}
                   className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                 />
                 <label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700">
                   Make this a recurring task
                 </label>
               </div>

               {isRecurring && (
                 <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Recurring Schedule
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
                       <div className="grid grid-cols-7 gap-2">
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
                             className={`p-2 text-xs font-medium rounded-lg transition-colors ${
                               recurringDays.includes(index)
                                 ? 'bg-primary-500 text-white'
                                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                         Day of the Month
                       </label>
                       <div className="grid grid-cols-7 gap-2">
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
                             className={`p-2 text-xs font-medium rounded-lg transition-colors ${
                               recurringDays.includes(day)
                                 ? 'bg-primary-500 text-white'
                                 : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                             }`}
                           >
                             {day}
                           </button>
                         ))}
                       </div>
                     </div>
                   )}

                   <div className="text-xs text-gray-500">
                     {recurringType === 'daily' && 'This task will appear every day'}
                     {recurringType === 'weekly' && `This task will appear on selected days each week`}
                     {recurringType === 'monthly' && `This task will appear on selected days each month`}
                   </div>
                 </div>
               )}
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
                disabled={loading || !title.trim() || (kids.length > 0 && !kidId && !isAnybodyTask)}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </div>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTaskModal; 