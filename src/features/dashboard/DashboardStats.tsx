import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { TaskService } from '../../services/taskService';
import { isTaskUrgent } from '../../utils/priorityUtils';

interface DashboardStatsProps {
  refreshKey: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ refreshKey }) => {
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    completed: 0,
  });

  useEffect(() => {
    const tasks = TaskService.getTasks();

    const urgent = tasks.filter(task =>
      !task.completed && isTaskUrgent(task.date, task.priority)
    ).length;

    const completed = tasks.filter(task => task.completed).length;

    setStats({
      total: tasks.length,
      urgent,
      completed,
    });
  }, [refreshKey]);

  return (
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
    </div>
  );
};

export default DashboardStats;