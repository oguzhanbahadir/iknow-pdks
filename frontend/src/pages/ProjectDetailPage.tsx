import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderKanban,
  FileText,
  Users,
  GitBranch,
  Edit2,
  Trash2,
  Unlock,
  Lock,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  X,
  Sparkles,
  Kanban,
  List,
  Eye,
  MessageSquare,
  Calendar,
  Tag,
  User as UserIcon,
  Code2,
} from 'lucide-react';
import { User, Project, TaskItem, TaskComment, RoleRequirement } from '../types';
import { getAuthHeaders } from '../utils/api';

interface ProjectDetailPageProps {
  currentUser: User;
}

export default function ProjectDetailPage({ currentUser }: ProjectDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'docs' | 'team' | 'tasks'>('docs');

  // Kanban & List View Mode for Project Tasks
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Edit Project Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  // Task Creation & Editing State inside Project
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE',
    assignedUserId: currentUser.id,
    projectId: id || '',
    estimatedHours: 4,
  });

  // Task Detail Chat Modal State
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const statusColumns: Array<{
    key: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }> = [
    { key: 'TODO', label: 'Yapılacak', bgColor: 'bg-slate-100', textColor: 'text-slate-800', borderColor: 'border-slate-300' },
    { key: 'IN_PROGRESS', label: 'Devam Ediyor', bgColor: 'bg-blue-50', textColor: 'text-blue-900', borderColor: 'border-blue-200' },
    { key: 'IN_REVIEW', label: 'İncelemede', bgColor: 'bg-amber-50', textColor: 'text-amber-900', borderColor: 'border-amber-200' },
    { key: 'DONE', label: 'Tamamlandı', bgColor: 'bg-emerald-50', textColor: 'text-emerald-900', borderColor: 'border-emerald-200' },
  ];

  const loadProject = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setProjectFormData({
          name: data.project.name,
          description: data.project.description || '',
          neededRoles: data.project.neededRoles || [],
          roleRequirements: data.project.roleRequirements || [],
          documentation: data.project.documentation || '',
          repositoryUrl: data.project.repositoryUrl || '',
          status: data.project.status,
        });
      } else {
        setErrorMsg('Proje detayları yüklenemedi veya proje bulunamadı.');
      }
    } catch (err) {
      console.error('Fetch project detail error:', err);
      setErrorMsg('Bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const fetchAllProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Fetch all projects error:', err);
    }
  };

  useEffect(() => {
    loadProject();
    fetchUsers();
    fetchAllProjects();
  }, [id]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !projectFormData.name.trim()) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(projectFormData),
      });
      if (res.ok) {
        await loadProject();
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error('Update project error:', err);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        navigate('/projects');
      }
    } catch (err) {
      console.error('Delete project error:', err);
    }
  };

  const handleUpdateMemberStatus = async (memberId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    try {
      const res = await fetch(`/api/projects/${id}/members/${memberId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadProject();
      }
    } catch (err) {
      console.error('Update member status error:', err);
    }
  };

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedUserId: currentUser.id,
      projectId: id || '',
      estimatedHours: 4,
    });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: TaskItem) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      assignedUserId: task.assignedUserId,
      projectId: task.projectId || id || '',
      estimatedHours: task.estimatedHours || 4,
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) return;

    try {
      const targetProjectId = taskFormData.projectId || id;
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...taskFormData,
            projectId: targetProjectId,
          }),
        });
        if (res.ok) {
          await loadProject();
        }
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...taskFormData,
            projectId: targetProjectId,
          }),
        });
        if (res.ok) {
          await loadProject();
        }
      }
    } catch (err) {
      console.error('Save project task error:', err);
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await loadProject();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await loadProject();
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const openDetailTaskModal = async (task: TaskItem) => {
    setDetailTask(task);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTask || !newCommentText.trim() || sendingComment) return;

    setSendingComment(true);
    try {
      const res = await fetch(`/api/tasks/${detailTask.id}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message: newCommentText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [...prev, data.comment]);
        }
        setNewCommentText('');
      }
    } catch (err) {
      console.error('Send comment error:', err);
    } finally {
      setSendingComment(false);
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
    });
  };

  const getStatusBadge = (status?: Project['status']) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-lg">Devam Ediyor</span>;
      case 'PLANNING':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-lg">Planlama Aşamasında</span>;
      case 'COMPLETED':
        return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-3 py-1 rounded-lg">Tamamlandı</span>;
      case 'PAUSED':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-lg">Duraklatıldı</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Proje detayları yükleniyor...
      </div>
    );
  }

  if (errorMsg || !project) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto mt-8">
        <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="font-bold text-slate-800 text-base">{errorMsg || 'Proje bulunamadı.'}</h3>
        <Link
          to="/projects"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Projelere Geri Dön</span>
        </Link>
      </div>
    );
  }

  const tasksList = project.tasks || [];

  return (
    <div className="space-y-6">
      {/* Top Back Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Projeler Listesine Dön</span>
        </Link>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-white border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-indigo-600 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Projeyi Düzenle</span>
            </button>

            <button
              onClick={handleDeleteProject}
              className="bg-white border border-slate-200 hover:border-red-600 text-slate-700 hover:text-red-600 font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Sil</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Project Banner Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              {getStatusBadge(project.status)}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
              {project.description || 'Bu proje için kısa özet bulunmuyor.'}
            </p>
          </div>

          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 shrink-0 transition-colors shadow-xs"
            >
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <span>Repository Adresi</span>
            </a>
          )}
        </div>

        {/* Roles Chips & Access Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-semibold text-[11px]">İhtiyaç Duyulan Roller:</span>
            <div className="flex flex-wrap gap-1.5">
              {project.neededRoles.map((role, idx) => (
                <span
                  key={idx}
                  className="bg-indigo-50 text-indigo-700 font-semibold text-[11px] px-2.5 py-0.5 rounded-md border border-indigo-100"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {project.canAccessContent ? (
              <span className="bg-emerald-50 text-emerald-700 font-bold text-[11px] px-3 py-1 rounded-xl flex items-center space-x-1 border border-emerald-200">
                <Unlock className="w-3.5 h-3.5" />
                <span>Doküman & Görev Alanı Açık</span>
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 font-semibold text-[11px] px-3 py-1 rounded-xl flex items-center space-x-1 border border-amber-200">
                <Lock className="w-3.5 h-3.5" />
                <span>Katılım Talebi Onay Bekliyor</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 space-x-6">
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'docs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Dokümantasyon & İhtiyaçlar</span>
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'team'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ekip Üyeleri ({project.members?.length || 0})</span>
          </button>

          {project.canAccessContent && (
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 ${
                activeTab === 'tasks'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Proje Görevleri ({tasksList.length})</span>
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="p-6 text-xs text-slate-700">
          {/* TAB 1: DOCUMENTATION & ROLE REQUIREMENTS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              {/* Role Tech Stack & Prerequisite Expectations Matrix (PUBLIC TO EVERYONE) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Rol Bazlı Kullanılacak Teknolojiler & Yetkinlik Beklentileri</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Projede üstlenilen role göre kullanılacak teknoloji yığını, diller, kütüphaneler ve bilinmesi gereken konular.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.roleRequirements && project.roleRequirements.length > 0 ? (
                    project.roleRequirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3.5 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <span className="font-bold text-indigo-900 text-xs bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 flex items-center space-x-1.5">
                            <Tag className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{req.role}</span>
                          </span>
                        </div>

                        {/* Tech Stack */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                            <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Kullanılacak Teknolojiler & Araçlar</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {req.technologies && req.technologies.length > 0 ? (
                              req.technologies.map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="bg-slate-100 text-slate-800 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border border-slate-200"
                                >
                                  {tech}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Genel Teknolojiler</span>
                            )}
                          </div>
                        </div>

                        {/* Prerequisites */}
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Bilinmesi / Hakim Olunması Gereken Konular</span>
                          </div>
                          <ul className="space-y-1">
                            {req.prerequisites && req.prerequisites.length > 0 ? (
                              req.prerequisites.map((pre, pIdx) => (
                                <li key={pIdx} className="flex items-start space-x-1.5 text-[11px] text-slate-700">
                                  <span className="text-emerald-500 font-bold shrink-0 mt-0.5">•</span>
                                  <span>{pre}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-[11px] text-slate-400 italic">Genel Yetkinlikler</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))
                  ) : (
                    project.neededRoles.map((role, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-bold text-indigo-900 text-xs bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                            {role}
                          </span>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Kullanılacak Teknolojiler & Araçlar
                          </div>
                          <div className="text-[11px] text-slate-500 italic">
                            Yönetici tarafından henüz bu rol için özel teknoloji detayları düzenlenmedi.
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Technical Documentation Section (PROTECTED / MEMBERS ONLY) */}
              {project.canAccessContent ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-3 flex items-center justify-between">
                    <span>Teknik Dokümantasyon ve Çalışma Esasları</span>
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center space-x-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Düzenle</span>
                      </button>
                    )}
                  </h3>

                  <div className="leading-relaxed font-mono whitespace-pre-wrap text-slate-800 bg-white p-4 rounded-xl border border-slate-200 text-[12px]">
                    {project.documentation ? (
                      project.documentation
                    ) : (
                      <span className="text-slate-400 italic">
                        Henüz bu proje için detaylı teknik rehber girilmemiş.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10 text-center space-y-3 max-w-lg mx-auto">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                  <h4 className="font-bold text-amber-900 text-sm">Detaylı Dokümantasyon Erişim Yetkiniz Bulunmuyor</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Bu projenin detaylı iç dokümanlarını ve çalışma rehberini inceleyebilmek için projenin üyesi olmanız ve talebinizin yönetici tarafından onaylanmış olması gerekmektedir.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEAM */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Proje Ekibi ve Rol Dağılımı</h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Personel</th>
                      <th className="py-3.5 px-4">Üstlendiği Rol</th>
                      <th className="py-3.5 px-4">Durum</th>
                      {isAdmin && <th className="py-3.5 px-4 text-right">Eylemler</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {project.members?.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-3">
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                            {m.user?.fullName ? m.user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="text-slate-900 font-bold">{m.user?.fullName || 'Kullanıcı'}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{m.user?.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                            {m.requestedRole}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {m.status === 'APPROVED' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Onaylandı</span>
                            </span>
                          ) : m.status === 'PENDING' ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Onay Bekliyor</span>
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center space-x-1">
                              <XCircle className="w-3 h-3" />
                              <span>Reddedildi</span>
                            </span>
                          )}
                        </td>

                        {isAdmin && (
                          <td className="py-3 px-4 text-right space-x-1">
                            {m.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id, 'APPROVED')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors"
                                >
                                  Kabul Et
                                </button>
                                <button
                                  onClick={() => handleUpdateMemberStatus(m.id, 'REJECTED')}
                                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition-colors"
                                >
                                  Reddet
                                </button>
                              </>
                            ) : m.status === 'APPROVED' ? (
                              <button
                                onClick={() => handleUpdateMemberStatus(m.id, 'REJECTED')}
                                className="text-red-500 hover:text-red-700 font-semibold text-xs"
                              >
                                Çıkar
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateMemberStatus(m.id, 'APPROVED')}
                                className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs"
                              >
                                Yeniden Kabul Et
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}

                    {(!project.members || project.members.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                          Bu projede henüz kayıtlı bir ekip üyesi bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PROJECT TASKS (KANBAN & LIST BOARD) */}
          {activeTab === 'tasks' && project.canAccessContent && (
            <div className="space-y-5">
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'kanban'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Kanban Panosu</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'list'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Liste Görünümü</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={openCreateTaskModal}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Projeye Görev Ekle</span>
                </button>
              </div>

              {/* KANBAN BOARD */}
              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {statusColumns.map((col) => {
                    const colTasks = tasksList.filter((t) => t.status === col.key);
                    const isOver = dragOverColumn === col.key;
                    return (
                      <div
                        key={col.key}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverColumn !== col.key) {
                            setDragOverColumn(col.key);
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDragOverColumn(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverColumn(null);
                          const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
                          if (taskId) {
                            handleUpdateTaskStatus(taskId, col.key as TaskItem['status']);
                          }
                        }}
                        className={`border rounded-2xl p-3.5 flex flex-col min-h-[450px] transition-all duration-150 ${
                          isOver
                            ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400 ring-offset-2'
                            : 'bg-slate-100/70 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${col.bgColor} ${col.textColor} ${col.borderColor}`}
                          >
                            {col.label}
                          </span>
                          <span className="text-xs font-bold text-slate-500">{colTasks.length}</span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto">
                          {colTasks.map((t) => {
                            const assignedUser = users.find((u) => u.id === t.assignedUserId);
                            const isDragging = draggedTaskId === t.id;
                            return (
                              <div
                                key={t.id}
                                draggable={true}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', t.id);
                                  setDraggedTaskId(t.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedTaskId(null);
                                  setDragOverColumn(null);
                                }}
                                className={`bg-white border rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing select-none ${
                                  isDragging
                                    ? 'opacity-40 scale-95 border-dashed border-indigo-400 bg-indigo-50/40'
                                    : 'border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      t.priority === 'HIGH'
                                        ? 'bg-red-100 text-red-700'
                                        : t.priority === 'MEDIUM'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {t.priority}
                                  </span>

                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => openDetailTaskModal(t)}
                                      className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                                      title="Görev Detayı & Yazışmalar"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => openEditTaskModal(t)}
                                      className="text-slate-400 hover:text-indigo-600 p-1"
                                      title="Düzenle"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(t.id)}
                                      className="text-slate-400 hover:text-red-600 p-1"
                                      title="Sil"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-bold text-slate-900 text-xs">{t.title}</h4>
                                  {t.description && (
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-600">
                                    {t.category || 'Genel'}
                                  </span>
                                  <span className="flex items-center space-x-1 font-semibold text-slate-700">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {t.actualHours}h / {t.estimatedHours}h
                                    </span>
                                  </span>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  {assignedUser && (
                                    <div className="flex items-center space-x-1.5">
                                      <div className="w-4 h-4 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">
                                        {assignedUser.fullName ? assignedUser.fullName.charAt(0).toUpperCase() : 'U'}
                                      </div>
                                      <span className="text-[10px] font-medium text-slate-700">
                                        {assignedUser.fullName}
                                      </span>
                                    </div>
                                  )}

                                  <select
                                    value={t.status}
                                    onChange={(e) =>
                                      handleUpdateTaskStatus(t.id, e.target.value as TaskItem['status'])
                                    }
                                    className="text-[9.5px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 text-slate-700 focus:outline-none"
                                  >
                                    <option value="TODO">Yapılacak</option>
                                    <option value="IN_PROGRESS">Devam Ediyor</option>
                                    <option value="IN_REVIEW">İncelemede</option>
                                    <option value="DONE">Tamamlandı</option>
                                  </select>
                                </div>
                              </div>
                            );
                          })}

                          {colTasks.length === 0 && (
                            <div className="h-28 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400 font-medium">
                              Görev yok
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LIST TABLE VIEW */
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4">Görev Başlığı</th>
                        <th className="py-3.5 px-4">Atanan Personel</th>
                        <th className="py-3.5 px-4">Öncelik</th>
                        <th className="py-3.5 px-4">Efor</th>
                        <th className="py-3.5 px-4">Durum</th>
                        <th className="py-3.5 px-4 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tasksList.map((t) => {
                        const assignedUser = users.find((u) => u.id === t.assignedUserId);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-xs">{t.title}</div>
                              <div className="text-[11px] text-slate-400 line-clamp-1">{t.description}</div>
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {assignedUser ? assignedUser.fullName : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                  t.priority === 'HIGH'
                                    ? 'bg-red-100 text-red-700'
                                    : t.priority === 'MEDIUM'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {t.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {t.actualHours}h / {t.estimatedHours}h
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={t.status}
                                onChange={(e) =>
                                  handleUpdateTaskStatus(t.id, e.target.value as TaskItem['status'])
                                }
                                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none"
                              >
                                <option value="TODO">Yapılacak</option>
                                <option value="IN_PROGRESS">Devam Ediyor</option>
                                <option value="IN_REVIEW">İncelemede</option>
                                <option value="DONE">Tamamlandı</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => openDetailTaskModal(t)}
                                className="text-slate-500 hover:text-indigo-600 font-semibold text-xs inline-flex items-center space-x-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Detay</span>
                              </button>
                              <button
                                onClick={() => openEditTaskModal(t)}
                                className="text-slate-500 hover:text-indigo-600 font-semibold text-xs"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="text-slate-500 hover:text-red-600 font-semibold text-xs"
                              >
                                Sil
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {tasksList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            Bu projeye ait görev kaydı bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EDIT / CREATE PROJECT MODAL (ADMIN) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Projeyi Düzenle</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proje Adı *</label>
                <input
                  type="text"
                  required
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proje Özeti</label>
                <textarea
                  rows={2}
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
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
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="PLANNING">Planlama Aşamasında (PLANNING)</option>
                  <option value="IN_PROGRESS">Devam Ediyor (IN_PROGRESS)</option>
                  <option value="COMPLETED">Tamamlandı (COMPLETED)</option>
                  <option value="PAUSED">Duraklatıldı (PAUSED)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">İhtiyaç Duyulan Roller</label>
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
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Örn: QA Tester..."
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddRoleChip}
                    className="px-3 py-1.5 bg-slate-200 text-slate-800 font-semibold rounded-xl"
                  >
                    Ekle
                  </button>
                </div>
              </div>

              {/* Role Requirements Form Builder */}
              {projectFormData.neededRoles.length > 0 && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Rol Bazlı Teknoloji & Beklenen Yetkinlik Detayları
                  </label>
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-60 overflow-y-auto">
                    {projectFormData.neededRoles.map((role, rIdx) => {
                      const existingReq = projectFormData.roleRequirements.find((r) => r.role === role) || {
                        role,
                        technologies: [],
                        prerequisites: [],
                      };
                      return (
                        <div key={rIdx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                          <div className="font-bold text-indigo-700 text-xs flex items-center space-x-1">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{role}</span>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                              Kullanılacak Teknolojiler & Araçlar (Virgülle ayırın)
                            </label>
                            <input
                              type="text"
                              placeholder="Örn: React, TypeScript, Vite, TailwindCSS"
                              value={existingReq.technologies.join(', ')}
                              onChange={(e) => {
                                const techs = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                const updated = [...projectFormData.roleRequirements];
                                const foundIdx = updated.findIndex((r) => r.role === role);
                                if (foundIdx >= 0) {
                                  updated[foundIdx] = { ...updated[foundIdx], technologies: techs };
                                } else {
                                  updated.push({ role, technologies: techs, prerequisites: existingReq.prerequisites });
                                }
                                setProjectFormData({ ...projectFormData, roleRequirements: updated });
                              }}
                              className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                              Bilinmesi / Hakim Olunması Gereken Konular (Virgülle ayırın)
                            </label>
                            <input
                              type="text"
                              placeholder="Örn: State Management, REST API Entegrasyonu, Responsive UI"
                              value={existingReq.prerequisites.join(', ')}
                              onChange={(e) => {
                                const pres = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                const updated = [...projectFormData.roleRequirements];
                                const foundIdx = updated.findIndex((r) => r.role === role);
                                if (foundIdx >= 0) {
                                  updated[foundIdx] = { ...updated[foundIdx], prerequisites: pres };
                                } else {
                                  updated.push({ role, technologies: existingReq.technologies, prerequisites: pres });
                                }
                                setProjectFormData({ ...projectFormData, roleRequirements: updated });
                              }}
                              className="w-full py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Repository URL</label>
                <input
                  type="text"
                  value={projectFormData.repositoryUrl}
                  onChange={(e) => setProjectFormData({ ...projectFormData, repositoryUrl: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Teknik Dokümantasyon & İhtiyaçlar</label>
                <textarea
                  rows={6}
                  value={projectFormData.documentation}
                  onChange={(e) => setProjectFormData({ ...projectFormData, documentation: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-[11px] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTask ? 'Projeye Ait Görevi Düzenle' : 'Projeye Görev Ekle'}
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: API Modül Tasarımı"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">📁 Bağlı Olduğu Proje (Başka Projeye Taşı)</label>
                <select
                  value={taskFormData.projectId}
                  onChange={(e) => setTaskFormData({ ...taskFormData, projectId: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                >
                  <option value="">-- Bağımsız Görev (Projesiz) --</option>
                  {allProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Açıklama</label>
                <textarea
                  rows={2}
                  placeholder="Görev detayları..."
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Atanan Personel</label>
                  <select
                    value={taskFormData.assignedUserId}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assignedUserId: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Öncelik</label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) =>
                      setTaskFormData({
                        ...taskFormData,
                        priority: e.target.value as TaskItem['priority'],
                      })
                    }
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none"
                  >
                    <option value="LOW">Düşük (LOW)</option>
                    <option value="MEDIUM">Orta (MEDIUM)</option>
                    <option value="HIGH">Yüksek (HIGH)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  {editingTask ? 'Güncelle' : 'Görev Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL & LIVE CHAT MODAL */}
      {detailTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs text-slate-700">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{detailTask.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        detailTask.priority === 'HIGH'
                          ? 'bg-red-100 text-red-700'
                          : detailTask.priority === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {detailTask.priority}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {statusColumns.find((s) => s.key === detailTask.status)?.label || detailTask.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Task Details Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div>
                  <div className="text-slate-400 font-semibold text-[10px] flex items-center space-x-1 mb-1">
                    <UserIcon className="w-3 h-3" />
                    <span>Atanan Kişi</span>
                  </div>
                  <div className="font-bold text-slate-800">
                    {users.find((u) => u.id === detailTask.assignedUserId)?.fullName || 'Atanmamış'}
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold text-[10px] flex items-center space-x-1 mb-1">
                    <Tag className="w-3 h-3" />
                    <span>Bağlı Proje</span>
                  </div>
                  <div className="font-semibold text-indigo-700">{project.name}</div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold text-[10px] flex items-center space-x-1 mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Harcanan / Planlanan</span>
                  </div>
                  <div className="font-bold text-slate-800">
                    {detailTask.actualHours}h / {detailTask.estimatedHours}h
                  </div>
                </div>

                <div>
                  <div className="text-slate-400 font-semibold text-[10px] flex items-center space-x-1 mb-1">
                    <Calendar className="w-3 h-3" />
                    <span>Görev Tarihi</span>
                  </div>
                  <div className="font-semibold text-slate-800">
                    {detailTask.taskDate ? new Date(detailTask.taskDate).toLocaleDateString('tr-TR') : '-'}
                  </div>
                </div>
              </div>

              {/* Task Description */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-1.5">Açıklama & Detaylar</h4>
                <div className="bg-white border border-slate-200 rounded-xl p-3 text-slate-600 leading-relaxed min-h-[60px]">
                  {detailTask.description ? (
                    detailTask.description
                  ) : (
                    <span className="text-slate-400 italic">Bu görev için herhangi bir açıklama girilmemiş.</span>
                  )}
                </div>
              </div>

              {/* Discussion & Telegram Stream Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm">Görev Yazışmaları & Notlar</h4>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {comments.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg flex items-center space-x-1">
                    <span>📱 Telegram Bildirimi Aktif</span>
                  </span>
                </div>

                {/* Comments List */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 max-h-64 overflow-y-auto">
                  {loadingComments ? (
                    <div className="py-6 text-center text-slate-400 font-medium flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Yazışmalar yükleniyor...</span>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((c) => {
                      const isMe = c.userId === currentUser.id;
                      return (
                        <div
                          key={c.id}
                          className={`flex space-x-2.5 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
                        >
                          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs">
                            {c.user?.fullName ? c.user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                            }`}
                          >
                            <div className="flex items-center justify-between space-x-3 mb-1">
                              <span
                                className={`font-bold text-[11px] ${isMe ? 'text-indigo-100' : 'text-slate-900'}`}
                              >
                                {c.user?.fullName || 'Kullanıcı'}
                              </span>
                              <span
                                className={`text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}
                              >
                                {c.createdAt ? new Date(c.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="leading-normal whitespace-pre-wrap text-[11.5px]">{c.message}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 text-center text-slate-400 italic">
                      Henüz bu görev hakkında bir yazışma yapılmamış. İlk mesajı aşağıdan gönderebilirsiniz.
                    </div>
                  )}
                </div>

                {/* Comment Input Form */}
                <form onSubmit={handleSendComment} className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    placeholder="Görev hakkında bir mesaj veya not yazın (Telegram ile gider)..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newCommentText.trim() || sendingComment}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs shrink-0"
                  >
                    {sendingComment ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gönder</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
