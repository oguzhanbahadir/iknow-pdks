import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Users,
  Clock,
  Award,
  Plus,
  ArrowRight,
  Kanban,
  FileText,
  TrendingUp,
  FolderKanban,
} from 'lucide-react';
import { User, TaskItem, Project } from '../types';
import { getAuthHeaders } from '../utils/api';

interface DashboardPageProps {
  currentUser: User;
}

export default function DashboardPage({ currentUser }: DashboardPageProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tasksRes, usersRes, projectsRes] = await Promise.all([
          fetch('/api/tasks', { headers: getAuthHeaders() }),
          fetch('/api/users', { headers: getAuthHeaders() }),
          fetch('/api/projects', { headers: getAuthHeaders() }),
        ]);

        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          setTasks(tData.tasks || []);
        }

        if (usersRes.ok) {
          const uData = await usersRes.json();
          setUsers(uData.users || []);
        }

        if (projectsRes.ok) {
          const pData = await projectsRes.json();
          setProjects(pData.projects || []);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Yükleniyor...
      </div>
    );
  }

  const isAdmin = currentUser.role === 'ADMIN';

  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const inReviewCount = tasks.filter((t) => t.status === 'IN_REVIEW').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  const totalEstimatedHours = tasks.reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);
  const totalActualHours = tasks.reduce((acc, t) => acc + (Number(t.actualHours) || 0), 0);

  const internsList = users.filter((u) => u.role === 'USER');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Hoş Geldiniz, {currentUser.fullName}!
            </h1>
            {isAdmin ? (
              <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                ADMIN PANELİ
              </span>
            ) : (
              <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-md">
                PERSONEL PANELİ
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Tüm projelerin durumunu, personellerin görev akışını ve aktivitelerini buradan yönetebilirsiniz.'
              : 'Kendi günlük görevlerinizi Kanban panosunda yönetebilir ve dahil olduğunuz projeleri takip edebilirsiniz.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/tasks"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev Yaz</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Toplam Görev Sayısı' : 'Bana Atanan Görevler'}
            </span>
            <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{tasks.length}</span>
            <span className="text-xs text-slate-500">adet görev</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Tamamlanan: {doneCount}</span>
            <span>Devam Eden: {inProgressCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAdmin ? 'Aktif Projeler' : 'Dahil Olduğum Projeler'}
            </span>
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {isAdmin ? projects.length : projects.filter((p) => p.canAccessContent).length}
            </span>
            <span className="text-xs text-slate-500">adet proje</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Devam Eden: {projects.filter((p) => p.status === 'IN_PROGRESS').length}</span>
            <span>Planlanan: {projects.filter((p) => p.status === 'PLANNING').length}</span>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Kayıtlı Personeller
              </span>
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">{internsList.length}</span>
              <span className="text-xs text-slate-500">aktif kişi</span>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
              Personel kayıtları aktif
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                İncelemede Olan
              </span>
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-slate-900">{inReviewCount}</span>
              <span className="text-xs text-slate-500">görev kontrol aşamasında</span>
            </div>
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
              Admin onayı bekleniyor
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tamamlanma Oranı
            </span>
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500">başarı oranı</span>
          </div>
          <p className="text-xs text-slate-500 border-t border-slate-100 pt-2">
            Görev tamamlama performansı
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
              <Kanban className="w-5 h-5" />
              <span>Görev Panosu & Liste Görünümü</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">Kanban / Liste Modu</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Görevlerinizi hem sürükleyip taşıyabileceğiniz Kanban panosu hem de filtreli detaylı liste formatında görebilirsiniz.
            </p>
          </div>
          <Link
            to="/tasks"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors"
          >
            <span>Görev Panosuna Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isAdmin ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
                <Users className="w-5 h-5" />
                <span>Personel & CV Yönetimi</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">Puanlama ve Şirket Planlaması</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Personellerin teknik/soft skill puanlarını tanımlayın, CV dosyalarını inceleyin ve hangi şirkete entegre olacaklarını not edin.
              </p>
            </div>
            <Link
              to="/team"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors"
            >
              <span>Personel Yönetimine Git</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-600 font-bold text-sm">
                <FileText className="w-5 h-5" />
                <span>Kendi Görevleriniz</span>
              </div>
              <h3 className="text-base font-semibold text-slate-900">Görev Girişi & Takip</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Her gün üstlendiğiniz veya tamamladığınız işleri sistem üzerine girerek harcadığınız efor saatinizi kaydedin.
              </p>
            </div>
            <Link
              to="/tasks"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors"
            >
              <span>Görev Listesini Aç</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-emerald-600 font-bold text-sm">
              <Clock className="w-5 h-5" />
              <span>Aylık Efor & Analitik</span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">İstatistik Raporları</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ay ve yıl filtreli grafiker üzerinde personel bazlı çalışma sürelerini ve toplam efor verimini inceleyin.
            </p>
          </div>
          <Link
            to="/effort"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors"
          >
            <span>Efor İstatistiklerine Git</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Tasks List Preview */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Son Görevler</h2>
          <Link to="/tasks" className="text-xs font-semibold text-indigo-600 hover:underline">
            Tümünü Gör →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.slice(0, 5).map((t) => (
            <div key={t.id} className="py-3 flex items-center justify-between text-sm">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{t.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.priority === 'HIGH'
                        ? 'bg-red-100 text-red-700'
                        : t.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>
              </div>

              <div className="flex items-center space-x-4">
                {t.assignedUser && (
                  <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                    {t.assignedUser.fullName}
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${t.status === 'DONE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : t.status === 'IN_REVIEW'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                >
                  {t.status === 'DONE'
                    ? 'Tamamlandı'
                    : t.status === 'IN_PROGRESS'
                      ? 'Devam Ediyor'
                      : t.status === 'IN_REVIEW'
                        ? 'İncelemede'
                        : 'Yapılacak'}
                </span>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="py-6 text-center text-slate-400 text-xs">
              Henüz görev kaydı bulunmuyor.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
