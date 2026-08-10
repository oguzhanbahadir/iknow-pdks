import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  FileText,
  Building2,
  Star,
  ExternalLink,
  Upload,
  Search,
  ChevronRight,
  X,
  UserPlus,
  Link as LinkIcon,
  Copy,
  Check,
  KeyRound,
  Lock,
  Trash2,
  LayoutList,
  LayoutGrid,
  ShieldAlert,
  UserCheck,
  UserX,
  Bot,
} from 'lucide-react';
import { User, PersonelDetail } from '../types';
import { getAuthHeaders } from '../utils/api';

interface InternsPageProps {
  currentUser: User;
}

export default function InternsPage({ currentUser }: InternsPageProps) {
  const navigate = useNavigate();
  const [interns, setInterns] = useState<PersonelDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals
  const [isAddInternModalOpen, setIsAddInternModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [activeScoreModalUser, setActiveScoreModalUser] = useState<PersonelDetail | null>(null);
  const [activeIntegrationModalUser, setActiveIntegrationModalUser] = useState<PersonelDetail | null>(null);
  const [activeCVModalUser, setActiveCVModalUser] = useState<PersonelDetail | null>(null);
  const [activeResetPasswordUser, setActiveResetPasswordUser] = useState<PersonelDetail | null>(null);
  const [activeDeleteUser, setActiveDeleteUser] = useState<PersonelDetail | null>(null);

  // New Intern Form (Manual)
  const [addInternForm, setAddInternForm] = useState({
    fullName: '',
    email: '',
    password: '',
    department: 'Frontend Geliştirici',
    phone: '',
    targetCompany: '',
    companyIntegrationNote: '',
  });
  const [addInternError, setAddInternError] = useState('');
  const [addInternLoading, setAddInternLoading] = useState(false);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Password Reset Form
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  // Delete State
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  // Score Form
  const [scoreForm, setScoreForm] = useState({
    techScore: 8,
    softSkillScore: 8,
    punctualityScore: 8,
    feedbackNote: '',
  });

  // Integration Form
  const [integrationForm, setIntegrationForm] = useState({
    targetCompany: '',
    companyIntegrationNote: '',
  });

  // CV Upload Form
  const [cvFileName, setCvFileName] = useState('');

  const fetchInterns = async () => {
    try {
      const res = await fetch('/api/interns', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInterns(data.interns || []);
      }
    } catch (err) {
      console.error('Fetch interns error:', err);
    }
  };

  useEffect(() => {
    async function init() {
      if (currentUser.role !== 'ADMIN') {
        navigate('/dashboard');
        return;
      }
      await fetchInterns();
      setLoading(false);
    }
    init();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Personel verileri çekiliyor...
      </div>
    );
  }

  const filteredInterns = interns.filter(
    (i) =>
      i.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.department && i.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (i.targetCompany && i.targetCompany.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Password Reset Handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResetPasswordUser || !newPassword) return;

    setResetLoading(true);
    setResetSuccessMsg('');
    setResetErrorMsg('');

    try {
      const res = await fetch('/api/interns/reset-password', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: activeResetPasswordUser.id,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Şifre sıfırlanamadı.');
      }

      setResetSuccessMsg(data.message || 'Şifre başarıyla güncellendi.');
      setNewPassword('');
      setTimeout(() => {
        setActiveResetPasswordUser(null);
        setResetSuccessMsg('');
      }, 1800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setResetErrorMsg(err.message);
      } else {
        setResetErrorMsg('Bir hata oluştu.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Delete Intern Handler
  const handleDeleteIntern = async () => {
    if (!activeDeleteUser) return;

    setDeleteLoading(true);
    setDeleteErrorMsg('');

    try {
      const res = await fetch(`/api/interns/${activeDeleteUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Personel silinemedi.');
      }

      await fetchInterns();
      setActiveDeleteUser(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteErrorMsg(err.message);
      } else {
        setDeleteErrorMsg('Bir hata oluştu.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toggle Approve Handler
  const handleToggleApprove = async (userId: string) => {
    try {
      const res = await fetch(`/api/interns/${userId}/toggle-approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        await fetchInterns();
      }
    } catch (err) {
      console.error('Toggle approve error:', err);
    }
  };

  // Manual Intern Create Handler
  const handleCreateInternManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addInternForm.fullName || !addInternForm.email || !addInternForm.password) {
      setAddInternError('Ad Soyad, E-posta ve Şifre zorunludur.');
      return;
    }

    setAddInternLoading(true);
    setAddInternError('');

    try {
      const res = await fetch('/api/interns/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addInternForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Personel kaydı oluşturulamadı.');
      }

      await fetchInterns();
      setIsAddInternModalOpen(false);
      setAddInternForm({
        fullName: '',
        email: '',
        password: '',
        department: 'Frontend Geliştirici',
        phone: '',
        targetCompany: '',
        companyIntegrationNote: '',
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setAddInternError(err.message);
      } else {
        setAddInternError('Hata oluştu.');
      }
    } finally {
      setAddInternLoading(false);
    }
  };

  // Open Invite Modal with default general link
  const handleOpenInviteModal = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    setGeneratedInviteLink(`${origin}/register`);
    setInviteEmail('');
    setIsInviteModalOpen(true);
  };

  // Generate Invite Link
  const handleGenerateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    if (inviteEmail.trim()) {
      setGeneratedInviteLink(`${origin}/register?email=${encodeURIComponent(inviteEmail.trim())}`);
    } else {
      setGeneratedInviteLink(`${origin}/register`);
    }
  };

  const handleCopyLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Score Submission
  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScoreModalUser) return;

    try {
      const res = await fetch('/api/interns', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: activeScoreModalUser.id,
          ...scoreForm,
        }),
      });

      if (res.ok) {
        await fetchInterns();
      }
    } catch (err) {
      console.error('Save score error:', err);
    }
    setActiveScoreModalUser(null);
  };

  // Integration Note Submission
  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIntegrationModalUser) return;

    try {
      const res = await fetch('/api/interns', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: activeIntegrationModalUser.id,
          ...integrationForm,
        }),
      });

      if (res.ok) {
        await fetchInterns();
      }
    } catch (err) {
      console.error('Save integration error:', err);
    }
    setActiveIntegrationModalUser(null);
  };

  // CV File Save
  const handleSaveCV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCVModalUser || !cvFileName.trim()) return;

    try {
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          userId: activeCVModalUser.id,
          fileName: cvFileName,
        }),
      });

      if (res.ok) {
        await fetchInterns();
      }
    } catch (err) {
      console.error('Save CV error:', err);
    }
    setActiveCVModalUser(null);
    setCvFileName('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Personel Yönetimi & CV Kayıtları</h1>
            <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
              ADMIN ÖZEL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Yeni personel ekleyin, e-posta daveti gönderin, şifre sıfırlayın ve yeteneklerini puanlayın.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Liste Görünümü"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Liste</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kartlar</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Personel ismi, e-posta veya şirket ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[180px] sm:w-[220px] pl-9 pr-3 h-9 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 shadow-xs"
            />
          </div>

          <button
            onClick={handleOpenInviteModal}
            className="h-9 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 font-semibold text-xs px-3.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs shrink-0"
          >
            <LinkIcon className="w-4 h-4 text-indigo-600" />
            <span>Davet Bağlantısı Üret</span>
          </button>

          <button
            onClick={() => setIsAddInternModalOpen(true)}
            className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Yeni Personel Ekle</span>
          </button>
        </div>
      </div>

      {/* Unapproved Personnel Warning Banner */}
      {interns.some((i) => i.isApproved === false) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3 text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold">
              <strong className="font-extrabold">{interns.filter((i) => i.isApproved === false).length} adet personel</strong> kaydı onayınızı bekliyor. Onaylanmayan personeller sisteme giriş yapamaz.
            </p>
          </div>
        </div>
      )}

      {/* Render List View (Default) vs Grid View */}
      {viewMode === 'list' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Personel Bilgisi</th>
                  <th className="py-3.5 px-4">Departman & Şirket</th>
                  <th className="py-3.5 px-4">Erişim Durumu</th>
                  <th className="py-3.5 px-4">Performans Skoru</th>
                  <th className="py-3.5 px-4">CV Dosyası</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredInterns.map((intern) => {
                  const score = intern.scores && intern.scores.length > 0 ? intern.scores[0] : null;
                  const cv = intern.cvFiles && intern.cvFiles.length > 0 ? intern.cvFiles[0] : null;

                  return (
                    <tr key={intern.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-slate-700">
                            {intern.fullName ? intern.fullName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <Link
                              to={`/team/${intern.id}`}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-xs block"
                            >
                              {intern.fullName}
                            </Link>
                            <span className="text-[11px] text-slate-400 block">{intern.email}</span>
                            {intern.telegram_chat_id ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md mt-0.5">
                                <Bot className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="font-mono">ID: {intern.telegram_chat_id}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic block mt-0.5">
                                Telegram: Yok
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department & Target Company */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block bg-slate-100 text-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                            {intern.department || 'Yazılım'}
                          </span>
                          {intern.targetCompany ? (
                            <p className="text-[11px] text-indigo-900 font-semibold flex items-center space-x-1">
                              <Building2 className="w-3 h-3 text-indigo-600 inline mr-1" />
                              <span>{intern.targetCompany}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Şirket atanmadı</p>
                          )}
                        </div>
                      </td>

                      {/* Access Status (Approval) */}
                      <td className="py-3 px-4">
                        {intern.isApproved !== false ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Onaylandı</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>Onay Bekliyor</span>
                          </span>
                        )}
                      </td>

                      {/* Performance Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {score ? (
                            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg">
                              ⭐ {score.overallScore} / 10
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Puan Yok</span>
                          )}
                          <button
                            onClick={() => {
                              setActiveScoreModalUser(intern);
                              setScoreForm({
                                techScore: score?.techScore || 8,
                                softSkillScore: score?.softSkillScore || 8,
                                punctualityScore: score?.punctualityScore || 8,
                                feedbackNote: score?.feedbackNote || '',
                              });
                            }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-100 transition-colors text-[11px] font-semibold flex items-center space-x-1"
                            title="Puan Ver"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Puanla</span>
                          </button>
                        </div>
                      </td>

                      {/* CV Attachment */}
                      <td className="py-3 px-4">
                        {cv ? (
                          <a
                            href={cv.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] font-semibold text-indigo-600 hover:underline bg-indigo-50/60 px-2 py-1 rounded-md border border-indigo-100"
                          >
                            <FileText className="w-3 h-3 text-indigo-500" />
                            <span className="max-w-[120px] truncate">{cv.fileName}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveCVModalUser(intern);
                              setCvFileName(`${intern.fullName.replace(/\s+/g, '_')}_CV.pdf`);
                            }}
                            className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 underline"
                          >
                            + CV Yükle
                          </button>
                        )}
                      </td>

                      {/* Onboarding Skills */}
                      <td className="py-3 px-4">
                        {intern.isOnboarded ? (
                          <div className="flex flex-wrap gap-1 max-w-[160px]">
                            {intern.knownSkills && intern.knownSkills.length > 0 ? (
                              intern.knownSkills.slice(0, 3).map((sk) => (
                                <span key={sk} className="bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
                                  {sk}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">Tamamlandı</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            Bekliyor
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {intern.isApproved === false ? (
                            <button
                              onClick={() => handleToggleApprove(intern.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-[11px] flex items-center space-x-1 shadow-xs"
                              title="Hesabı Onayla"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Onayla</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleApprove(intern.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-100"
                              title="Personel Onayını Kaldır"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            to={`/team/${intern.id}`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-[11px] flex items-center space-x-0.5"
                            title="Detay Görüntüle"
                          >
                            <span>Detay</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => {
                              setActiveResetPasswordUser(intern);
                              setNewPassword('');
                              setResetSuccessMsg('');
                              setResetErrorMsg('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-slate-100"
                            title="Şifre Sıfırla"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setActiveDeleteUser(intern);
                              setDeleteErrorMsg('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-slate-100"
                            title="Personeli Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredInterns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-800 text-sm">Aranan kriterlerde personel bulunamadı</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterns.map((intern) => {
            const score = intern.scores && intern.scores.length > 0 ? intern.scores[0] : null;
            const cv = intern.cvFiles && intern.cvFiles.length > 0 ? intern.cvFiles[0] : null;

            return (
              <div
                key={intern.id}
                className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                  intern.isApproved === false ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Profile Header */}
                <div className="space-y-3">
                  {intern.isApproved === false && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        <span>Onay Bekliyor</span>
                      </span>
                      <button
                        onClick={() => handleToggleApprove(intern.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded-md text-[10px] shadow-xs"
                      >
                        Onayla
                      </button>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center shadow-xs border border-slate-700">
                        {intern.fullName ? intern.fullName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{intern.fullName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{intern.department || 'Yazılım'}</p>
                        <p className="text-[11px] text-slate-400">{intern.email}</p>
                        {intern.telegram_chat_id ? (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md mt-1">
                            <Bot className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="font-mono">Chat ID: {intern.telegram_chat_id}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic block mt-1">
                            Telegram: Bağlı Değil
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      {intern.isApproved !== false ? (
                        <button
                          onClick={() => handleToggleApprove(intern.id)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-slate-100"
                          title="Onayı Kaldır"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleApprove(intern.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200 font-bold"
                          title="Hesabı Onayla"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveResetPasswordUser(intern);
                          setNewPassword('');
                          setResetSuccessMsg('');
                          setResetErrorMsg('');
                        }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-slate-100"
                        title="Şifre Sıfırla"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveDeleteUser(intern);
                          setDeleteErrorMsg('');
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-100"
                        title="Personeli Sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Score Section */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Performans Skoru</span>
                      </span>
                      {score ? (
                        <span className="text-sm font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {score.overallScore} / 10
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Henüz Puanlanmadı</span>
                      )}
                    </div>

                    {score && (
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-center pt-1 border-t border-slate-200/60">
                        <div className="bg-white p-1 rounded-md border border-slate-100">
                          <span className="text-slate-400 block">Teknik</span>
                          <span className="font-bold text-slate-900">{score.techScore}/10</span>
                        </div>
                        <div className="bg-white p-1 rounded-md border border-slate-100">
                          <span className="text-slate-400 block">Soft Skill</span>
                          <span className="font-bold text-slate-900">{score.softSkillScore}/10</span>
                        </div>
                        <div className="bg-white p-1 rounded-md border border-slate-100">
                          <span className="text-slate-400 block">Disiplin</span>
                          <span className="font-bold text-slate-900">{score.punctualityScore}/10</span>
                        </div>
                      </div>
                    )}

                    {score?.feedbackNote && (
                      <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-200 line-clamp-2">
                        "{score.feedbackNote}"
                      </p>
                    )}
                  </div>

                  {/* Target Company & Integration Plan */}
                  <div className="space-y-1 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                      <span className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Hedef Şirket Planı</span>
                      </span>
                      <button
                        onClick={() => {
                          setActiveIntegrationModalUser(intern);
                          setIntegrationForm({
                            targetCompany: intern.targetCompany || '',
                            companyIntegrationNote: intern.companyIntegrationNote || '',
                          });
                        }}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        Düzenle
                      </button>
                    </div>
                    {intern.targetCompany ? (
                      <div>
                        <span className="text-xs font-bold text-indigo-900">{intern.targetCompany}</span>
                        {intern.companyIntegrationNote && (
                          <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                            {intern.companyIntegrationNote}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic block">Şirket/Proje atanmadı</span>
                    )}
                  </div>

                  {/* Onboarding Skills & Tools Preview */}
                  {intern.isOnboarded ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-700 text-[11px]">
                        <span>Oryantasyon Becerileri</span>
                        <span className="text-indigo-600 font-semibold">{intern.primaryDomain}</span>
                      </div>
                      {intern.knownSkills && intern.knownSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {intern.knownSkills.slice(0, 5).map((sk) => (
                            <span key={sk} className="bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {sk}
                            </span>
                          ))}
                          {intern.knownSkills.length > 5 && (
                            <span className="text-[10px] font-bold text-slate-400">+{intern.knownSkills.length - 5} daha</span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-800 font-medium text-center">
                      İlk Giriş Oryantasyonu Bekleniyor
                    </div>
                  )}

                  {/* CV File Attachment Status */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700">
                        {cv ? cv.fileName : 'CV Yüklenmemiş'}
                      </span>
                    </div>
                    {cv ? (
                      <a
                        href={cv.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-indigo-600 hover:underline flex items-center space-x-1"
                      >
                        <span>İncele</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveCVModalUser(intern);
                          setCvFileName(`${intern.fullName.replace(/\s+/g, '_')}_CV.pdf`);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        + Yükle
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveScoreModalUser(intern);
                      setScoreForm({
                        techScore: score?.techScore || 8,
                        softSkillScore: score?.softSkillScore || 8,
                        punctualityScore: score?.punctualityScore || 8,
                        feedbackNote: score?.feedbackNote || '',
                      });
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Puan Ver</span>
                  </button>

                  <Link
                    to={`/team/${intern.id}`}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs py-2 px-3 rounded-xl flex items-center space-x-1 transition-colors"
                  >
                    <span>Detay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredInterns.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 p-6">
              <UserPlus className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">Henüz Kayıtlı Personel Yok</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Yukarıdaki "+ Yeni Personel Ekle" butonunu kullanarak doğrudan yeni personel tanımlayabilir veya davet bağlantısı üretebilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {activeDeleteUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  <span>Personel Kaydını Sil</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Bu işlem geri alınamaz.</p>
              </div>
              <button
                onClick={() => setActiveDeleteUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {deleteErrorMsg}
              </div>
            )}

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                <strong className="text-slate-900 font-bold">{activeDeleteUser.fullName}</strong> ({activeDeleteUser.email}) isimli personeli silmek istediğinize emin misiniz?
              </p>
              <p className="text-slate-500 text-[11px]">
                Bu personele ait tüm görevler, performans skorları ve CV dosyaları kalıcı olarak silinecektir.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveDeleteUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors text-xs"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDeleteIntern}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-xs text-xs disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Siliniyor...' : 'Evet, Sil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {activeResetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                  <span>Personel Şifresi Sıfırla</span>
                </h3>
                <p className="text-xs text-slate-500">{activeResetPasswordUser.fullName} ({activeResetPasswordUser.email})</p>
              </div>
              <button
                onClick={() => setActiveResetPasswordUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold text-center">
                {resetSuccessMsg}
              </div>
            )}

            {resetErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {resetErrorMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Yeni Şifre Belirleyin *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="En az 6 karakter yeni şifre"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveResetPasswordUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  {resetLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL ADD INTERN MODAL */}
      {isAddInternModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Manuel Yeni Personel Ekle</h3>
                <p className="text-xs text-slate-500">Personel bilgilerini doğrudan veritabanına kaydedin.</p>
              </div>
              <button
                onClick={() => setIsAddInternModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addInternError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
                {addInternError}
              </div>
            )}

            <form onSubmit={handleCreateInternManual} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Mehmet Öz"
                    value={addInternForm.fullName}
                    onChange={(e) => setAddInternForm({ ...addInternForm, fullName: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">E-Posta Adresi *</label>
                  <input
                    type="email"
                    required
                    placeholder="mehmet@iknow.com.tr"
                    value={addInternForm.email}
                    onChange={(e) => setAddInternForm({ ...addInternForm, email: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Geçici Şifre *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={addInternForm.password}
                    onChange={(e) => setAddInternForm({ ...addInternForm, password: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Departman</label>
                  <select
                    value={addInternForm.department}
                    onChange={(e) => setAddInternForm({ ...addInternForm, department: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="Frontend Geliştirici">Frontend Geliştirici</option>
                    <option value="Backend Geliştirici">Backend Geliştirici</option>
                    <option value="Full-Stack Geliştirici">Full-Stack Geliştirici</option>
                    <option value="Mobil & UI/UX">Mobil & UI/UX</option>
                    <option value="DevOps & Cloud">DevOps & Cloud</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Telefon</label>
                  <input
                    type="tel"
                    placeholder="+90 5XX XXX XX XX"
                    value={addInternForm.phone}
                    onChange={(e) => setAddInternForm({ ...addInternForm, phone: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hedef Şirket (Opsiyonel)</label>
                  <input
                    type="text"
                    placeholder="Örn: IKnow Fintech A.Ş."
                    value={addInternForm.targetCompany}
                    onChange={(e) => setAddInternForm({ ...addInternForm, targetCompany: e.target.value })}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Entegrasyon Notu</label>
                <textarea
                  rows={2}
                  placeholder="Personele dair ön notlar..."
                  value={addInternForm.companyIntegrationNote}
                  onChange={(e) => setAddInternForm({ ...addInternForm, companyIntegrationNote: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddInternModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={addInternLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs disabled:opacity-50"
                >
                  {addInternLoading ? 'Ekleniyor...' : 'Personeli Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE LINK GENERATION MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Personel Kayıt Davet Bağlantısı</h3>
                <p className="text-xs text-slate-500">Personelin kendi hesabını oluşturabilmesi için link üretin.</p>
              </div>
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setGeneratedInviteLink('');
                  setInviteEmail('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                <label className="font-bold text-indigo-950 block text-xs">Genel Kayıt Bağlantısı</label>
                <p className="text-[11px] text-slate-600">
                  Bu bağlantıyı kopyalayarak yeni başlayacak personele gönderebilirsiniz. Personel kendi e-posta ve şifresiyle kaydolup sisteme erişebilir.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={generatedInviteLink || `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/register`}
                    className="flex-1 py-2 px-3 bg-white border border-indigo-200 rounded-xl text-indigo-900 font-mono text-[11px] select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-colors shrink-0 shadow-xs text-xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Kopyalandı!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Kopyala</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Özel E-Posta Bağlantısı (Opsiyonel)</span>
                </div>
                <form onSubmit={handleGenerateInvite} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Örn: ahmet@iknow.com.tr"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-xl transition-colors shrink-0 text-xs"
                  >
                    Özel Link
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCORE MODAL */}
      {activeScoreModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Personel Değerlendirme & Puanlama</h3>
                <p className="text-xs text-slate-500">{activeScoreModalUser.fullName}</p>
              </div>
              <button
                onClick={() => setActiveScoreModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScore} className="space-y-4 text-xs">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Teknik Yetenek Puanı (1-10)</span>
                    <span className="font-bold text-indigo-600">{scoreForm.techScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreForm.techScore}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, techScore: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Soft Skills / İletişim Puanı (1-10)</span>
                    <span className="font-bold text-indigo-600">{scoreForm.softSkillScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreForm.softSkillScore}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, softSkillScore: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>Disiplin & Sorumluluk Puanı (1-10)</span>
                    <span className="font-bold text-indigo-600">{scoreForm.punctualityScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={scoreForm.punctualityScore}
                    onChange={(e) =>
                      setScoreForm({ ...scoreForm, punctualityScore: Number(e.target.value) })
                    }
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Değerlendirme Notu & Görüş</label>
                <textarea
                  rows={3}
                  placeholder="Personelin güçlü yönleri ve gelişim alanları hakkındaki gözlemleriniz..."
                  value={scoreForm.feedbackNote}
                  onChange={(e) => setScoreForm({ ...scoreForm, feedbackNote: e.target.value })}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveScoreModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  Puanı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTEGRATION MODAL */}
      {activeIntegrationModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Şirket & Proje Entegrasyon Planı</h3>
                <p className="text-xs text-slate-500">{activeIntegrationModalUser.fullName}</p>
              </div>
              <button
                onClick={() => setActiveIntegrationModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIntegration} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hedef Şirket / Proje Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: IKnow Fintech A.Ş. veya Bankacılık Portalı"
                  value={integrationForm.targetCompany}
                  onChange={(e) =>
                    setIntegrationForm({ ...integrationForm, targetCompany: e.target.value })
                  }
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Entegrasyon Notları & Uygunluk</label>
                <textarea
                  rows={4}
                  placeholder="Hangi alanlarda görev alabileceği, ekibe ne zaman dâhil edilebileceği..."
                  value={integrationForm.companyIntegrationNote}
                  onChange={(e) =>
                    setIntegrationForm({
                      ...integrationForm,
                      companyIntegrationNote: e.target.value,
                    })
                  }
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveIntegrationModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  Planı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CV MODAL */}
      {activeCVModalUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">CV Dosyası Bağla / Yükle</h3>
                <p className="text-xs text-slate-500">{activeCVModalUser.fullName}</p>
              </div>
              <button
                onClick={() => setActiveCVModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCV} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">CV Dosya Adı (PDF)</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ahmet_Yilmaz_CV.pdf"
                  value={cvFileName}
                  onChange={(e) => setCvFileName(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 p-6 rounded-xl text-center space-y-2 bg-slate-50">
                <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
                <p className="font-semibold text-slate-700">PDF Dosyanız Veritabanına Kaydediliyor</p>
                <p className="text-[11px] text-slate-400">PDF biçiminde özgeçmiş belgesi</p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveCVModalUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  CV Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
