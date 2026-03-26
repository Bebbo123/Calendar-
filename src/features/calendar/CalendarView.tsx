import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { TaskService } from '../../services/taskService';
import { Task } from '../../types';
import { getPriorityColor } from '../../utils/priorityUtils';
import TaskDetailModal from '../../components/TaskDetailModal';
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

  useEffect(() => {
    setTasks(TaskService.getTasks());
  }, [refreshKey]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => isSameDay(task.date, day));
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

  const handleTaskUpdated = () => {
    setTasks(TaskService.getTasks());
    onTaskUpdate();
  };

  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  console.log('selectedDay:', selectedDay, 'selectedDayTasks:', selectedDayTasks);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
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
          {selectedDayTasks.length === 0 ? (
            <p className="text-gray-500">Nessun task per questo giorno</p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map(task => (
                <div key={task.id} className="p-3 bg-white rounded-lg shadow-sm border">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-gray-600">{task.category}</p>
                </div>
              ))}
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