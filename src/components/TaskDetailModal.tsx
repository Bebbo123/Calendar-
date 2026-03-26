import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
import { TaskService } from '../services/taskService';
import { Task, SubTask, Priority, Category } from '../types';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, isOpen, onClose, onTaskUpdated }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<Category>(Category.Work);
  const [priority, setPriority] = useState<Priority>(Priority.Medium);
  const [notes, setNotes] = useState('');
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDate(task.date.toISOString().split('T')[0]);
      setCategory(task.category);
      setPriority(task.priority);
      setNotes(task.notes || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSave = () => {
    TaskService.updateTask(task.id, {
      title,
      date: new Date(date),
      category,
      priority,
      notes: notes || undefined,
    });
    onTaskUpdated();
  };

  const handleAddSubTask = () => {
    if (newSubTaskTitle.trim()) {
      TaskService.addSubTask(task.id, {
        title: newSubTaskTitle.trim(),
        completed: false,
      });
      setNewSubTaskTitle('');
      onTaskUpdated();
    }
  };

  const handleToggleSubTask = (subtaskId: string) => {
    const subtask = task.subtasks?.find(st => st.id === subtaskId);
    if (subtask) {
      TaskService.updateSubTask(task.id, subtaskId, { completed: !subtask.completed });
      onTaskUpdated();
    }
  };

  const handleDeleteSubTask = (subtaskId: string) => {
    TaskService.deleteSubTask(task.id, subtaskId);
    onTaskUpdated();
  };

  const completionPercentage = TaskService.getTaskCompletionPercentage(task);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Modifica Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={Category.Work}>Lavoro</option>
                <option value={Category.Personal}>Personale</option>
                <option value={Category.Finance}>Finanza</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={Priority.Low}>Bassa</option>
                <option value={Priority.Medium}>Media</option>
                <option value={Priority.High}>Alta</option>
                <option value={Priority.Urgent}>Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Completion Progress */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Completamento</span>
              <span className="text-sm text-gray-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Sotto-task</h3>

            {/* Add new subtask */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="Nuova sotto-task..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubTask()}
              />
              <button
                onClick={handleAddSubTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Subtasks list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {task.subtasks?.map(subtask => (
                <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      onChange={() => handleToggleSubTask(subtask.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                      {subtask.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubTask(subtask.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {(!task.subtasks || task.subtasks.length === 0) && (
                <p className="text-gray-500 text-sm">Nessuna sotto-task</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;