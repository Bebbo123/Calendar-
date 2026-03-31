import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { TaskService } from '../services/taskService';
import { Task, SubTask, Priority, Category, RecurrenceFrequency } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  userId: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onTaskAdded, userId }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<Category>(Category.Work);
  const [priority, setPriority] = useState<Priority>(Priority.Medium);
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrom, setRecurrenceFrom] = useState('');
  const [recurrenceTo, setRecurrenceTo] = useState('');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSubTask = () => {
    if (!newSubTaskTitle.trim()) return;

    setSubtasks(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: newSubTaskTitle.trim(), completed: false },
    ]);
    setNewSubTaskTitle('');
  };

  const toggleSubTask = (id: string) => {
    setSubtasks(prev =>
      prev.map(st => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const deleteSubTask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const isValidRecurrenceRange = (): boolean => {
    if (!isRecurring) return true;
    if (!recurrenceFrom || !recurrenceTo) return false;
    const from = new Date(recurrenceFrom);
    const to = new Date(recurrenceTo);
    return from <= to;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    if (!isValidRecurrenceRange()) {
      alert('Intervallo ricorrenza non valido: assicurati che da <= a e siano impostati.');
      return;
    }

    setIsSubmitting(true);
    try {
      const recurrence = isRecurring && recurrenceFrom && recurrenceTo
        ? {
            from: new Date(recurrenceFrom),
            to: new Date(recurrenceTo),
            frequency: recurrenceFrequency,
          }
        : undefined;

      const effectiveDate = recurrence ? new Date(recurrenceFrom) : new Date(date);

      const newTask: Omit<Task, 'id'> = {
        title,
        date: effectiveDate,
        category,
        priority,
        notes: notes || undefined,
        completed: false,
        subtasks,
        recurrence,
      };

      if (recurrence) {
        await TaskService.addRecurringTasks(userId, newTask);
      } else {
        await TaskService.addTask(userId, newTask);
      }

      onTaskAdded();
      onClose();
      // Reset form
      setTitle('');
      setDate('');
      setCategory(Category.Work);
      setPriority(Priority.Medium);
      setNotes('');
      setSubtasks([]);
      setNewSubTaskTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Nuovo Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titolo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                if (isRecurring && !recurrenceFrom) {
                  setRecurrenceFrom(e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              required
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              <option value={Priority.Low}>Bassa</option>
              <option value={Priority.Medium}>Media</option>
              <option value={Priority.High}>Alta</option>
              <option value={Priority.Urgent}>Urgente</option>
            </select>
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
              disabled={isSubmitting}
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                id="recurring"
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <label htmlFor="recurring" className="text-sm text-gray-700">
                Task periodica
              </label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Da</label>
                  <input
                    type="date"
                    value={recurrenceFrom}
                    onChange={(e) => {
                      setRecurrenceFrom(e.target.value);
                      if (!date) {
                        setDate(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">A</label>
                  <input
                    type="date"
                    value={recurrenceTo}
                    onChange={(e) => setRecurrenceTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequenza</label>
                  <select
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="daily">Quotidiana</option>
                    <option value="weekly">Settimanale</option>
                    <option value="monthly">Mensile</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-800">Sotto-task</h3>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSubTaskTitle}
                onChange={(e) => setNewSubTaskTitle(e.target.value)}
                placeholder="Nuova sotto-task..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubTask())}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={addSubTask}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={isSubmitting}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {subtasks.length === 0 ? (
                <p className="text-gray-500 text-sm">Nessuna sotto-task</p>
              ) : (
                subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => toggleSubTask(subtask.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span className={subtask.completed ? 'line-through text-gray-500' : 'text-gray-800'}>
                        {subtask.title}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => deleteSubTask(subtask.id)}
                      className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                      aria-label="Elimina sottotask"
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:text-gray-400"
              disabled={isSubmitting}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

