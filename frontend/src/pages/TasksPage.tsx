import React, { useState, useEffect } from 'react';
import {
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  Clock,
  X,
  Edit2,
  Trash2,
  Eye,
  Send,
  MessageSquare,
  Calendar,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import { User, TaskItem, TaskComment, Project } from '../types';
import { getAuthHeaders } from '../utils/api';

interface TasksPageProps {
  currentUser: User;
}

export default function TasksPage({ currentUser }: TasksPageProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserFilter, setSelectedUserFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Drag and Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE',
    assignedUserId: currentUser.id,
    projectId: '',
    estimatedHours: 4,
    actualHours: 0,
    taskDate: new Date().toISOString().split('T')[0],
    category: 'Geliştirme',
  });

  // Task Detail & Comments Modal State
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Fetch tasks error:', err);
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

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchTasks(), fetchUsers(), fetchProjects()]);
      setLoading(false);
    }
    init();
  }, []);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchTasks();
        }
      } else {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          await fetchTasks();
        }
      }
    } catch (err) {
      console.error('Save task error:', err);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Bu görevi silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Delete task error:', err);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: TaskItem['status']) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      assignedUserId: task.assignedUserId,
      projectId: task.projectId || '',
      estimatedHours: task.estimatedHours || 4,
      actualHours: task.actualHours || 0,
      taskDate: task.taskDate ? new Date(task.taskDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: task.category || 'Genel',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedUserId: currentUser.id,
      projectId: '',
      estimatedHours: 4,
      actualHours: 0,
      taskDate: new Date().toISOString().split('T')[0],
      category: 'Geliştirme',
    });
  };

  const openDetailModal = async (task: TaskItem) => {
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

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesUser = selectedUserFilter === 'ALL' || t.assignedUserId === selectedUserFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;

    if (!isAdmin && t.assignedUserId !== currentUser.id) {
      return false;
    }

    return matchesSearch && matchesUser && matchesStatus;
  });

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Görev verileri çekiliyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Görev Panosu & Takip</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Tüm personellerin görevlerini Kanban ve Liste modunda yönetebilir ve veritabanına kaydedebilirsiniz.'
              : 'Üstlendiğiniz görevleri tanımlayın, durumunu güncelleyin ve eforunuzu kaydedin.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev Ekle</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Panosu</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste Görünümü</span>
            </button>
          </div>

          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Görev adı veya başlık ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
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
            </div>
          )}

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="TODO">Yapılacak</option>
            <option value="IN_PROGRESS">Devam Ediyor</option>
            <option value="IN_REVIEW">İncelemede</option>
            <option value="DONE">Tamamlandı</option>
          </select>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
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
                    handleUpdateStatus(taskId, col.key as TaskItem['status']);
                  }
                }}
                className={`border rounded-2xl p-4 flex flex-col min-h-[500px] transition-all duration-150 ${isOver
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400 ring-offset-2'
                    : 'bg-slate-100/70 border-slate-200'
                  }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${col.bgColor} ${col.textColor} ${col.borderColor}`}>
                      {col.label}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{colTasks.length}</span>
                  </div>
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
                        className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing select-none ${isDragging
                            ? 'opacity-40 scale-95 border-dashed border-indigo-400 bg-indigo-50/40'
                            : 'border-slate-200'
                          }`}
                      >
                        <div className="flex items-center justify-between">
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
                          <div className="flex items-center space-x-1">
                            {t.commentsCount && t.commentsCount > 0 ? (
                              <button
                                onClick={() => openDetailModal(t)}
                                className="flex items-center space-x-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors shadow-2xs shrink-0"
                                title={`${t.commentsCount} yorum var - Yazışmaları gör`}
                              >
                                <MessageSquare className="w-3 h-3 text-indigo-600 fill-indigo-100" />
                                <span>{t.commentsCount}</span>
                              </button>
                            ) : null}
                            <button
                              onClick={() => openDetailModal(t)}
                              className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                              title="Görev Detayı & Yazışmalar"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(t)}
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
                          {t.project && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 inline-block mb-1">
                              📁 {t.project.name}
                            </span>
                          )}
                          <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                          {t.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
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
                              <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                                {assignedUser.fullName ? assignedUser.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="text-[11px] font-medium text-slate-700">
                                {assignedUser.fullName}
                              </span>
                            </div>
                          )}

                          <select
                            value={t.status}
                            onChange={(e) =>
                              handleUpdateStatus(t.id, e.target.value as TaskItem['status'])
                            }
                            className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1 text-slate-700 focus:outline-none"
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
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
                      Görev yok (Sürükleyip bırakabilirsiniz)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Görev Başlığı</th>
                  <th className="py-3.5 px-4">Atanan Personel</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Öncelik</th>
                  <th className="py-3.5 px-4">Harcanan Efor</th>
                  <th className="py-3.5 px-4">Durum</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => {
                  const assignedUser = users.find((u) => u.id === t.assignedUserId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2 flex-wrap gap-y-1">
                          {t.project && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                              📁 {t.project.name}
                            </span>
                          )}
                          <span>{t.title}</span>
                          {t.commentsCount && t.commentsCount > 0 ? (
                            <button
                              onClick={() => openDetailModal(t)}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors shrink-0"
                              title={`${t.commentsCount} yorum var - Yazışmaları görüntüle`}
                            >
                              <MessageSquare className="w-3 h-3 text-indigo-600 fill-indigo-100" />
                              <span>{t.commentsCount} Yorum</span>
                            </button>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{t.description}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {assignedUser ? assignedUser.fullName : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {t.category || 'Genel'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${t.priority === 'HIGH'
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
                            handleUpdateStatus(t.id, e.target.value as TaskItem['status'])
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
                          onClick={() => openDetailModal(t)}
                          className="text-slate-500 hover:text-indigo-600 font-semibold text-xs inline-flex items-center space-x-1"
                          title="Görev Detayı & Yazışmalar"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detay</span>
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
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

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Görev kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTask ? 'Görevi Düzenle' : 'Yeni Görev Yaz'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Frontend API Entegrasyonu"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>📁 Bağlı Olduğu Proje (Projeye Taşı / Değiştir)</span>
                  {formData.projectId && (
                    <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Proje Bağlı
                    </span>
                  )}
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                >
                  <option value="">-- Bağımsız Görev (Herhangi Bir Projeye Bağlı Değil) --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Açıklama & Detaylar</label>
                <textarea
                  rows={3}
                  placeholder="Yapılacak adımlar ve notlar..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isAdmin ? (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Atanan Personel</label>
                    <select
                      value={formData.assignedUserId}
                      onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                    >
                      {users
                        .filter((u) => u.role === 'USER')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Öncelik Seviyesi</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as TaskItem['priority'] })
                    }
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="LOW">Düşük (LOW)</option>
                    <option value="MEDIUM">Orta (MEDIUM)</option>
                    <option value="HIGH">Yüksek (HIGH)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Planlanan Efor (Saat)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedHours}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedHours: Number(e.target.value) })
                    }
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Gerçekleşen Efor (Saat)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.actualHours}
                    onChange={(e) =>
                      setFormData({ ...formData, actualHours: Number(e.target.value) })
                    }
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  {editingTask ? 'Güncelle' : 'Görev Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* TASK DETAIL & CHAT MODAL */}
      {detailTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${detailTask.priority === 'HIGH'
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
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
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
                    <span>Kategori</span>
                  </div>
                  <div className="font-semibold text-slate-800">{detailTask.category || 'Genel'}</div>
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
                    <span>📱 Anlık Telegram Bildirimi</span>
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
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-xs ${isMe
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

