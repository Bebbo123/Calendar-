import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { isTaskUrgent } from '../../utils/priorityUtils';

interface DashboardStatsProps {
  userId: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ userId }) => {
  const { tasks, loading } = useTasks(userId);
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    completed: 0,
    dueThisWeek: 0,
    recurring: 0,
    categoryCounts: {
      work: 0,
      personal: 0,
      finance: 0,
    },
  });

  useEffect(() => {
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const urgent = tasks.filter(task =>
      !task.completed && isTaskUrgent(task.date, task.priority)
    ).length;

    const completed = tasks.filter(task => task.completed).length;

    const dueThisWeek = tasks.filter(task =>
      !task.completed && task.date >= now && task.date <= weekFromNow
    ).length;

    const recurring = tasks.filter(task => task.recurrence).length;

    const categoryCounts = {
      work: tasks.filter((task) => task.category === 'work').length,
      personal: tasks.filter((task) => task.category === 'personal').length,
      finance: tasks.filter((task) => task.category === 'finance').length,
    };

    setStats({
      total: tasks.length,
      urgent,
      completed,
      dueThisWeek,
      recurring,
      categoryCounts,
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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Clock className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Totale Scadenze</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Clock className="text-indigo-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Scadenze 7 giorni</p>
              <p className="text-2xl font-bold text-gray-800">{stats.dueThisWeek}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Urgenti</p>
              <p className="text-2xl font-bold text-gray-800">{stats.urgent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Completati</p>
              <p className="text-2xl font-bold text-gray-800">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Clock className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Ricorrenti</p>
              <p className="text-2xl font-bold text-gray-800">{stats.recurring}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600">Lavoro</p>
          <p className="text-2xl font-bold text-gray-800">{stats.categoryCounts.work}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600">Personale</p>
          <p className="text-2xl font-bold text-gray-800">{stats.categoryCounts.personal}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600">Finanza</p>
          <p className="text-2xl font-bold text-gray-800">{stats.categoryCounts.finance}</p>
        </div>
      </div>
    </>
  );
};

