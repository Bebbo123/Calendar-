import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TaskModal from './components/TaskModal';
import CalendarView from './features/calendar/CalendarView';
import DashboardStats from './features/dashboard/DashboardStats';
import Login from './components/Login';
import { 
  onAuthChange, 
  loginUser, 
  registerUser, 
  logoutUser,
  initializeSupabase
} from './services/supabaseService';

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Inizializza Supabase e ascolta lo stato di autenticazione
  useEffect(() => {
    const supabaseClient = initializeSupabase();
    
    if (supabaseClient) {
      // Supabase abilitato: ascolta i cambiamenti di autenticazione
      const unsubscribe = onAuthChange((authUser) => {
        setUser(authUser);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Supabase non configurato
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setLoginError(null);
      
      // Tenta login
      let loggedInUser = null;
      
      try {
        const user = await loginUser(email, password);
        loggedInUser = user;
      } catch (loginErr: any) {
        // Se login fallisce, tenta registrazione
        if (loginErr.message.includes('invalid') || loginErr.message.includes('not found')) {
          const user = await registerUser(email, password);
          loggedInUser = user;
        } else {
          throw loginErr;
        }
      }

      if (loggedInUser) {
        setUser(loggedInUser);
      }
    } catch (error: any) {
      console.error('Errore autenticazione:', error);
      setLoginError(
        error.message.includes('password')
          ? 'Password troppo debole (minimo 6 caratteri)'
          : 'Errore di accesso. Controlla le credenziali.'
      );
    }
  };

  const handleLogout = async () => {
    try {
      if (user) {
        await logoutUser();
        setUser(null);
      }
    } catch (error) {
      console.error('Errore logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:flex">
        <Sidebar
          user={user}
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
            <DashboardStats userId={user.id} />
            <CalendarView userId={user.id} onTaskUpdate={() => {}} />
          </main>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={() => {}}
        userId={user.id}
      />
    </div>
  );
};

export default App;