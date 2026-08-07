import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Users, Clock, Award, Filter } from 'lucide-react';
import { User } from '../types';
import { getAuthHeaders } from '../utils/api';

interface EffortPageProps {
  currentUser: User;
}

interface StatItem {
  id: string;
  name: string;
  department: string;
  estimatedHours: number;
  actualHours: number;
  completedTasks: number;
  totalTasks: number;
  efficiencyScore: number;
}

export default function EffortPage({ currentUser }: EffortPageProps) {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('08');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchStats = async (month: string, year: string, userId: string) => {
    try {
      const res = await fetch(`/api/stats?month=${month}&year=${year}&userId=${userId}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || []);
      }
    } catch (err) {
      console.error('Fetch stats error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([
        fetchStats(selectedMonth, selectedYear, selectedUserId),
        fetchUsers(),
      ]);
      setLoading(false);
    }
    init();
  }, []);

  const handleFilterChange = (month: string, year: string, userId: string) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setSelectedUserId(userId);
    fetchStats(month, year, userId);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        İstatistik verileri yükleniyor...
      </div>
    );
  }

  const totalActual = stats.reduce((acc, s) => acc + s.actualHours, 0);
  const totalEstimated = stats.reduce((acc, s) => acc + s.estimatedHours, 0);
  const totalTasks = stats.reduce((acc, s) => acc + s.totalTasks, 0);
  const totalCompleted = stats.reduce((acc, s) => acc + s.completedTasks, 0);
  const avgEfficiency =
    stats.length > 0
      ? Math.round(stats.reduce((acc, s) => acc + s.efficiencyScore, 0) / stats.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Aylık Efor & İstatistik Analitiği</h1>
          <p className="text-xs text-slate-500 mt-1">
            Seçilen ay ve yıl bazında personellerin harcadıkları çalışma saatleri ve görev tamamlama verimliliği.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <select
              value={selectedUserId}
              onChange={(e) => handleFilterChange(selectedMonth, selectedYear, e.target.value)}
              className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600 shadow-xs"
            >
              <option value="ALL">Tüm Personeller</option>
              {users
                .filter((u) => u.role === 'USER')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
            </select>
          )}

          <div className="flex items-center space-x-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-xs">
            <Calendar className="w-4 h-4 text-slate-400 ml-1" />
            <select
              value={selectedMonth}
              onChange={(e) => handleFilterChange(e.target.value, selectedYear, selectedUserId)}
              className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none"
            >
              <option value="01">Ocak</option>
              <option value="02">Şubat</option>
              <option value="03">Mart</option>
              <option value="04">Nisan</option>
              <option value="05">Mayıs</option>
              <option value="06">Haziran</option>
              <option value="07">Temmuz</option>
              <option value="08">Ağustos</option>
              <option value="09">Eylül</option>
              <option value="10">Ekim</option>
              <option value="11">Kasım</option>
              <option value="12">Aralık</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => handleFilterChange(selectedMonth, e.target.value, selectedUserId)}
              className="bg-transparent text-slate-800 text-xs font-bold focus:outline-none border-l border-slate-200 pl-2"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Toplam Efor</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalActual}h</span>
            <span className="text-xs text-slate-500">/ {totalEstimated}h planlanan</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Görev Tamamlama</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalCompleted}</span>
            <span className="text-xs text-slate-500">/ {totalTasks} görev</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Ortalama Verimlilik</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">%{avgEfficiency}</span>
            <span className="text-xs text-slate-500">efor uyumu</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Raporlanan Kişi</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{stats.length}</span>
            <span className="text-xs text-slate-500">personel</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Personel Bazlı Çalışma Saatleri (Efor)
        </h2>
        <div className="h-80 w-full pt-4">
          {stats.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="estimatedHours" name="Planlanan (Saat)" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="actualHours" name="Harcanan (Saat)" fill="#3F3C67" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              Seçilen ay için henüz kayıtlı efor verisi yok.
            </div>
          )}
        </div>
      </div>

      {/* Effort Details Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
          Detaylı Efor Tablosu
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ad Soyad</th>
                <th className="py-3 px-4">Departman</th>
                <th className="py-3 px-4">Planlanan Efor</th>
                <th className="py-3 px-4">Harcanan Efor</th>
                <th className="py-3 px-4">Tamamlanan Görev</th>
                <th className="py-3 px-4 text-right">Verimlilik Skoru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-500">{s.department}</td>
                  <td className="py-3 px-4 font-semibold text-slate-600">{s.estimatedHours}h</td>
                  <td className="py-3 px-4 font-bold text-indigo-700">{s.actualHours}h</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {s.completedTasks} / {s.totalTasks}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-100">
                      %{s.efficiencyScore}
                    </span>
                  </td>
                </tr>
              ))}

              {stats.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    Kayıtlı veri bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
