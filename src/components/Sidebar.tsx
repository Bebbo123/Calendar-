import React from 'react';
import { Calendar, Plus, BarChart3 } from 'lucide-react';

interface SidebarProps {
  onAddTask: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddTask }) => {
  return (
    <aside className="w-64 bg-white shadow-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">SmartCalendar+</h1>
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
    </aside>
  );
};

export default Sidebar;