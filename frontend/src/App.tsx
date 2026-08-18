import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import OnboardingWizard from './components/OnboardingWizard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import InternsPage from './pages/InternsPage';
import InternDetailPage from './pages/InternDetailPage';
import EffortPage from './pages/EffortPage';
import OrientationPage from './pages/OrientationPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import MailboxPage from './pages/MailboxPage';
import { User } from './types';
import { getAuthHeaders } from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
          <Header
            user={currentUser}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
            isMobileSidebarOpen={isMobileSidebarOpen}
          />
          <div className="flex flex-1">
            <Sidebar
              role={currentUser.role}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
            <main className="flex-1 p-3.5 sm:p-5 md:p-6 max-w-7xl mx-auto w-full min-w-0">
              <Routes>
                <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} />} />
                <Route path="/tasks" element={<TasksPage currentUser={currentUser} />} />
                <Route path="/projects" element={<ProjectsPage currentUser={currentUser} />} />
                <Route path="/projects/:id" element={<ProjectDetailPage currentUser={currentUser} />} />
                <Route
                  path="/mailbox"
                  element={
                    currentUser.role === 'ADMIN' ? (
                      <MailboxPage currentUser={currentUser} />
                    ) : (
                      <Navigate to="/dashboard" replace />
                    )
                  }
                />
                <Route path="/team" element={<InternsPage currentUser={currentUser} />} />
                <Route path="/team/:id" element={<InternDetailPage />} />
                <Route path="/interns" element={<Navigate to="/team" replace />} />
                <Route path="/interns/:id" element={<Navigate to="/team" replace />} />
                <Route path="/effort" element={<EffortPage currentUser={currentUser} />} />
                <Route path="/orientation" element={<OrientationPage currentUser={currentUser} />} />
                <Route path="/profile" element={<ProfilePage currentUser={currentUser} setCurrentUser={setCurrentUser} />} />
                <Route path="/settings" element={<SettingsPage currentUser={currentUser} />} />
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
