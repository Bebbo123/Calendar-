import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTasks } from '../../hooks/useTasks';
import { isTaskUrgent } from '../../utils/priorityUtils';
import { Task } from '../../types';

interface DashboardStatsProps {
  userId: string;
  onAddTask: () => void;
}

interface TaskStats {
  total: number;
  urgent: number;
  completed: number;
  dueThisWeek: number;
  dueToday: number;
  dueThisMonth: number;
  recurring: number;
  categoryCounts: {
    work: number;
    personal: number;
    finance: number;
  };
  weekData: Array<{ day: string; tasks: number; completed: number }>;
  todayTasks: Task[];
  weekTasks: Task[];
  monthTasks: Task[];
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ userId, onAddTask }) => {
  const { tasks, loading } = useTasks(userId);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    urgent: 0,
    completed: 0,
    dueThisWeek: 0,
    dueToday: 0,
    dueThisMonth: 0,
    recurring: 0,
    categoryCounts: {
      work: 0,
      personal: 0,
      finance: 0,
    },
    weekData: [],
    todayTasks: [],
    weekTasks: [],
    monthTasks: [],
  });

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    const monthFromNow = new Date(now);
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    // Task di oggi
    const todayTasks = tasks.filter(task => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === now.getTime() && !task.completed;
    });

    // Task della settimana
    const weekTasks = tasks.filter(task =>
      !task.completed && task.date >= now && task.date <= weekFromNow
    );

    // Task del mese
    const monthTasks = tasks.filter(task =>
      !task.completed && task.date >= now && task.date <= monthFromNow
    );

    // Statistiche generali
    const urgent = tasks.filter(task =>
      !task.completed && isTaskUrgent(task.date, task.priority)
    ).length;

    const completed = tasks.filter(task => task.completed).length;
    const recurring = tasks.filter(task => task.recurrence).length;

    // Conta task per categoria
    const categoryCounts = {
      work: tasks.filter((task) => task.category === 'work').length,
      personal: tasks.filter((task) => task.category === 'personal').length,
      finance: tasks.filter((task) => task.category === 'finance').length,
    };

    // Dati per il grafico settimanale
    const weekData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      const dayName = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][date.getDay()];

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === date.getTime();
      });

      const completedCount = dayTasks.filter(t => t.completed).length;
      const totalCount = dayTasks.length;

      weekData.push({
        day: dayName,
        tasks: totalCount,
        completed: completedCount,
      });
    }

    setStats({
      total: tasks.length,
      urgent,
      completed,
      dueThisWeek: weekTasks.length,
      dueToday: todayTasks.length,
      dueThisMonth: monthTasks.length,
      recurring,
      categoryCounts,
      weekData,
      todayTasks: todayTasks.sort((a, b) => {
        // Ordina per priorità urgenza
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
               (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
      }),
      weekTasks,
      monthTasks,
    });
  }, [tasks]);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          Caricamento statistiche...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pulsante Aggiungi Task */}
      <div className="flex justify-end">
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <span className="text-xl">+</span>
          Aggiungi Task
        </button>
      </div>

      {/* KPI Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Oggi</p>
              <p className="text-3xl font-bold text-gray-800">{stats.dueToday}</p>
            </div>
            <Calendar className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Questa Settimana</p>
              <p className="text-3xl font-bold text-gray-800">{stats.dueThisWeek}</p>
            </div>
            <Clock className="text-indigo-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Questo Mese</p>
              <p className="text-3xl font-bold text-gray-800">{stats.dueThisMonth}</p>
            </div>
            <TrendingUp className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Completati</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </div>
      </div>

      {/* Grafico Settimanale */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Andamento Settimanale</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.weekData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip 
              formatter={(value) => {
                if (typeof value === 'number') return value;
                return value;
              }}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="tasks" fill="#3b82f6" name="Totali" radius={[8, 8, 0, 0]} />
            <Bar dataKey="completed" fill="#10b981" name="Completati" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Task di Oggi */}
      {stats.todayTasks.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-blue-700">
            ⚡ {stats.todayTasks.length} task da completare oggi
          </p>
        </div>
      )}

      {/* Categorieche */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribuzione per Categoria</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Lavoro', value: stats.categoryCounts.work },
                  { name: 'Personale', value: stats.categoryCounts.personal },
                  { name: 'Finanza', value: stats.categoryCounts.finance },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Statistiche Generali */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Riepilogo</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Totale Task</span>
              <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Urgenti</span>
              <span className="text-2xl font-bold text-red-600">{stats.urgent}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Ricorrenti</span>
              <span className="text-2xl font-bold text-purple-600">{stats.recurring}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tasso Completamento</span>
              <span className="text-2xl font-bold text-green-600">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardStats;

