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
  FolderKanban,
  CheckCircle2,
  Sparkles,
  Archive,
  ArchiveRestore,
  Paperclip,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileGenericIcon,
  Download,
  Maximize2,
  UploadCloud,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { User, TaskItem, TaskComment, TaskAttachment, Project } from '../types';
import { getAuthHeaders } from '../utils/api';
import RichTextEditor from '../components/RichTextEditor';
import RichTextRenderer, { stripHtmlTags } from '../components/RichTextRenderer';
import TaskTimeTracker from '../components/TaskTimeTracker';

const formatToDatetimeLocal = (dStr?: string) => {
  if (!dStr) return '';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const getNowDatetimeLocal = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface TasksPageProps {
  currentUser: User;
}

export default function TasksPage({ currentUser }: TasksPageProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
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
    startDate: getNowDatetimeLocal(),
    dueDate: '',
    taskDate: new Date().toISOString().split('T')[0],
    category: 'Geliştirme',
  });

  // Task Detail & Comments Modal State
  const [detailTask, setDetailTask] = useState<TaskItem | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'details' | 'comments'>('details');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Attachment state
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUploadError, setAttachmentUploadError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [pendingCreateFiles, setPendingCreateFiles] = useState<File[]>([]);

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const uploadAttachmentFile = async (taskId: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
    const isDoc = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext);

    if (!isImage && !isDoc) {
      throw new Error('Yalnızca JPG, PNG görsel veya PDF, Word, Excel, TXT, CSV belgeleri yükleyebilirsiniz.');
    }

    if (isDoc && file.size > 200 * 1024) {
      throw new Error(`Belge dosyaları maksimum 200 KB olabilir. (${file.name}: ${(file.size / 1024).toFixed(1)} KB).`);
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const token = localStorage.getItem('pdks_token');
    const res = await fetch(`/api/tasks/${taskId}/attachments`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formDataUpload,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Dosya yüklenirken bir hata oluştu.');
    }
    return data.attachment as TaskAttachment;
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>, targetTaskId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentTaskId = targetTaskId || detailTask?.id || editingTask?.id;

    if (!currentTaskId) {
      // It's a new task creation, add to pending files
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
      const isDoc = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'].includes(ext);

      if (!isImage && !isDoc) {
        setAttachmentUploadError('Yalnızca JPG, PNG görsel veya PDF, Word, Excel, TXT, CSV belgeleri yükleyebilirsiniz.');
        e.target.value = '';
        return;
      }

      if (isDoc && file.size > 200 * 1024) {
        setAttachmentUploadError(`Belge dosyaları maksimum 200 KB olabilir. (${file.name}: ${(file.size / 1024).toFixed(1)} KB).`);
        e.target.value = '';
        return;
      }

      setAttachmentUploadError(null);
      setPendingCreateFiles((prev) => [...prev, file]);
      e.target.value = '';
      return;
    }

    setAttachmentUploadError(null);
    setUploadingAttachment(true);

    try {
      const newAttachment = await uploadAttachmentFile(currentTaskId, file);

      // Update detailTask if matching
      if (detailTask && detailTask.id === currentTaskId) {
        const updatedAttachments = [newAttachment, ...(detailTask.attachments || [])];
        setDetailTask({ ...detailTask, attachments: updatedAttachments });
      }

      // Update editingTask if matching
      if (editingTask && editingTask.id === currentTaskId) {
        const updatedAttachments = [newAttachment, ...(editingTask.attachments || [])];
        setEditingTask({ ...editingTask, attachments: updatedAttachments });
      }

      // Update in tasks list
      setTasks((prev) =>
        prev.map((t) => (t.id === currentTaskId ? { ...t, attachments: [newAttachment, ...(t.attachments || [])] } : t))
      );
    } catch (err: any) {
      console.error('Attachment upload error:', err);
      setAttachmentUploadError(err.message || 'Sunucu bağlantı hatası oluştu.');
    } finally {
      setUploadingAttachment(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachmentId: string, targetTaskId?: string) => {
    const currentTaskId = targetTaskId || detailTask?.id || editingTask?.id;
    if (!currentTaskId || !window.confirm('Bu eki silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/tasks/${currentTaskId}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        if (detailTask && detailTask.id === currentTaskId) {
          const updatedAttachments = (detailTask.attachments || []).filter((a) => a.id !== attachmentId);
          setDetailTask({ ...detailTask, attachments: updatedAttachments });
        }
        if (editingTask && editingTask.id === currentTaskId) {
          const updatedAttachments = (editingTask.attachments || []).filter((a) => a.id !== attachmentId);
          setEditingTask({ ...editingTask, attachments: updatedAttachments });
        }
        setTasks((prev) =>
          prev.map((t) =>
            t.id === currentTaskId
              ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attachmentId) }
              : t
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Ek silinemedi.');
      }
    } catch (err) {
      console.error('Attachment delete error:', err);
    }
  };

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
    fetchTasks();
    fetchUsers();
    fetchProjects();
    setLoading(false);
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
          const data = await res.json();
          if (data.task && pendingCreateFiles.length > 0) {
            for (const file of pendingCreateFiles) {
              try {
                await uploadAttachmentFile(data.task.id, file);
              } catch (uErr) {
                console.error('Pending file upload error:', uErr);
              }
            }
          }
          await fetchTasks();
        }
      }
    } catch (err) {
      console.error('Save task error:', err);
    }

    setPendingCreateFiles([]);
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

  const handleArchiveTask = async (taskId: string) => {
    if (!window.confirm('Bu görevi arşive taşımak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/archive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchTasks();
        if (detailTask && detailTask.id === taskId) {
          setDetailTask((prev) => (prev ? { ...prev, isArchived: true } : null));
        }
      }
    } catch (err) {
      console.error('Archive task error:', err);
    }
  };

  const handleUnarchiveTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/unarchive`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchTasks();
        if (detailTask && detailTask.id === taskId) {
          setDetailTask((prev) => (prev ? { ...prev, isArchived: false } : null));
        }
      }
    } catch (err) {
      console.error('Unarchive task error:', err);
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
    setPendingCreateFiles([]);
    setAttachmentUploadError(null);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      assignedUserId: task.assignedUserId,
      projectId: task.projectId || '',
      estimatedHours: task.estimatedHours || 4,
      actualHours: task.actualHours || 0,
      startDate: formatToDatetimeLocal(task.startDate || task.taskDate || task.createdAt) || getNowDatetimeLocal(),
      dueDate: formatToDatetimeLocal(task.dueDate),
      taskDate: formatToDatetimeLocal(task.taskDate) || getNowDatetimeLocal(),
      category: task.category || 'Geliştirme',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingTask(null);
    setPendingCreateFiles([]);
    setAttachmentUploadError(null);
    setFormData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      assignedUserId: currentUser.id,
      projectId: '',
      estimatedHours: 4,
      actualHours: 0,
      startDate: getNowDatetimeLocal(),
      dueDate: '',
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

  const getCategoryBadge = (category?: string) => {
    const cat = (category || 'Genel').trim();
    const lower = cat.toLowerCase();

    if (lower.includes('bug') || lower.includes('hata')) {
      return (
        <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>🐛</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('geliştirme') || lower.includes('feature') || lower.includes('feat')) {
      return (
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>🚀</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('iyileştirme') || lower.includes('improve')) {
      return (
        <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>✨</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('test') || lower.includes('qa')) {
      return (
        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>🧪</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('analiz') || lower.includes('araştırma')) {
      return (
        <span className="bg-cyan-50 text-cyan-700 border border-cyan-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>🔍</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('doküman') || lower.includes('doc')) {
      return (
        <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>📝</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('devops') || lower.includes('altyapı') || lower.includes('infra')) {
      return (
        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>🛠️</span>
          <span>{cat}</span>
        </span>
      );
    }
    if (lower.includes('tasarım') || lower.includes('ui') || lower.includes('ux')) {
      return (
        <span className="bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200/80 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
          <span>🎨</span>
          <span>{cat}</span>
        </span>
      );
    }
    return (
      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-semibold text-[10.5px] flex items-center space-x-1">
        <span>📌</span>
        <span>{cat}</span>
      </span>
    );
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

  const archivedCount = tasks.filter((t) => Boolean(t.isArchived)).length;

  const filteredTasks = tasks.filter((t) => {
    const matchesArchive = showArchived ? Boolean(t.isArchived) : !t.isArchived;

    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesUser = selectedUserFilter === 'ALL' || t.assignedUserId === selectedUserFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;

    if (!isAdmin && t.assignedUserId !== currentUser.id) {
      return false;
    }

    return matchesArchive && matchesSearch && matchesUser && matchesStatus;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Görev Panosu & Takip</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Tüm personellerin görevlerini Kanban ve Liste modunda yönetebilir ve veritabanına kaydedebilirsiniz.'
              : 'Üstlendiğiniz görevleri tanımlayın, durumunu güncelleyin ve eforunuzu kaydedin.'}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Görev Ekle</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-1">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'kanban'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
          </div>

          <div className="relative flex-1 min-w-[180px] sm:max-w-xs">
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

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {isAdmin && (
            <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
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
            className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">Tüm Durumlar</option>
            <option value="TODO">Yapılacak</option>
            <option value="IN_PROGRESS">Devam Ediyor</option>
            <option value="IN_REVIEW">İncelemede</option>
            <option value="DONE">Tamamlandı</option>
          </select>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shrink-0 ${showArchived
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            title={showArchived ? 'Aktif görevleri göster' : 'Arşivlenmiş görevleri listele'}
          >
            {showArchived ? (
              <>
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Aktif Görevler</span>
              </>
            ) : (
              <>
                <Archive className="w-3.5 h-3.5 text-amber-600" />
                <span>Arşivdekiler</span>
                {archivedCount > 0 && (
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {archivedCount}
                  </span>
                )}
              </>
            )}
          </button>
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
                          <div className="flex items-center space-x-1">
                            {t.isArchived && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-1">
                                <Archive className="w-2.5 h-2.5 text-amber-600" />
                                <span>Arşivde</span>
                              </span>
                            )}
                            {t.project ? (
                              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 inline-block">
                                📁 {t.project.name}
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-semibold text-slate-400">#{t.id.slice(0, 6)}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-0.5">
                            {t.attachments && t.attachments.length > 0 ? (
                              <button
                                onClick={() => openDetailModal(t)}
                                className="flex items-center space-x-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full hover:bg-teal-100 transition-colors shadow-2xs shrink-0"
                                title={`${t.attachments.length} ek yüklü - Detayları gör`}
                              >
                                <Paperclip className="w-3 h-3 text-teal-600" />
                                <span>{t.attachments.length}</span>
                              </button>
                            ) : null}
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
                            {isAdmin && (
                              t.isArchived ? (
                                <button
                                  onClick={() => handleUnarchiveTask(t.id)}
                                  className="text-amber-600 hover:text-amber-800 p-1 transition-colors"
                                  title="Arşivden Çıkar (Panoya Geri Yükle)"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleArchiveTask(t.id)}
                                  className="text-slate-400 hover:text-amber-600 p-1 transition-colors"
                                  title="Görevi Arşive Taşı"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                            {(isAdmin || (t.createdById ? t.createdById === currentUser.id : t.assignedUserId === currentUser.id)) && (
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                          {t.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{stripHtmlTags(t.description)}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                          {getCategoryBadge(t.category)}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {assignedUser ? (
                            <div className="flex items-center space-x-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center">
                                {assignedUser.fullName ? assignedUser.fullName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <span className="text-[11px] font-medium text-slate-700">
                                {assignedUser.fullName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Atanmamış</span>
                          )}

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
                  <th className="py-3.5 px-4 min-w-[190px]">Süre & Sayaç</th>
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
                          {t.isArchived && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 shrink-0">
                              <Archive className="w-3 h-3 text-amber-600" />
                              <span>Arşivde</span>
                            </span>
                          )}
                          {t.project && (
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100 shrink-0">
                              📁 {t.project.name}
                            </span>
                          )}
                          <span>{t.title}</span>
                          {t.attachments && t.attachments.length > 0 ? (
                            <button
                              onClick={() => openDetailModal(t)}
                              className="inline-flex items-center space-x-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full hover:bg-teal-100 transition-colors shrink-0"
                              title={`${t.attachments.length} dosya/ek yüklü - Görüntüle`}
                            >
                              <Paperclip className="w-3 h-3 text-teal-600" />
                              <span>{t.attachments.length} Ek</span>
                            </button>
                          ) : null}
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
                        <div className="text-[11px] text-slate-400 line-clamp-1">{stripHtmlTags(t.description || '')}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {assignedUser ? assignedUser.fullName : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {getCategoryBadge(t.category)}
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
                      <td className="py-3 px-4">
                        <div className="min-w-[160px]">
                          <TaskTimeTracker task={t} />
                        </div>
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
                          className="text-slate-500 hover:text-indigo-600 font-semibold text-xs inline-flex items-center space-x-1"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Düzenle</span>
                        </button>
                        {isAdmin && (
                          t.isArchived ? (
                            <button
                              onClick={() => handleUnarchiveTask(t.id)}
                              className="text-amber-600 hover:text-amber-800 font-semibold text-xs inline-flex items-center space-x-1"
                              title="Arşivden Çıkar (Panoya Geri Yükle)"
                            >
                              <ArchiveRestore className="w-3.5 h-3.5" />
                              <span>Geri Yükle</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveTask(t.id)}
                              className="text-slate-500 hover:text-amber-600 font-semibold text-xs inline-flex items-center space-x-1"
                              title="Görevi Arşive Taşı"
                            >
                              <Archive className="w-3.5 h-3.5" />
                              <span>Arşivle</span>
                            </button>
                          )
                        )}
                        {(isAdmin || (t.createdById ? t.createdById === currentUser.id : t.assignedUserId === currentUser.id)) && (
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="text-slate-500 hover:text-red-600 font-semibold text-xs inline-flex items-center space-x-1"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Sil</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Hiç görev bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT TASK SIDEBAR DRAWER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-full sm:max-w-lg md:max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-200 text-xs text-slate-700">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FolderKanban className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {editingTask ? 'Görevi Düzenle' : 'Yeni Görev Tanımla'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {editingTask ? 'Görev detaylarını ve atamasını güncelleyin.' : 'Yeni görev detaylarını girin ve personeli belirleyin.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Form Body */}
              <form id="tasks-main-form" onSubmit={handleSaveTask} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Görev Başlığı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Frontend API Entegrasyonu"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>📁 Bağlı Olduğu Proje</span>
                    {formData.projectId && (
                      <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Proje Bağlı
                      </span>
                    )}
                  </label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
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
                  <label className="font-semibold text-slate-700 block mb-1">Açıklama & Detaylar (Zengin Metin)</label>
                  <RichTextEditor
                    value={formData.description || ''}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                    placeholder="Görev kapsamı, yapılacak adımlar, teknik notlar ve kabul kriterleri..."
                    minHeight="140px"
                    maxHeight="320px"
                  />
                </div>

                {/* TASK ATTACHMENTS & DOCUMENTS IN CREATE / EDIT FORM */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 block flex items-center space-x-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-teal-600" />
                      <span>Ekler ve Belgeler</span>
                    </label>
                  </div>

                  {/* Upload Box */}
                  <div className="bg-slate-50/80 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-3 transition-colors">
                    <label className="flex flex-col items-center justify-center cursor-pointer text-center group">
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        onChange={(e) => handleUploadAttachment(e, editingTask?.id)}
                        disabled={uploadingAttachment}
                      />
                      <div className="p-1.5 bg-white rounded-full text-indigo-600 shadow-xs mb-1 group-hover:scale-110 transition-transform">
                        {uploadingAttachment ? (
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                      </div>
                      <span className="font-bold text-slate-800 text-xs group-hover:text-indigo-600 transition-colors">
                        {uploadingAttachment ? 'Dosya Yükleniyor...' : 'Görsel veya Belge Eklemek İçin Tıklayın'}
                      </span>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Görseller (JPG, PNG) ve Belgeler (PDF, Word, Excel, TXT, CSV)
                      </p>
                    </label>
                  </div>

                  {/* Upload error alert */}
                  {attachmentUploadError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div className="flex-1">
                        <p className="font-semibold">{attachmentUploadError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachmentUploadError(null)}
                        className="text-rose-400 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Existing attachments when editing */}
                  {editingTask && editingTask.attachments && editingTask.attachments.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Yüklü Ekler ({editingTask.attachments.length})
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {editingTask.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
                          >
                            <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                              {att.fileType === 'image' ? (
                                <img
                                  src={att.fileUrl}
                                  alt={att.fileName}
                                  className="w-6 h-6 object-cover rounded shrink-0 border border-slate-200"
                                />
                              ) : (
                                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <span className="truncate text-[11px] font-medium text-slate-800" title={att.fileName}>
                                {att.fileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id, editingTask.id)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0 ml-1"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending files when creating new task */}
                  {!editingTask && pendingCreateFiles.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        Kaydedilecek Ekler ({pendingCreateFiles.length})
                      </span>
                      <div className="space-y-1.5">
                        {pendingCreateFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs"
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <span className="truncate text-[11px] font-semibold text-indigo-950" title={file.name}>
                                {file.name}
                              </span>
                              <span className="text-[10px] text-slate-500 shrink-0">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors shrink-0 ml-1"
                              title="Kaldır"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center justify-between">
                      <span>Atanan Personel</span>
                      {isAdmin ? (
                        <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                          Admin
                        </span>
                      ) : formData.projectId && projects.find((p) => p.id === formData.projectId)?.members?.some((m) => m.userId === currentUser.id && m.status === 'APPROVED' && m.isModerator) ? (
                        <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-bold">
                          Moderatör
                        </span>
                      ) : null}
                    </label>
                    {isAdmin || (formData.projectId && projects.find((p) => p.id === formData.projectId)?.members?.some((m) => m.userId === currentUser.id && m.status === 'APPROVED' && m.isModerator)) ? (
                      <select
                        value={formData.assignedUserId}
                        onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                        className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                      >
                        {users
                          .filter((u) => u.role === 'USER' || isAdmin)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} {u.department ? `(${u.department})` : ''}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="py-2.5 px-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-medium">
                        {users.find((u) => u.id === formData.assignedUserId)?.fullName || currentUser.fullName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Görev Kategorisi / Türü</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                    >
                      <option value="Geliştirme">🚀 Geliştirme (Feature)</option>
                      <option value="Bug">🐛 Bug / Hata</option>
                      <option value="Hata / Bug">🐛 Hata / Bug</option>
                      <option value="İyileştirme">✨ İyileştirme (Improvement)</option>
                      <option value="Analiz & Araştırma">🔍 Analiz & Araştırma</option>
                      <option value="Test & QA">🧪 Test & QA</option>
                      <option value="Dokümantasyon">📝 Dokümantasyon</option>
                      <option value="Altyapı / DevOps">🛠️ Altyapı / DevOps</option>
                      <option value="Tasarım / UI">🎨 Tasarım / UI</option>
                      <option value="Genel">📌 Genel</option>
                      {formData.category &&
                        !['Geliştirme', 'Bug', 'Hata / Bug', 'İyileştirme', 'Analiz & Araştırma', 'Test & QA', 'Dokümantasyon', 'Altyapı / DevOps', 'Tasarım / UI', 'Genel'].includes(formData.category) && (
                          <option value={formData.category}>🏷️ {formData.category}</option>
                        )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Öncelik Seviyesi</label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as TaskItem['priority'] })
                      }
                      className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                    >
                      <option value="LOW">Düşük (LOW)</option>
                      <option value="MEDIUM">Orta (MEDIUM)</option>
                      <option value="HIGH">Yüksek (HIGH)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Görev Durumu</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as TaskItem['status'] })
                      }
                      className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                    >
                      <option value="TODO">Yapılacak (TODO)</option>
                      <option value="IN_PROGRESS">Devam Ediyor (IN_PROGRESS)</option>
                      <option value="IN_REVIEW">İncelemede (IN_REVIEW)</option>
                      <option value="DONE">Tamamlandı (DONE)</option>
                    </select>
                  </div>
                </div>

                {/* START AND DUE DATETIMES */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Başlangıç Tarihi ve Saati</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hedef Bitiş Tarihi ve Saati</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                    />
                  </div>
                </div>
              </form>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  form="tasks-main-form"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  {editingTask ? 'Değişiklikleri Güncelle' : 'Görevi Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TASK DETAIL & LIVE CHAT SIDEBAR DRAWER */}
      {detailTask && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setDetailTask(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex shadow-2xl">
            {/* DESKTOP-ONLY LEFT PANEL: Görev Yazışmaları & Notlar */}
            <div className="w-[320px] sm:w-[350px] md:w-[380px] bg-slate-50/90 border-l border-r border-slate-200 hidden lg:flex flex-col h-full animate-in slide-in-from-right duration-200 text-xs text-slate-700">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Yazışmalar & Notlar</h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {comments.length} mesaj • Telegram bildirimli
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full font-bold">
                  {comments.length}
                </span>
              </div>

              {/* Comments Scrollable Stream */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
                {loadingComments ? (
                  <div className="py-12 text-center text-slate-400 font-medium flex items-center justify-center space-x-2">
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
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <span
                              className={`font-bold text-[11px] truncate ${isMe ? 'text-indigo-100' : 'text-slate-900'}`}
                            >
                              {c.user?.fullName || 'Kullanıcı'}
                            </span>
                            <span
                              className={`text-[9px] shrink-0 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}
                            >
                              {c.createdAt
                                ? new Date(c.createdAt).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="leading-normal whitespace-pre-wrap text-[11.5px]">{c.message}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs italic">
                    Henüz bu görev hakkında bir yazışma yapılmamış. İlk mesajı aşağıdan gönderebilirsiniz.
                  </div>
                )}
              </div>

              {/* Bottom Send Box */}
              <form
                onSubmit={handleSendComment}
                className="p-3 border-t border-slate-200 bg-white shrink-0 flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="Mesaj veya not yazın (Telegram ile gider)..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim() || sendingComment}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold p-2.5 rounded-xl flex items-center justify-center transition-colors shadow-xs shrink-0"
                  title="Gönder"
                >
                  {sendingComment ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
            </div>

            {/* MAIN PANEL: Task Details & Mobile Tabs */}
            <div className="w-screen max-w-full sm:max-w-lg md:max-w-xl bg-white flex flex-col h-full animate-in slide-in-from-right duration-200 text-xs text-slate-700">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                  <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{detailTask.title}</h3>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 mt-0.5 flex-wrap gap-y-1">
                      {detailTask.isArchived && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                          <Archive className="w-2.5 h-2.5 text-amber-600" />
                          <span>Arşivde</span>
                        </span>
                      )}
                      <span
                        className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${
                          detailTask.priority === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : detailTask.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {detailTask.priority}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">•</span>
                      <span className="text-[10px] sm:text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                        {statusColumns.find((s) => s.key === detailTask.status)?.label || detailTask.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 ml-2">
                  {isAdmin &&
                    (detailTask.isArchived ? (
                      <button
                        onClick={() => handleUnarchiveTask(detailTask.id)}
                        className="px-2 sm:px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors"
                        title="Arşivden Çıkar"
                      >
                        <ArchiveRestore className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">Arşivden Çıkar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchiveTask(detailTask.id)}
                        className="px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center space-x-1 transition-colors"
                        title="Arşive Taşı"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Arşive Taşı</span>
                      </button>
                    ))}

                  {(isAdmin || (detailTask.createdById ? detailTask.createdById === currentUser.id : detailTask.assignedUserId === currentUser.id)) && (
                    <button
                      onClick={() => {
                        handleDeleteTask(detailTask.id);
                        setDetailTask(null);
                      }}
                      className="px-2 sm:px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-lg text-xs flex items-center space-x-1 transition-colors"
                      title="Görevi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span className="hidden sm:inline">Sil</span>
                    </button>
                  )}

                  <button
                    onClick={() => setDetailTask(null)}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* MOBILE ONLY TAB SWITCHER */}
              <div className="flex lg:hidden border-b border-slate-200 bg-slate-100/70 p-1 shrink-0">
                <button
                  onClick={() => setActiveDetailTab('details')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    activeDetailTab === 'details'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Görev Detayları</span>
                </button>
                <button
                  onClick={() => setActiveDetailTab('comments')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                    activeDetailTab === 'comments'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Yazışmalar ({comments.length})</span>
                </button>
              </div>

              {/* MOBILE COMMENTS VIEW */}
              {activeDetailTab === 'comments' ? (
                <div className="flex-1 flex flex-col min-h-0 lg:hidden">
                  <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50">
                    {loadingComments ? (
                      <div className="py-12 text-center text-slate-400 font-medium flex items-center justify-center space-x-2">
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
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                                isMe
                                  ? 'bg-indigo-600 text-white rounded-tr-none'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                              }`}
                            >
                              <div className="flex items-center justify-between space-x-2 mb-1">
                                <span
                                  className={`font-bold text-[11px] truncate ${isMe ? 'text-indigo-100' : 'text-slate-900'}`}
                                >
                                  {c.user?.fullName || 'Kullanıcı'}
                                </span>
                                <span
                                  className={`text-[9px] shrink-0 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}
                                >
                                  {c.createdAt
                                    ? new Date(c.createdAt).toLocaleTimeString('tr-TR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </div>
                              <p className="leading-normal whitespace-pre-wrap text-[11.5px]">{c.message}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-xs italic">
                        Henüz bu görev hakkında bir yazışma yapılmamış.
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={handleSendComment}
                    className="p-3 border-t border-slate-200 bg-white shrink-0 flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      placeholder="Mesaj veya not yazın..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
                    />
                    <button
                      type="submit"
                      disabled={!newCommentText.trim() || sendingComment}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold p-2.5 rounded-xl flex items-center justify-center transition-colors shadow-xs shrink-0"
                      title="Gönder"
                    >
                      {sendingComment ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                /* MAIN DETAILS SCROLLABLE BODY */
                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1 text-xs text-slate-700">
                  {/* Task Details Overview Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div>
                      <div className="text-slate-400 font-semibold text-[10px] flex items-center space-x-1 mb-1">
                        <UserIcon className="w-3 h-3" />
                        <span>Atanan Kişi</span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs">
                        {users.find((u) => u.id === detailTask.assignedUserId)?.fullName || 'Atanmamış'}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-semibold text-[10px] flex items-center space-x-1 mb-1">
                        <Tag className="w-3 h-3" />
                        <span>Kategori</span>
                      </div>
                      <div>{getCategoryBadge(detailTask.category)}</div>
                    </div>

                    <div className="col-span-1 sm:col-span-2 bg-white rounded-xl p-3 border border-slate-200">
                      <TaskTimeTracker task={detailTask} />
                    </div>
                  </div>

                  {/* Task Description */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-1.5">Açıklama & Detaylar</h4>
                    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-slate-700 text-xs min-h-[80px]">
                      <RichTextRenderer content={detailTask.description} />
                    </div>
                  </div>

                  {/* Task Attachments (Images & Documents) Section */}
                  {detailTask.attachments && detailTask.attachments.length > 0 && (
                    <div className="space-y-3.5 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-teal-600" />
                          <h4 className="font-bold text-slate-900 text-sm">Ekler ve Belgeler</h4>
                          <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {detailTask.attachments.length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Image attachments gallery */}
                        {detailTask.attachments.filter((a) => a.fileType === 'image').length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center space-x-1">
                              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Görseller ({detailTask.attachments.filter((a) => a.fileType === 'image').length})</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {detailTask.attachments
                                .filter((a) => a.fileType === 'image')
                                .map((att) => (
                                  <div
                                    key={att.id}
                                    className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
                                    onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                    title="Büyütmek için tıklayın"
                                  >
                                    <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                                      <img
                                        src={att.fileUrl}
                                        alt={att.fileName}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                                        <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                      </div>
                                      <span className="absolute top-1.5 right-1.5 bg-slate-900/70 text-white font-semibold text-[9px] px-1.5 py-0.5 rounded-md shadow-xs">
                                        {formatFileSize(att.fileSize)}
                                      </span>
                                    </div>
                                    <div className="p-2 flex items-center justify-between bg-white" onClick={(e) => e.stopPropagation()}>
                                      <span
                                        className="font-medium text-slate-800 text-[10.5px] truncate flex-1 pr-1 cursor-pointer hover:text-indigo-600"
                                        title={att.fileName}
                                        onClick={() => setPreviewImage({ url: att.fileUrl, name: att.fileName })}
                                      >
                                        {att.fileName}
                                      </span>
                                      <div className="flex items-center space-x-1 shrink-0">
                                        <a
                                          href={att.fileUrl}
                                          download={att.fileName}
                                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                          title="İndir"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </a>
                                        {(isAdmin || att.userId === currentUser.id) && (
                                          <button
                                            onClick={() => handleDeleteAttachment(att.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                            title="Sil"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Document attachments list */}
                        {detailTask.attachments.filter((a) => a.fileType === 'document').length > 0 && (
                          <div>
                            <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center space-x-1">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Belgeler ({detailTask.attachments.filter((a) => a.fileType === 'document').length})</span>
                            </div>
                            <div className="space-y-1.5">
                              {detailTask.attachments
                                .filter((a) => a.fileType === 'document')
                                .map((att) => {
                                  const ext = att.fileName.split('.').pop()?.toLowerCase() || '';
                                  let icon = <FileGenericIcon className="w-4 h-4 text-slate-600" />;
                                  if (ext === 'pdf') icon = <FileText className="w-4 h-4 text-red-600" />;
                                  else if (['doc', 'docx'].includes(ext)) icon = <FileText className="w-4 h-4 text-blue-600" />;
                                  else if (['xls', 'xlsx', 'csv'].includes(ext)) icon = <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
                                  else if (['zip', 'rar'].includes(ext)) icon = <FileArchive className="w-4 h-4 text-amber-600" />;

                                  return (
                                    <div
                                      key={att.id}
                                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-xs transition-all shadow-2xs group cursor-pointer"
                                      onClick={() => window.open(att.fileUrl, '_blank')}
                                      title="Açmak için tıklayın"
                                    >
                                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                        <div className="p-1.5 bg-slate-100 group-hover:bg-indigo-50 rounded-lg shrink-0 transition-colors">
                                          {icon}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="font-semibold text-slate-900 text-xs truncate group-hover:text-indigo-600 transition-colors" title={att.fileName}>
                                            {att.fileName}
                                          </div>
                                          <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                            <span className="font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                              {formatFileSize(att.fileSize)}
                                            </span>
                                            {att.user && <span>• {att.user.fullName}</span>}
                                            {att.createdAt && (
                                              <span>• {new Date(att.createdAt).toLocaleDateString('tr-TR')}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                                        <a
                                          href={att.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-semibold rounded-lg text-[11px] flex items-center space-x-1 transition-colors"
                                          title="Görüntüle / İndir"
                                        >
                                          <Download className="w-3 h-3" />
                                          <span className="hidden sm:inline">Aç / İndir</span>
                                        </a>
                                        {(isAdmin || att.userId === currentUser.id) && (
                                          <button
                                            onClick={() => handleDeleteAttachment(att.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                            title="Sil"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-white">
              <span className="font-semibold text-xs truncate max-w-md">{previewImage.name}</span>
              <div className="flex items-center space-x-2">
                <a
                  href={previewImage.url}
                  download={previewImage.name}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>İndir</span>
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

