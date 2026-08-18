import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  Unlock,
  FileText,
  Send,
  X,
  Edit2,
  Trash2,
  Sparkles,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { User, Project, RoleRequirement } from '../types';
import { getAuthHeaders } from '../utils/api';

interface ProjectsPageProps {
  currentUser: User;
}

export default function ProjectsPage({ currentUser }: ProjectsPageProps) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    neededRoles: [] as string[],
    roleRequirements: [] as RoleRequirement[],
    documentation: '',
    repositoryUrl: '',
    status: 'PLANNING' as 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED',
  });

  const [customRoleInput, setCustomRoleInput] = useState('');

  // Application Modal
  const [applyModalProject, setApplyModalProject] = useState<Project | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [applying, setApplying] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const [roleReqInputs, setRoleReqInputs] = useState<Record<string, { techText: string; preText: string }>>({});

  const initRoleReqInputs = (reqs: RoleRequirement[]) => {
    const map: Record<string, { techText: string; preText: string }> = {};
    reqs.forEach((r) => {
      map[r.role] = {
        techText: r.technologies ? r.technologies.join(', ') : '',
        preText: r.prerequisites ? r.prerequisites.join(', ') : '',
      };
    });
    setRoleReqInputs(map);
  };

  const openCreateProjectModal = () => {
    setEditingProject(null);
    setProjectFormData({
      name: '',
      description: '',
      neededRoles: [],
      roleRequirements: [],
      documentation: '',
      repositoryUrl: '',
      status: 'PLANNING',
    });
    initRoleReqInputs([]);
    setIsProjectModalOpen(true);
  };

  const openEditProjectModal = (p: Project) => {
    setEditingProject(p);
    const reqs = p.roleRequirements || [];
    setProjectFormData({
      name: p.name,
      description: p.description || '',
      neededRoles: p.neededRoles || [],
      roleRequirements: reqs,
      documentation: p.documentation || '',
      repositoryUrl: p.repositoryUrl || '',
      status: p.status,
    });
    initRoleReqInputs(reqs);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.name.trim()) return;

    try {
      if (editingProject) {
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(projectFormData),
        });
        if (res.ok) {
          await fetchProjects();
        }
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(projectFormData),
        });
        if (res.ok) {
          await fetchProjects();
        }
      }
    } catch (err) {
      console.error('Save project error:', err);
    }

    setIsProjectModalOpen(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchProjects();
      }
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  const handleAddRoleChip = () => {
    if (!customRoleInput.trim()) return;
    if (!projectFormData.neededRoles.includes(customRoleInput.trim())) {
      setProjectFormData({
        ...projectFormData,
        neededRoles: [...projectFormData.neededRoles, customRoleInput.trim()],
      });
    }
    setCustomRoleInput('');
  };

  const handleRemoveRoleChip = (roleToRemove: string) => {
    setProjectFormData({
      ...projectFormData,
      neededRoles: projectFormData.neededRoles.filter((r) => r !== roleToRemove),
      roleRequirements: projectFormData.roleRequirements.filter((r) => r.role !== roleToRemove),
    });
  };

  const openApplyModal = (project: Project) => {
    setApplyModalProject(project);
    setSelectedRole(project.neededRoles[0] || 'Frontend Geliştirici');
  };

  const handleSendApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModalProject || !selectedRole.trim() || applying) return;

    setApplying(true);
    try {
      const res = await fetch(`/api/projects/${applyModalProject.id}/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ requestedRole: selectedRole }),
      });
      if (res.ok) {
        await fetchProjects();
        setApplyModalProject(null);
        alert('Proje katılım talebiniz başarıyla gönderildi! Yönetici onayladığında bilgilendirileceksiniz.');
      } else {
        const data = await res.json();
        alert(data.error || 'Başvuru gönderilemedi.');
      }
    } catch (err) {
      console.error('Apply project error:', err);
    } finally {
      setApplying(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.neededRoles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">Devam Ediyor</span>;
      case 'PLANNING':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">Planlama Aşamasında</span>;
      case 'COMPLETED':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">Tamamlandı</span>;
      case 'PAUSED':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">Duraklatıldı</span>;
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Proje verileri çekiliyor...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Proje Portföyü & Ekip Çalışma Alanı</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mevcut projeleri inceleyin, uzmanlığınız doğrultusunda katılım talebinde bulunun veya ekibinizi yönetin.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateProjectModal}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Proje Oluştur</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Proje adı, açıklama veya rol ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900"
          />
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">Tüm Proje Durumları</option>
            <option value="PLANNING">Planlama</option>
            <option value="IN_PROGRESS">Devam Ediyor</option>
            <option value="COMPLETED">Tamamlandı</option>
            <option value="PAUSED">Duraklatıldı</option>
          </select>
        </div>
      </div>

      {/* Projects Full-Width List (100% Width) */}
      <div className="space-y-4 w-full">
        {filteredProjects.map((p) => {
          const approvedCount = p.approvedCount !== undefined ? p.approvedCount : (p.members?.filter((m) => m.status === 'APPROVED').length || 0);
          const pendingCount = p.pendingCount !== undefined ? p.pendingCount : (p.members?.filter((m) => m.status === 'PENDING').length || 0);
          const myMemberStatus = p.myMembership?.status;
          const progressVal = p.progressPercentage || 0;

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 md:p-6 shadow-xs hover:shadow-lg transition-all duration-200 group relative overflow-hidden w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              {/* Top Status Gradient Accent Bar */}
              <div
                className={`h-1.5 w-full absolute top-0 left-0 right-0 ${p.status === 'IN_PROGRESS'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600'
                    : p.status === 'PLANNING'
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600'
                      : p.status === 'COMPLETED'
                        ? 'bg-gradient-to-r from-slate-400 to-slate-600'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                  }`}
              />

              {/* LEFT COLUMN: Project Details & Roles */}
              <div className="space-y-3 flex-1 min-w-0 pt-1">
                {/* Header Pills & Actions */}
                <div className="flex items-center space-x-2">
                  {p.status === 'IN_PROGRESS' ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      <span>Devam Ediyor</span>
                    </span>
                  ) : p.status === 'PLANNING' ? (
                    <span className="bg-blue-50 text-blue-800 border border-blue-200/80 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                      Planlama
                    </span>
                  ) : p.status === 'COMPLETED' ? (
                    <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                      Tamamlandı
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                      Duraklatıldı
                    </span>
                  )}

                  {p.canAccessContent ? (
                    <span
                      className="px-2 py-0.5 text-emerald-700 bg-emerald-50 rounded-lg flex items-center space-x-1 text-[10px] font-bold border border-emerald-100"
                      title="İçerik & Dokümanlar Erişilebilir"
                    >
                      <Unlock className="w-3 h-3 text-emerald-600" />
                      <span>Erişim Açık</span>
                    </span>
                  ) : (
                    <span
                      className="px-2 py-0.5 text-slate-500 bg-slate-100 rounded-lg flex items-center space-x-1 text-[10px] font-medium border border-slate-200"
                      title="Dokümantasyon kilitli. İçeriği görmek için projeye dahil olmalısınız."
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Doküman Kilitli</span>
                    </span>
                  )}

                  {isAdmin && (
                    <div className="flex items-center space-x-0.5 ml-2">
                      <button
                        onClick={() => openEditProjectModal(p)}
                        className="text-slate-400 hover:text-indigo-600 p-1 rounded-lg transition-colors"
                        title="Projeyi Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(p.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                        title="Projeyi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0 mt-0.5">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                      >
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed max-w-3xl">
                        {p.description || 'Bu proje için henüz kısa açıklama eklenmemiş.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Needed Roles Badges */}
                <div className="pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Destek Rolleri:</span>
                    </span>
                    {p.neededRoles.length > 0 ? (
                      p.neededRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="bg-indigo-50/80 text-indigo-700 text-[10.5px] font-semibold px-2.5 py-0.5 rounded-lg border border-indigo-100"
                        >
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Genel Ekip</span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Progress Bar & Team & Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col justify-between items-stretch lg:items-end gap-4 w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                {/* HIGH-TECH PROGRESS BAR */}
                <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-3 space-y-2 w-full">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Proje İlerlemesi</span>
                    </div>
                    <div className="flex items-center space-x-1 font-extrabold text-indigo-700">
                      <span>%{progressVal}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({p.completedTasksCount || 0}/{p.totalTasksCount || 0} Görev)
                      </span>
                    </div>
                  </div>

                  {/* Animated Progress Bar Track */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${progressVal === 100
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                          : progressVal > 50
                            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-blue-500'
                        }`}
                      style={{ width: `${Math.max(progressVal, 3)}%` }}
                    />
                  </div>
                </div>

                {/* Team Member Count & Action Buttons */}
                <div className="flex items-center justify-between lg:justify-end space-x-3 w-full">
                  <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100/80 border border-slate-200/80 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{approvedCount} Üye</span>
                  </div>
                  {isAdmin && pendingCount > 0 && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {pendingCount} Talep
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 px-3.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Detay →</span>
                    </button>

                    {myMemberStatus === 'APPROVED' ? (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Üyesiniz</span>
                      </span>
                    ) : myMemberStatus === 'PENDING' ? (
                      <button
                        disabled
                        className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold px-3 py-2 rounded-xl cursor-not-allowed shrink-0"
                      >
                        Bekliyor
                      </button>
                    ) : (
                      <button
                        onClick={() => openApplyModal(p)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1 transition-colors shadow-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Katıl</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <FolderKanban className="w-10 h-10 mx-auto text-slate-300" />
            <div className="font-semibold text-slate-600 text-sm">Kriterlere uygun proje kaydı bulunamadı.</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Arama filtrenizi değiştirebilir veya yetkili iseniz yukarıdan yeni bir proje ekleyebilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PROJECT MODAL (ADMIN) */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingProject ? 'Projeyi Düzenle' : 'Yeni Proje Oluştur'}
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Proje Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: iKnow Mobil Uygulaması & PDKS V2"
                    value={projectFormData.name}
                    onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Proje Durumu</label>
                  <select
                    value={projectFormData.status}
                    onChange={(e) =>
                      setProjectFormData({
                        ...projectFormData,
                        status: e.target.value as Project['status'],
                      })
                    }
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="PLANNING">Planlama Aşamasında (PLANNING)</option>
                    <option value="IN_PROGRESS">Devam Ediyor (IN_PROGRESS)</option>
                    <option value="COMPLETED">Tamamlandı (COMPLETED)</option>
                    <option value="PAUSED">Duraklatıldı (PAUSED)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proje Özeti / Genel Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Projenin amacı ve kapsamı hakkında kısa özet..."
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Needed Roles Chips Selector */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  İhtiyaç Duyulan Rol & Destek Alanları
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {projectFormData.neededRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="bg-indigo-50 text-indigo-700 font-semibold text-xs px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center space-x-1"
                    >
                      <span>{role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRoleChip(role)}
                        className="text-indigo-400 hover:text-indigo-900 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Örn: Mobile Developer, Full Stack..."
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoleChip}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* Role Requirements Form Builder */}
              {projectFormData.neededRoles.length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="font-semibold text-slate-700 block">
                    Rol Bazlı Teknoloji & Beklenen Yetkinlik Detayları
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-h-72 overflow-y-auto">
                    {projectFormData.neededRoles.map((role, rIdx) => {
                      const existingReq = projectFormData.roleRequirements.find((r) => r.role === role) || {
                        role,
                        technologies: [],
                        prerequisites: [],
                      };

                      const currentTechText =
                        roleReqInputs[role]?.techText !== undefined
                          ? roleReqInputs[role].techText
                          : existingReq.technologies.join(', ');

                      const currentPreText =
                        roleReqInputs[role]?.preText !== undefined
                          ? roleReqInputs[role].preText
                          : existingReq.prerequisites.join(', ');

                      return (
                        <div key={rIdx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                          <div className="font-bold text-indigo-900 text-xs flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{role}</span>
                          </div>
                          <div>
                            <label className="text-[10.5px] text-slate-600 font-semibold block mb-1">
                              Kullanılacak Teknolojiler & Araçlar (Virgülle ayırın)
                            </label>
                            <input
                              type="text"
                              placeholder="Örn: React, TypeScript, Vite, TailwindCSS"
                              value={currentTechText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRoleReqInputs((prev) => ({
                                  ...prev,
                                  [role]: {
                                    techText: val,
                                    preText: prev[role]?.preText !== undefined ? prev[role].preText : currentPreText,
                                  },
                                }));

                                const techs = val.split(',').map((s) => s.trim()).filter(Boolean);
                                const pres = currentPreText.split(',').map((s) => s.trim()).filter(Boolean);

                                const updated = [...projectFormData.roleRequirements];
                                const foundIdx = updated.findIndex((r) => r.role === role);
                                if (foundIdx >= 0) {
                                  updated[foundIdx] = { role, technologies: techs, prerequisites: pres };
                                } else {
                                  updated.push({ role, technologies: techs, prerequisites: pres });
                                }
                                setProjectFormData({ ...projectFormData, roleRequirements: updated });
                              }}
                              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] text-slate-600 font-semibold block mb-1">
                              Bilinmesi / Hakim Olunması Gereken Konular (Virgülle ayırın)
                            </label>
                            <input
                              type="text"
                              placeholder="Örn: State Management, REST API Entegrasyonu, Responsive UI"
                              value={currentPreText}
                              onChange={(e) => {
                                const val = e.target.value;
                                setRoleReqInputs((prev) => ({
                                  ...prev,
                                  [role]: {
                                    techText: prev[role]?.techText !== undefined ? prev[role].techText : currentTechText,
                                    preText: val,
                                  },
                                }));

                                const pres = val.split(',').map((s) => s.trim()).filter(Boolean);
                                const techs = currentTechText.split(',').map((s) => s.trim()).filter(Boolean);

                                const updated = [...projectFormData.roleRequirements];
                                const foundIdx = updated.findIndex((r) => r.role === role);
                                if (foundIdx >= 0) {
                                  updated[foundIdx] = { role, technologies: techs, prerequisites: pres };
                                } else {
                                  updated.push({ role, technologies: techs, prerequisites: pres });
                                }
                                setProjectFormData({ ...projectFormData, roleRequirements: updated });
                              }}
                              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Repository URL (Github / Gitlab) (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/company/project-repo"
                  value={projectFormData.repositoryUrl}
                  onChange={(e) => setProjectFormData({ ...projectFormData, repositoryUrl: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Teknik Dokümantasyon & İhtiyaçlar (Markdown / Notlar)
                </label>
                <textarea
                  rows={5}
                  placeholder="Projenin mimari yapısı, kurulum adımları, beklentiler ve görev dağılım esasları..."
                  value={projectFormData.documentation}
                  onChange={(e) => setProjectFormData({ ...projectFormData, documentation: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  {editingProject ? 'Güncelle' : 'Proje Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICATION MODAL (PERSONEL) */}
      {applyModalProject && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Projeye Katılma Talebi</h3>
              <button onClick={() => setApplyModalProject(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">{applyModalProject.name}</strong> projesinde üstlenmek istediğiniz rolü seçiniz. Yönetici onayladığında projenin dokümantasyonuna ve görev alanına erişiminiz aktif olacaktır.
            </p>

            <form onSubmit={handleSendApplication} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Üstlenmek İstediğiniz Rol *</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                >
                  {applyModalProject.neededRoles.map((role, idx) => (
                    <option key={idx} value={role}>
                      {role}
                    </option>
                  ))}
                  <option value="Diğer / Genel Destek">Diğer / Genel Destek</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalProject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs flex items-center space-x-1.5"
                >
                  {applying ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Talebi Gönder (Telegram)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
