import React from 'react';
import { Calendar, Plus, BarChart3, LogOut } from 'lucide-react';

interface SidebarProps {
  user: any;
  onAddTask: () => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onAddTask, onLogout, isOpen, onClose }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg p-6 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between mb-6 lg:hidden">
        <h1 className="text-xl font-bold">Menu</h1>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-800 mb-8">SmartCalendar+</h1>
      
      {/* User Info */}
      <div className="mb-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-1">Connesso come</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
        <p className="text-xs text-green-600 mt-1">🟢 Sincronizzato</p>
      </div>
      
      <nav className="space-y-4">
        <button className="flex items-center space-x-3 w-full p-3 rounded-lg bg-blue-50 text-blue-700">
          <Calendar size={20} />
          <span>Calendario</span>
        </button>
        <button
          onClick={onAddTask}
          className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-50"
        >
          <Plus size={20} />
          <span>Nuovo Task</span>
        </button>
        <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <BarChart3 size={20} />
          <span>Dashboard</span>
        </button>
      </nav>
      
      <button
        onClick={onLogout}
        className="mt-auto mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;