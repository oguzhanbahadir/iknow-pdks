import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OnboardingWizard from './components/OnboardingWizard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import InternsPage from './pages/InternsPage';
import InternDetailPage from './pages/InternDetailPage';
import EffortPage from './pages/EffortPage';
import { User } from './types';
import { getAuthHeaders } from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('pdks_token');
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('pdks_token');
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('pdks_token');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Sistem yükleniyor...
      </div>
    );
  }

  const showOnboarding = currentUser && currentUser.role === 'USER' && !currentUser.isOnboarded;

  return (
    <BrowserRouter>
      {currentUser ? (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans relative">
          <Header user={currentUser} onLogout={handleLogout} />
          <div className="flex flex-1">
            <Sidebar role={currentUser.role} />
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
              <Routes>
                <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} />} />
                <Route path="/tasks" element={<TasksPage currentUser={currentUser} />} />
                <Route path="/interns" element={<InternsPage currentUser={currentUser} />} />
                <Route path="/interns/:id" element={<InternDetailPage />} />
                <Route path="/effort" element={<EffortPage currentUser={currentUser} />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </div>

          {showOnboarding && (
            <OnboardingWizard
              currentUser={currentUser}
              onComplete={(updatedUser) => setCurrentUser(updatedUser)}
            />
          )}
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<LoginPage onLoginSuccess={setCurrentUser} />} />
          <Route path="/login" element={<LoginPage onLoginSuccess={setCurrentUser} />} />
          <Route path="/register" element={<RegisterPage onLoginSuccess={setCurrentUser} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
