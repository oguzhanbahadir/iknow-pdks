import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Lock,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Bot,
  Award,
  Sparkles,
  ExternalLink,
  Code2,
  Wrench,
  Compass,
  Plus,
  Check,
  UploadCloud,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { User, PersonelDetail } from '../types';
import { getAuthHeaders } from '../utils/api';

interface ProfilePageProps {
  currentUser: User;
  setCurrentUser: (u: User) => void;
}

const AVAILABLE_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript (ES6+)',
  'Next.js',
  'Vue.js',
  'PHP',
  'Laravel',
  'Node.js / Express',
  'Python',
  'C# / .NET',
  'Java / Spring',
  'HTML5 & CSS3',
  'Tailwind CSS',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Docker',
  'REST API Design',
  'GraphQL',
  'Git / GitHub',
];

const AVAILABLE_TOOLS = [
  'VS Code',
  'Postman',
  'Figma',
  'Git / GitHub',
  'Docker Desktop',
  'Jira / Trello',
  'Insomnia',
  'DBeaver / PhpMyAdmin',
  'Linux Terminal / Bash',
  'IntelliJ / WebStorm',
];

const DOMAINS = [
  'Frontend Geliştirici',
  'Backend Geliştirici',
  'Full-Stack Geliştirici',
  'Mobil & UI/UX',
  'DevOps & Cloud',
  'Veri & Veritabanı',
];

const EXPERIENCE_LEVELS = ['Başlangıç Seviyesi', 'Orta Seviye', 'İleri Seviye'];

