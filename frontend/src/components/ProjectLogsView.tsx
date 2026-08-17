import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  PlusCircle,
  ArrowRightLeft,
  UserCheck,
  Edit3,
  Trash2,
  MessageSquare,
  ShieldCheck,
  FolderGit2,
  Clock,
  User,
} from 'lucide-react';
import { ProjectLogItem } from '../types';
import { getAuthHeaders } from '../utils/api';

interface ProjectLogsViewProps {
  projectId: string;
}

export default function ProjectLogsView({ projectId }: ProjectLogsViewProps) {
  const [logs, setLogs] = useState<ProjectLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/logs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchLogs();
    }
  }, [projectId]);

  // Action badge and icon configuration
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'TASK_CREATED':
        return {
          label: 'Yeni Görev',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'TASK_STATUS_CHANGED':
        return {
          label: 'Durum Değişimi / Taşıma',
          color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case 'TASK_ASSIGNED':
        return {
          label: 'Personel Atama',
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <UserCheck className="w-3.5 h-3.5 text-purple-600" />,
        };
      case 'TASK_UPDATED':
        return {
          label: 'Görev Güncelleme',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Edit3 className="w-3.5 h-3.5 text-amber-600" />,
        };
      case 'TASK_DELETED':
        return {
          label: 'Görev Silindi',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
        };
      case 'COMMENT_ADDED':
        return {
          label: 'Yorum',
          color: 'bg-sky-50 text-sky-700 border-sky-200',
          icon: <MessageSquare className="w-3.5 h-3.5 text-sky-600" />,
        };
      case 'MEMBER_ROLE_CHANGED':
      case 'MEMBER_STATUS_CHANGED':
        return {
          label: 'Üye Yetkilendirme',
          color: 'bg-violet-50 text-violet-700 border-violet-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />,
        };
      case 'PROJECT_UPDATED':
      case 'PROJECT_CREATED':
        return {
          label: 'Proje İşlemi',
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <FolderGit2 className="w-3.5 h-3.5 text-blue-600" />,
        };
      default:
        return {
          label: action,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: <History className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  // Format relative timestamp
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Az önce';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dakika önce`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} gün önce`;
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      log.title.toLowerCase().includes(q) ||
      (log.user?.fullName && log.user.fullName.toLowerCase().includes(q)) ||
      (log.task?.title && log.task.title.toLowerCase().includes(q));
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Proje Aktivite & Değişiklik Logları</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proje üzerinde yapılan tüm ekleme, düzenleme, taşıma ve üye aktivitelerinin denetim kaydı. (Yalnızca Admin)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Loglarda veya kullanıcıda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 w-56 md:w-64"
            />
          </div>

          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="pl-3.5 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-600"
            >
              <option value="ALL">Tüm İşlemler</option>
              <option value="TASK_STATUS_CHANGED">Durum / Taşıma</option>
              <option value="TASK_CREATED">Yeni Görev</option>
              <option value="TASK_ASSIGNED">Personel Atama</option>
              <option value="TASK_UPDATED">Görev Güncelleme</option>
              <option value="TASK_DELETED">Görev Silme</option>
              <option value="COMMENT_ADDED">Yorumlar</option>
              <option value="MEMBER_ROLE_CHANGED">Üye Yetki Değişimi</option>
            </select>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
            title="Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Logs Timeline List */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-white border border-slate-200 rounded-2xl">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Log kayıtları yükleniyor...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">Henüz Bir Aktivite Logu Bulunamadı</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || actionFilter !== 'ALL'
              ? 'Seçilen filtrelere uygun log kaydı bulunamadı.'
              : 'Projede henüz bir görev veya üye aktivitesi gerçekleşmemiş.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100">
          {filteredLogs.map((log) => {
            const badge = getActionBadge(log.action);
            return (
              <div
                key={log.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex items-start space-x-4 text-xs"
              >
                {/* User Avatar */}
                <div className="shrink-0 mt-0.5">
                  {log.user?.avatar ? (
                    <img
                      src={log.user.avatar}
                      alt={log.user.fullName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {log.user?.fullName ? log.user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                {/* Log Content */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{log.user?.fullName || 'Kullanıcı'}</span>
                      {log.user?.role === 'ADMIN' && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                          Admin
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center space-x-1 font-semibold text-[10px] px-2 py-0.5 rounded-md border ${badge.color}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span title={log.createdAt ? new Date(log.createdAt).toLocaleString('tr-TR') : ''}>
                        {formatTimeAgo(log.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-700 font-medium">{log.title}</p>

                  {/* Optional JSON Details Pills */}
                  {log.details && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                      {log.details.old_status && log.details.new_status && (
                        <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 flex items-center space-x-1.5">
                          <span className="font-semibold">{log.details.old_status}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-bold text-indigo-600">{log.details.new_status}</span>
                        </div>
                      )}
                      {log.details.old_assigned_user && log.details.new_assigned_user && (
                        <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 flex items-center space-x-1.5">
                          <span className="text-slate-500">Atanan:</span>
                          <span className="font-semibold">{log.details.old_assigned_user}</span>
                          <span className="text-slate-400">➔</span>
                          <span className="font-bold text-purple-600">{log.details.new_assigned_user}</span>
                        </div>
                      )}
                      {log.details.comment_preview && (
                        <div className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600 italic line-clamp-1">
                          "{log.details.comment_preview}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
