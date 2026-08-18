import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onToggleSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export default function Header({
  user,
  onLogout,
  onToggleSidebar,
  isMobileSidebarOpen,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu Button & Brand Logo */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {user && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden focus:outline-none"
            aria-label="Menüyü Aç/Kapat"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        {/* Brand Logo & Title */}
        <div
          className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg tracking-wider shadow-sm shrink-0">
            IK
          </div>
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate max-w-[130px] sm:max-w-none">
                IKnow Tech
              </span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                PDKS
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium hidden sm:block">
              Personel & Görev Yönetim Portalı
            </p>
          </div>
        </div>
      </div>

      {/* Right User Actions */}
      {user && (
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center space-x-2 sm:space-x-3 bg-slate-50 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200">
            {/* Circular Name Initial Avatar */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs shrink-0">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                  {user.fullName}
                </span>
                {user.role === 'ADMIN' ? (
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs tracking-wide uppercase">
                    Admin
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded-xs tracking-wide uppercase">
                    Personel
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 hover:border-red-200 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      )}
    </header>
  );
}
