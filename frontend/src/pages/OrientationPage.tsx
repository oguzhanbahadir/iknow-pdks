import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  Lock,
  Globe,
  FileText,
  Edit2,
  Trash2,
  ChevronRight,
  UserPlus,
  CheckCircle2,
  X,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { User } from '../types';
import { getAuthHeaders } from '../utils/api';

interface OrientationPageProps {
  currentUser: User;
}

export interface OrientationDocumentItem {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  isPublic: boolean;
  assignedUserIds: string[];
  assignedUsers?: User[];
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  'Proje Kurulumu',
  'Teknik Rehber',
  'Şirket Prosedürü',
  'Oryantasyon & Eğitim',
];

export default function OrientationPage({ currentUser }: OrientationPageProps) {
  const [documents, setDocuments] = useState<OrientationDocumentItem[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // Reader Modal State
  const [activeReadDoc, setActiveReadDoc] = useState<OrientationDocumentItem | null>(null);
  const [readCompletedDocs, setReadCompletedDocs] = useState<string[]>([]);

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<OrientationDocumentItem | null>(null);
  const [formState, setFormState] = useState({
    title: '',
    category: 'Proje Kurulumu',
    description: '',
    content: '',
    isPublic: false,
    assignedUserIds: [] as string[],
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Assign Personnel Modal State
  const [assignModalDoc, setAssignModalDoc] = useState<OrientationDocumentItem | null>(null);
  const [assignUserIds, setAssignUserIds] = useState<string[]>([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/orientations', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Fetch orientation docs error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    async function init() {
      await fetchDocuments();
      if (isAdmin) {
        await fetchUsers();
      }
      setLoading(false);
    }
    init();
  }, [isAdmin]);

  // Handle Create / Edit Open
  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setFormState({
      title: '',
      category: 'Proje Kurulumu',
      description: '',
      content: '',
      isPublic: false,
      assignedUserIds: [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: OrientationDocumentItem) => {
    setEditingDoc(doc);
    setFormState({
      title: doc.title,
      category: doc.category || 'Proje Kurulumu',
      description: doc.description || '',
      content: doc.content || '',
      isPublic: doc.isPublic,
      assignedUserIds: doc.assignedUserIds || [],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit (Create / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.content.trim()) {
      setFormError('Lütfen başlık ve içeriği eksiksiz doldurun.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const url = editingDoc ? `/api/orientations/${editingDoc.id}` : '/api/orientations';
      const method = editingDoc ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: formState.title,
          category: formState.category,
          description: formState.description,
          content: formState.content,
          isPublic: formState.isPublic,
          assignedUserIds: formState.assignedUserIds,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await fetchDocuments();
        setIsModalOpen(false);
      } else {
        setFormError(data.error || data.message || 'Doküman kaydedilemedi.');
      }
    } catch (err: unknown) {
      console.error('Save doc error:', err);
      setFormError('Sunucu bağlantı hatası.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/orientations/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchDocuments();
        setDeleteDocId(null);
        if (activeReadDoc?.id === id) {
          setActiveReadDoc(null);
        }
      } else {
        alert('Doküman silinirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Delete doc error:', err);
    }
  };

  // Handle Save Assignment
  const handleSaveAssignments = async () => {
    if (!assignModalDoc) return;
    setAssignSubmitting(true);

    try {
      const res = await fetch(`/api/orientations/${assignModalDoc.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: assignModalDoc.title,
          category: assignModalDoc.category,
          description: assignModalDoc.description,
          content: assignModalDoc.content,
          isPublic: assignModalDoc.isPublic,
          assignedUserIds: assignUserIds,
        }),
      });

      if (res.ok) {
        await fetchDocuments();
        setAssignModalDoc(null);
      } else {
        alert('Atamalar kaydedilirken hata oluştu.');
      }
    } catch (err) {
      console.error('Assign save error:', err);
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Toggle user assignment in form or assign modal
  const toggleUserInAssignList = (userId: string) => {
    setAssignUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleUserInForm = (userId: string) => {
    setFormState((prev) => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId],
    }));
  };

  // Filtered Documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'ALL' || doc.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Oryantasyon dokümanları yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Oryantasyon & Proje Rehberleri</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Proje kurulum adımları, teknik dokümantasyonlar ve atanan kişiye özel rehber belgeleri.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Rehber / Doküman Ekle</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Doküman veya rehber ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tüm Rehberler ({documents.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = documents.filter((d) => d.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => {
          const isRead = readCompletedDocs.includes(doc.id);

          return (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all group"
            >
              <div className="space-y-3">
                {/* Top Badges */}
                <div className="flex items-center justify-between">
                  <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-md">
                    {doc.category || 'Proje Kurulumu'}
                  </span>

                  {doc.isPublic ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      <span>Herkese Açık</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>{doc.assignedUserIds.length} Kişiye Özel</span>
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  {doc.description ? (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1 italic">Açıklama bulunmuyor.</p>
                  )}
                </div>

                {/* Assigned Personnel Avatars (if private & Admin) */}
                {isAdmin && !doc.isPublic && doc.assignedUsers && doc.assignedUsers.length > 0 && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Davetli Personel ({doc.assignedUsers.length})
                    </p>
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      {doc.assignedUsers.slice(0, 4).map((u) => (
                        <span
                          key={u.id}
                          className="bg-slate-100 text-slate-700 font-semibold text-[10px] px-2 py-0.5 rounded-md border border-slate-200"
                        >
                          {u.fullName}
                        </span>
                      ))}
                      {doc.assignedUsers.length > 4 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          +{doc.assignedUsers.length - 4} kişi
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveReadDoc(doc)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-xs ${
                    isRead
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isRead ? 'İncele (Tamamlandı)' : 'Oku & Uygula'}</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </button>

                {isAdmin && (
                  <div className="flex items-center space-x-1">
                    {!doc.isPublic && (
                      <button
                        onClick={() => {
                          setAssignModalDoc(doc);
                          setAssignUserIds(doc.assignedUserIds);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-100"
                        title="Personel Davet Et / Erişim Güncelle"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditModal(doc)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-slate-100"
                      title="Dokümanı Düzenle"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteDocId(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-100"
                      title="Dokümanı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-slate-800 text-base">Henüz doküman bulunamadı</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Aradığınız kriterlere uygun veya size atanmış oryantasyon ve kurulum rehberi bulunmamaktadır.
            </p>
          </div>
        )}
      </div>

      {/* READ DOCUMENT MODAL */}
      {activeReadDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
              <div className="space-y-1 pr-4">
                <span className="inline-block bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                  {activeReadDoc.category}
                </span>
                <h2 className="text-xl font-extrabold text-white leading-snug">
                  {activeReadDoc.title}
                </h2>
                {activeReadDoc.description && (
                  <p className="text-xs text-slate-300">{activeReadDoc.description}</p>
                )}
              </div>
              <button
                onClick={() => setActiveReadDoc(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Content Display */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800 text-sm leading-relaxed">
              <div className="prose max-w-none space-y-4 whitespace-pre-line font-medium text-slate-700 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                {activeReadDoc.content}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center space-x-1">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Adım adım kurulumu tamamladıktan sonra okudum butonunu işaretleyin.</span>
              </div>

              <button
                onClick={() => {
                  if (!readCompletedDocs.includes(activeReadDoc.id)) {
                    setReadCompletedDocs((prev) => [...prev, activeReadDoc.id]);
                  }
                  setActiveReadDoc(null);
                }}
                className={`px-5 py-2.5 font-bold rounded-xl text-xs flex items-center space-x-2 transition-all shadow-xs ${
                  readCompletedDocs.includes(activeReadDoc.id)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {readCompletedDocs.includes(activeReadDoc.id)
                    ? 'Tamamlandı Olarak İşaretlendi'
                    : 'Okudum & Adımları Tamamladım'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT DOCUMENT MODAL (ADMIN ONLY) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="font-extrabold text-lg">
                  {editingDoc ? 'Dokümanı Düzenle' : 'Yeni Oryantasyon / Rehber Ekle'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block text-xs mb-1">
                  Doküman Başlığı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Proje A Kurulum Adımları & Ortam Değişkenleri"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">Kategori</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">Erişim Yetkisi</label>
                  <select
                    value={formState.isPublic ? 'PUBLIC' : 'PRIVATE'}
                    onChange={(e) =>
                      setFormState({ ...formState, isPublic: e.target.value === 'PUBLIC' })
                    }
                    className="w-full py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                  >
                    <option value="PRIVATE">🔒 Özel (Sadece Seçilen Kişiler)</option>
                    <option value="PUBLIC">🌐 Herkese Açık (Tüm Personel)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block text-xs mb-1">
                  Kısa Açıklama (Özet)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Docker container'larının kaldırılması ve local DB bağlantı adımları."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block text-xs mb-1">
                  Adım Adım Kurulum / Rehber İçeriği *
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder={`1. Adım: Projeyi klonlayın:\n  git clone https://...\n2. Adım: Bağımlılıkları yükleyin:\n  npm install\n3. Adım: .env dosyasını yapılandırın...`}
                  value={formState.content}
                  onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  className="w-full py-3 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 leading-relaxed font-mono"
                />
              </div>

              {/* Personnel Selection for Private Access */}
              {!formState.isPublic && (
                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <label className="font-bold text-slate-700 block text-xs">
                    Bu Rehbere Erişim İzni Verilecek Personeller / Stajyerler:
                  </label>

                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                    {allUsers
                      .filter((u) => u.role === 'USER')
                      .map((u) => {
                        const isChecked = formState.assignedUserIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className="flex items-center space-x-2.5 text-xs text-slate-800 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleUserInForm(u.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold">{u.fullName}</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {u.department || 'Yazılım'} • {u.email}
                              </span>
                            </div>
                          </label>
                        );
                      })}

                    {allUsers.filter((u) => u.role === 'USER').length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center">
                        Sistemde henüz kayıtlı personel bulunmamaktadır.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? 'Kaydediliyor...' : editingDoc ? 'Güncelle' : 'Dokümanı Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN PERSONNEL MODAL (ADMIN ONLY) */}
      {assignModalDoc && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Personel Davet Et & Erişim İzinleri</h3>
              </div>
              <button
                onClick={() => setAssignModalDoc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">{assignModalDoc.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bu rehberi görüntülemesine izin verilecek personelleri işaretleyin.
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                {allUsers
                  .filter((u) => u.role === 'USER')
                  .map((u) => {
                    const isChecked = assignUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center space-x-2.5 text-xs text-slate-800 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUserInAssignList(u.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold">{u.fullName}</span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {u.department || 'Yazılım'}
                          </span>
                        </div>
                      </label>
                    );
                  })}
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAssignModalDoc(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  disabled={assignSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50"
                >
                  {assignSubmitting ? 'Kaydediliyor...' : 'İzinleri Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteDocId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Doküman Silinsin mi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bu rehber kalıcı olarak silinecek ve atanmış personeller artık erişemeyecektir.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteDocId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Vazgeç
              </button>
              <button
                onClick={() => handleDeleteDoc(deleteDocId)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
