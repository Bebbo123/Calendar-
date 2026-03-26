import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TaskModal from './components/TaskModal';
import CalendarView from './features/calendar/CalendarView';
import DashboardStats from './features/dashboard/DashboardStats';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onAddTask={() => setIsModalOpen(true)} />
      <main className="flex-1 p-6">
        <DashboardStats refreshKey={refreshKey} />
        <CalendarView refreshKey={refreshKey} onTaskUpdate={handleTaskAdded} />
      </main>
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
};

export default App;