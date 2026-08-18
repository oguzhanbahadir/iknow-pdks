import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  BarChart3,
  ShieldAlert,
  Award,
  BookOpen,
  Settings,
  User,
  X,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'USER';
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ role, isMobileOpen, onCloseMobile }: SidebarProps) {
  const location = useLocation();

  const navigation = [
    {
      name: 'Özet Genel Bakış',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Görevler',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Projeler',
      href: '/projects',
      icon: FolderKanban,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Oryantasyon',
      href: '/orientation',
      icon: BookOpen,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Personel & CV Yönetimi',
      href: '/team',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      name: 'Analitik',
      href: '/effort',
      icon: BarChart3,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Profilim',
      href: '/profile',
      icon: User,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Sistem Ayarları',
      href: '/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  const content = (
    <div className="flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="px-2 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ana Menü</p>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 text-slate-400 hover:text-slate-700 md:hidden rounded-lg hover:bg-slate-100"
              aria-label="Menüyü Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onCloseMobile?.()}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Badge Footer Info */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-6">
        <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
          {role === 'ADMIN' ? (
            <>
              <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Yönetici Yetkisi Aktif</span>
            </>
          ) : (
            <>
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Personel Paneli</span>
            </>
          )}
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          {role === 'ADMIN'
            ? 'Tüm personelleri puanlayabilir, görev atayabilir ve CV kontrolü yapabilirsiniz.'
            : 'Kendi görevlerinizi tanımlayabilir ve aylık çalışma eforunuzu takip edebilirsiniz.'}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col min-h-[calc(100vh-4rem)] p-4 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white z-50 shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
