import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { TaskService } from '../../services/taskService';
import { Task, Category, Priority } from '../../types';
import { getPriorityColor } from '../../utils/priorityUtils';
import TaskDetailModal from '../../components/TaskDetailModal';
import { onTasksChange } from '../../services/firebaseService';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameDay,
} from 'date-fns';

interface CalendarViewProps {
  refreshKey: number;
  onTaskUpdate: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ refreshKey, onTaskUpdate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Category>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Priority>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [isRemoteEnabled] = useState<boolean>(TaskService.isRemoteEnabled());
  const [syncStatus, setSyncStatus] = useState<string>('idle');

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setSyncStatus('syncing');
        const synced = await TaskService.syncTasks();
        setTasks(synced);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Sync error', error);
        setSyncStatus('error');
      }
    };

    loadTasks();

    if (isRemoteEnabled) {
      const unsubscribe = onTasksChange((newTasks) => {
        setTasks(newTasks);
      });
      return () => {
        unsubscribe && unsubscribe();
      };
    }

    return undefined;
  }, [refreshKey]);

  useEffect(() => {
    if (!isRemoteEnabled) return;

    const interval = setInterval(async () => {
      try {
        const synced = await TaskService.syncTasks();
        setTasks(synced);
        setSyncStatus('synced');
      } catch (error) {
        console.error('Polling sync error', error);
        setSyncStatus('error');
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isRemoteEnabled]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isRecurringTaskOnDay = (task: Task, day: Date): boolean => {
    if (!task.recurrence) return false;

    const { from, to, frequency } = task.recurrence;
    if (day < from || day > to) return false;

    switch (frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return day.getDay() === from.getDay();
      case 'monthly':
        return day.getDate() === from.getDate();
      default:
        return false;
    }
  };

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      const isTemplate = task.recurrence && task.isRecurringTemplate;
      const isLegacyRecurring = task.recurrence && !task.recurrenceMasterId && !task.isRecurringTemplate;

      if (isTemplate) {
        // template tasks are only the recurrence definition, instances are shown instead
        return false;
      }
      if (isLegacyRecurring) {
        return isRecurringTaskOnDay(task, day);
      }

      return isSameDay(task.date, day);
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo task?')) {
      TaskService.deleteTask(taskId);
      setTasks(TaskService.getTasks());
      onTaskUpdate();
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const toggleTaskCompletion = (task: Task) => {
    TaskService.updateTask(task.id, { completed: !task.completed });
    setTasks(TaskService.getTasks());
    onTaskUpdate();
  };

  const handleTaskUpdated = () => {
    setTasks(TaskService.getTasks());
    onTaskUpdate();
  };

  const selectedDayTasks = selectedDay
    ? getTasksForDay(selectedDay).filter(task =>
        (filterCategory === 'all' || task.category === filterCategory) &&
        (filterPriority === 'all' || task.priority === filterPriority) &&
        (filterStatus === 'all' ||
          (filterStatus === 'completed' && task.completed) ||
          (filterStatus === 'pending' && !task.completed))
      )
    : [];

  console.log('selectedDay:', selectedDay, 'selectedDayTasks:', selectedDayTasks);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <span className="text-sm text-gray-600">
          Stato sync: {isRemoteEnabled ? 'Firebase realtime' : 'Offline (localStorage)'} - {syncStatus}
        </span>
        <button
          onClick={async () => {
            try {
              setSyncStatus('syncing');
              const synced = await TaskService.syncTasks();
              setTasks(synced);
              setSyncStatus('synced');
            } catch (error) {
              setSyncStatus('error');
            }
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Sincronizza ora
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                console.log('Clicked day:', day);
                setSelectedDay(day);
              }}
              className={`
                h-16 p-2 text-left border rounded-lg hover:bg-gray-50 transition-colors
                ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${isTodayDate ? 'bg-blue-50 border-blue-200' : 'border-gray-200'}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className="text-sm font-medium mb-1">
                {format(day, 'd')}
              </div>
              <div className="flex flex-wrap gap-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}
                    title={task.title}
                  />
                ))}
                {dayTasks.length > 3 && (
                  <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${dayTasks.length - 3} più`} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Task del {selectedDay.toLocaleDateString('it-IT')}
          </h3>
          <div className="flex flex-wrap gap-3 items-center mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Categoria</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as 'all' | Category)}
                className="px-2 py-1 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutte</option>
                <option value={Category.Work}>Lavoro</option>
                <option value={Category.Personal}>Personale</option>
                <option value={Category.Finance}>Finanza</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Priorità</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as 'all' | Priority)}
                className="px-2 py-1 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutte</option>
                <option value={Priority.Low}>Bassa</option>
                <option value={Priority.Medium}>Media</option>
                <option value={Priority.High}>Alta</option>
                <option value={Priority.Urgent}>Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Stato</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'completed' | 'pending')}
                className="px-2 py-1 border border-gray-300 rounded-lg"
              >
                <option value="all">Tutti</option>
                <option value="completed">Completati</option>
                <option value="pending">Non completati</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-sm text-gray-600">
              {selectedDayTasks.length} task trovati
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const pendingTasks = selectedDayTasks.filter(t => !t.completed);
                  pendingTasks.forEach((task) => TaskService.updateTask(task.id, { completed: true }));
                  setTasks(TaskService.getTasks());
                  onTaskUpdate();
                }}
                className="px-3 py-1 text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                Completa tutti
              </button>
              <button
                onClick={() => {
                  const toDelete = selectedDayTasks.filter(t => t.completed);
                  toDelete.forEach((task) => TaskService.deleteTask(task.id));
                  setTasks(TaskService.getTasks());
                  onTaskUpdate();
                }}
                className="px-3 py-1 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Elimina completati
              </button>
            </div>
          </div>
          {selectedDayTasks.length === 0 ? (
            <p className="text-gray-500">Nessun task per questo giorno</p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map(task => {
                const completion = TaskService.getTaskCompletionPercentage(task);
                return (
                  <div key={task.id} className="p-3 bg-white rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskCompletion(task)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          aria-label={`Completa task ${task.title}`}
                        />
                        <span className={task.completed ? 'line-through text-gray-400' : 'text-gray-800'}>
                          {task.title}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                          aria-label={`Modifica ${task.title}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          aria-label={`Elimina ${task.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progresso</span>
                        <span>{completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default CalendarView;