export default function ProfilePage({ currentUser, setCurrentUser }: ProfilePageProps) {
  const [profileData, setProfileData] = useState<PersonelDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Basic Info Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  // Interactive Onboarding-Style Selection States
  const [primaryDomain, setPrimaryDomain] = useState('Frontend Geliştirici');
  const [experienceLevel, setExperienceLevel] = useState('Orta Seviye');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [preferredCareerPath, setPreferredCareerPath] = useState('');

  // Custom Input States
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customToolInput, setCustomToolInput] = useState('');

  // CV Upload State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [cvResult, setCvResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Global Save State
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; msg: string } | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const u: PersonelDetail = data.user;
        setProfileData(u);

        setFullName(u.fullName || '');
        setPhone(u.phone || '');
        setDepartment(u.department || '');
        setPrimaryDomain(u.primaryDomain || u.department || 'Frontend Geliştirici');
        setExperienceLevel(u.experienceLevel || 'Orta Seviye');
        setSelectedSkills(u.knownSkills || ['React', 'TypeScript', 'Tailwind CSS']);
        setSelectedTools(u.toolsUsed || ['VS Code', 'Git / GitHub', 'Postman']);
        setPreferredCareerPath(u.preferredCareerPath || '');
        setTelegramChatId(u.telegram_chat_id || '');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setCustomSkillInput('');
    }
  };

  const handleAddCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customToolInput.trim();
    if (trimmed && !selectedTools.includes(trimmed)) {
      setSelectedTools((prev) => [...prev, trimmed]);
      setCustomToolInput('');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveResult(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          fullName,
          phone,
          department: primaryDomain || department,
          password: password || undefined,
          primaryDomain,
          preferredCareerPath,
          experienceLevel,
          knownSkills: selectedSkills,
          toolsUsed: selectedTools,
          telegramChatId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveResult({ success: true, msg: 'Profil tercihleriniz ve yetkinlikleriniz başarıyla güncellendi!' });
        setPassword('');
        if (data.user) {
          setCurrentUser(data.user);
        }
        await fetchProfile();
      } else {
        setSaveResult({ success: false, msg: data.error || 'Profil güncellenemedi.' });
      }
    } catch (err) {
      setSaveResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCvUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) return;

    if (cvFile.type !== 'application/pdf' && !cvFile.name.toLowerCase().endsWith('.pdf')) {
      setCvResult({ success: false, msg: 'Yalnızca PDF formatında bir CV dosyası yükleyebilirsiniz.' });
      return;
    }

    if (cvFile.size > 1048576) {
      setCvResult({ success: false, msg: `CV dosya boyutu maksimum 1 MB (1024 KB) olabilir. Seçilen dosya: ${(cvFile.size / 1024 / 1024).toFixed(2)} MB` });
      return;
    }

    setUploadingCv(true);
    setCvResult(null);

    try {
      const formData = new FormData();
      formData.append('cv', cvFile);

      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('pdks_token')
            ? `Bearer ${localStorage.getItem('pdks_token')}`
            : '',
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCvResult({ success: true, msg: 'CV belgeniz başarıyla yüklendi!' });
        setCvFile(null);
        await fetchProfile();
      } else {
        setCvResult({ success: false, msg: data.error || 'CV yüklenemedi.' });
      }
    } catch (err) {
      setCvResult({ success: false, msg: 'CV yükleme sırasında sunucu hatası oluştu.' });
    } finally {
      setUploadingCv(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const cv = profileData?.cvFiles && profileData.cvFiles.length > 0 ? profileData.cvFiles[0] : null;
  const score = profileData?.scores && profileData.scores.length > 0 ? profileData.scores[0] : null;

  const displayUser = profileData || currentUser;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shrink-0">
            {displayUser.fullName ? displayUser.fullName.charAt(0).toUpperCase() : 'O'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">{displayUser.fullName}</h1>
              {displayUser.role === 'ADMIN' ? (
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Yönetici (Admin)</span>
                </span>
              ) : (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personel</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold flex items-center space-x-2">
              <span>{displayUser.email}</span>
              <span>•</span>
              <span className="text-indigo-600 font-bold">{primaryDomain || displayUser.department || 'Yönetim / IK'}</span>
            </p>
          </div>
        </div>

        {score && (
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex items-center space-x-3 shrink-0">
            <Award className="w-7 h-7 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Performans Puanı</p>
              <p className="text-lg font-extrabold text-indigo-950">⭐ {score.overallScore} / 10</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* SECTION 1: Kişisel Bilgiler & Şifre */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <UserIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-extrabold text-slate-900 text-base">Kişisel Hesabım & İletişim Bilgileri</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">Ad Soyad *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">E-Posta (Değiştirilemez)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  disabled
                  value={profileData?.email || ''}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">Telefon Numarası</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="+90 532..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block text-xs mb-1">Yeni Giriş Şifresi (Opsiyonel)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Değiştirmek istemiyorsanız boş bırakın"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Uzmanlık Alanı & Deneyim Seviyesi (Onboarding Wizard Kart Stili) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Ana Uzmanlık Alanınız & Deneyim Seviyeniz</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sistemde uzmanlaştığınız ana kategoriyi seçin.</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">Ana Çalışma Alanı</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {DOMAINS.map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => {
                    setPrimaryDomain(domain);
                    setDepartment(domain);
                  }}
                  className={`p-3 sm:p-3.5 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                    primaryDomain === domain
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <span>{domain}</span>
                  {primaryDomain === domain && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 block">Mevcut Deneyim Seviyeniz</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExperienceLevel(level)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                    experienceLevel === level
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: Bildiğiniz Teknolojiler (Onboarding Wizard Pill Stili) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <Code2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Bildiğiniz Teknolojiler & Diller</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tıklayarak seçin veya yeni bir teknoloji ekleyin.</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-full">
              {selectedSkills.length} Teknoloji Seçili
            </span>
          </div>

          {/* Custom Skill Input Form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Listede olmayan farklı bir teknoloji/dil ekleyin..."
              value={customSkillInput}
              onChange={(e) => setCustomSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill(e);
                }
              }}
              className="flex-1 py-2 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs font-medium"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              disabled={!customSkillInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center space-x-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ekle</span>
            </button>
          </div>

          {/* Skill Pills Grid */}
          <div className="flex flex-wrap gap-2 pt-1">
            {Array.from(new Set([...AVAILABLE_SKILLS, ...selectedSkills])).map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 4: Kullandığınız Araçlar & Yazılımlar (Onboarding Wizard Grid Stili) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <Wrench className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">Kullandığınız Geliştirme Araçları (Tools)</h2>
                <p className="text-xs text-slate-500 mt-0.5">Günlük işlerinizde kullandığınız araçları işaretleyin.</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-full">
              {selectedTools.length} Araç Seçili
            </span>
          </div>

          {/* Custom Tool Input Form */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Listede olmayan farklı bir araç/yazılım ekleyin..."
              value={customToolInput}
              onChange={(e) => setCustomToolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTool(e);
                }
              }}
              className="flex-1 py-2 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs font-medium"
            />
            <button
              type="button"
              onClick={handleAddCustomTool}
              disabled={!customToolInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center space-x-1 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Ekle</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {Array.from(new Set([...AVAILABLE_TOOLS, ...selectedTools])).map((tool) => {
              const isSelected = selectedTools.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{tool}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: CV Dosyası Yükleme & Telegram Bağlantısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CV Upload Dropzone Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h2 className="font-extrabold text-slate-900 text-base">Özgeçmiş (CV) Dosyam</h2>
            </div>

            {cv ? (
              <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Yüklü CV Belgesi</span>
                  <span className="text-[10px] text-slate-500">{cv.createdAt}</span>
                </div>
                <p className="font-bold text-slate-900 text-xs truncate">{cv.fileName}</p>
                <a
                  href={cv.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:underline pt-1"
                >
                  <span>PDF CV'yi Aç</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-800 font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sistemde henüz yüklenmiş CV belgeniz bulunmuyor.</span>
              </div>
            )}

            <div className="pt-1 space-y-3">
              <label className="font-bold text-slate-700 block text-xs">
                {cv ? 'Yeni CV Yükle (PDF, Max 1 MB)' : 'CV Belgenizi Yükleyin (PDF, Max 1 MB)'}
              </label>

              {cvFile ? (
                <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs truncate max-w-[160px]">{cvFile.name}</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {(cvFile.size / 1024).toFixed(1)} KB • UYGUN ✓
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCvFile(null)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 transition-all rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer space-y-2 group">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCvFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Dosya Seçmek İçin Tıklayın</p>
                    <p className="text-[10px] text-slate-500">PDF • Maksimum 1 MB</p>
                  </div>
                </label>
              )}

              {cvFile && (
                <button
                  type="button"
                  onClick={handleCvUpload}
                  disabled={uploadingCv}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{uploadingCv ? 'Yükleniyor...' : 'Seçili CV Belgesini Kaydet'}</span>
                </button>
              )}

              {cvResult && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                    cvResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {cvResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{cvResult.msg}</span>
                </div>
              )}
            </div>
          </div>

          {/* Telegram & Career Goals Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h2 className="font-extrabold text-slate-900 text-base">Telegram Bildirim Bağlantısı</h2>
              </div>

              <div>
                <label className="font-bold text-slate-700 block text-xs mb-1">Telegram Chat ID</label>
                <div className="relative">
                  <Bot className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Örn: 987654321"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-mono text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Telegram bota <code>/start</code> yazarak hesabınızı doğrulayabilir veya Chat ID'nizi elle girebilirsiniz.
                </p>
              </div>

              <div className="pt-2 space-y-1">
                <label className="font-bold text-slate-700 block text-xs flex items-center space-x-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kariyer Hedefi Notunuz (Opsiyonel)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Gelecek hedefiniz..."
                  value={preferredCareerPath}
                  onChange={(e) => setPreferredCareerPath(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4.5 rounded-3xl shadow-xs sticky bottom-4 z-20">
          <div>
            {saveResult && (
              <div
                className={`p-2.5 px-4 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                  saveResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {saveResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{saveResult.msg}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Kaydediliyor...' : 'Tüm Profil Değişikliklerini Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
