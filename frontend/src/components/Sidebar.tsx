import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, BarChart3, ShieldAlert, Award } from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'USER';
}

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();

  const navigation = [
    {
      name: 'Özet Genel Bakış',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Görevler (Kanban & Liste)',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['ADMIN', 'USER'],
    },
    {
      name: 'Personel & CV Yönetimi',
      href: '/interns',
      icon: Users,
      roles: ['ADMIN'],
    },
    {
      name: 'Aylık Efor & Analitik',
      href: '/effort',
      icon: BarChart3,
      roles: ['ADMIN', 'USER'],
    },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between min-h-[calc(100vh-4rem)] p-4">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ana Menü</p>
        </div>
        <nav className="space-y-1">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
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
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center space-x-2 text-xs text-slate-700 font-semibold">
          {role === 'ADMIN' ? (
            <>
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Yönetici Yetkisi Aktif</span>
            </>
          ) : (
            <>
              <Award className="w-4 h-4 text-emerald-600" />
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
    </aside>
  );
}
