import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand Logo & Title */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg tracking-wider shadow-sm">
          IK
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-base tracking-tight">IKnow Technology</span>
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-indigo-100">
              PDKS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Personel & Görev Yönetim Portalı</p>
        </div>
      </div>

      {/* Right User Actions */}
      {user && (
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {/* Circular Name Initial Avatar */}
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-semibold text-slate-900 leading-tight">{user.fullName}</span>
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
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 px-3 py-2 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Çıkış</span>
          </button>
        </div>
      )}
    </header>
  );
}
