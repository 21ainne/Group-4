import { useState, useEffect } from 'react';
import { User } from './types';
import { getCurrentUser, logoutUser, resetToDemoData, initializeStorage } from './storage';
import { pullDataFromSupabase } from './services/supabaseService';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { InstructorDashboard } from './components/instructor/InstructorDashboard';
import { RegistrarDashboard } from './components/registrar/RegistrarDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [key, setKey] = useState<number>(0); // For forcing re-renders on reset
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    initializeStorage();
    const storedUser = getCurrentUser();
    if (storedUser) {
      setCurrentUser(storedUser);
    }

    // Background sync from Supabase to hydrate latest database updates
    pullDataFromSupabase().then((res) => {
      if (res.success) {
        setKey((prev) => prev + 1);
      }
    });
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setNotification(`Successfully signed in as ${user.fullName} (${user.role.toUpperCase()})`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setNotification('You have been signed out successfully.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo student records, classes, and attendance logs back to initial defaults?')) {
      resetToDemoData();
      setKey((prev) => prev + 1);
      setNotification('System data has been restored to factory sample records.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  if (!currentUser) {
    return (
      <div key={key}>
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in duration-200">
            {notification}
          </div>
        )}
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (currentUser.role === 'registrar') {
    return (
      <div key={key} className="min-h-screen bg-[#050a12] text-slate-100 font-sans selection:bg-[#1cd4bc] selection:text-black">
        {notification && (
          <div className="fixed top-4 right-4 z-50 bg-[#0b1220] text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-[#1cd4bc]/40 animate-in fade-in duration-200 print:hidden">
            {notification}
          </div>
        )}
        <RegistrarDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onResetData={handleResetData}
        />
      </div>
    );
  }

  return (
    <div key={key} className="min-h-screen bg-[#f0f3f6] text-slate-800 font-sans selection:bg-[#00c0ef] selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#0a3b5c] text-white text-xs px-4 py-2.5 rounded-xl shadow-xl border border-white/20 animate-in fade-in duration-200 print:hidden">
          {notification}
        </div>
      )}

      {/* Main Content for Instructor matching portal theme */}
      <main className="w-full">
        <InstructorDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onResetData={handleResetData}
        />
      </main>
    </div>
  );
}
