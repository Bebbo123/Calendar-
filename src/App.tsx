import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskModal from './components/TaskModal';
import CalendarView from './features/calendar/CalendarView';
import DashboardStats from './features/dashboard/DashboardStats';
import Login from './components/Login';

const STORAGE_AUTH_KEY = 'smart-calendar-auth';
const VALID_USER = { username: 'admin', password: 'password123' };

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_AUTH_KEY);
    setIsAuthenticated(saved === 'true');
  }, []);

  const handleTaskAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLogin = (username: string, password: string) => {
    if (username === VALID_USER.username && password === VALID_USER.password) {
      localStorage.setItem(STORAGE_AUTH_KEY, 'true');
      setIsAuthenticated(true);
    } else {
      alert('Credenziali non valide. Usa admin / password123.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_AUTH_KEY);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <Sidebar
          onAddTask={() => setIsModalOpen(true)}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className="flex-1 lg:ml-64">
          <header className="flex items-center justify-between p-4 bg-white border-b lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-md"
            >
              Menu
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500 text-white rounded-md"
            >
              Logout
            </button>
          </header>

          <main className="p-4 sm:p-6">
            <DashboardStats refreshKey={refreshKey} />
            <CalendarView refreshKey={refreshKey} onTaskUpdate={handleTaskAdded} />
          </main>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={handleTaskAdded}
      />
    </div>
  );
};

export default App;