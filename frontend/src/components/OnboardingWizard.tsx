import React, { useState } from 'react';
import {
  Sparkles,
  Code2,
  Wrench,
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Plus,
  FileText,
  UploadCloud,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { User } from '../types';
import { getAuthHeaders } from '../utils/api';

interface OnboardingWizardProps {
  currentUser: User;
  onComplete: (updatedUser: User) => void;
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

export default function OnboardingWizard({ currentUser, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [primaryDomain, setPrimaryDomain] = useState(currentUser.department || 'Frontend Geliştirici');
  const [experienceLevel, setExperienceLevel] = useState('Orta Seviye');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript', 'Tailwind CSS']);
  const [selectedTools, setSelectedTools] = useState<string[]>(['VS Code', 'Git / GitHub', 'Postman']);
  const [preferredCareerPath, setPreferredCareerPath] = useState('');

  // Custom Input States
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [customToolInput, setCustomToolInput] = useState('');

  // CV File State (PDF, Max 1MB)
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState('');

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setCvError('Yalnızca PDF formatında bir CV dosyası yükleyebilirsiniz.');
      setCvFile(null);
      return;
    }

    if (file.size > 1048576) {
      setCvError(`CV dosya boyutu maksimum 1 MB (1024 KB) olabilir. Seçilen dosya: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      setCvFile(null);
      return;
    }

    setCvFile(file);
    setCvError('');
  };

  const handleNextStep = () => {
    if (currentStep === 4 && !cvFile) {
      setCvError('Devam edebilmek için lütfen PDF formatında (maksimum 1 MB) CV dosyanızı yükleyin.');
      return;
    }
    setCvError('');
    setCurrentStep((prev) => prev + 1);
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

  const handleSubmit = async () => {
    if (!cvFile) {
      setCurrentStep(4);
      setCvError('Profilinizi tamamlamak için lütfen PDF formatında (maksimum 1 MB) CV dosyanızı yükleyin.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload CV file
      const formData = new FormData();
      formData.append('file', cvFile);

      const cvRes = await fetch('/api/cv', {
        method: 'POST',
        headers: {
          Authorization: getAuthHeaders()['Authorization'] || '',
        },
        body: formData,
      });

      if (!cvRes.ok) {
        const cvData = await cvRes.json();
        throw new Error(cvData.error || cvData.message || 'CV dosyası yüklenemedi.');
      }

      // 2. Submit onboarding info
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          primaryDomain,
          experienceLevel,
          knownSkills: selectedSkills,
          toolsUsed: selectedTools,
          preferredCareerPath,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onComplete(data.user);
      } else {
        alert('Onboarding kaydedilirken bir hata oluştu.');
      }
    } catch (err: unknown) {
      console.error('Onboarding submit error:', err);
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Gradient Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white">
                IK
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-white">Hoş Geldiniz, {currentUser.fullName}! </h2>
                <p className="text-xs text-slate-300">İlk Giriş Oryantasyonu & Yetenek Profillemesi</p>
              </div>
            </div>
            <div className="bg-indigo-600/80 text-white text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/50">
              Adım {currentStep} / 5
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-5 gap-2 mt-5">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all ${step <= currentStep ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {/* STEP 1: Uzmanlık & Seviye */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>Uzmanlık Alanınız ve Deneyim Seviyeniz</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Hangi ana alanda uzmanlaşmak veya projelerde görev almak istediğinizi belirleyin.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Ana Çalışma Alanı</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    'Frontend Geliştirici',
                    'Backend Geliştirici',
                    'Full-Stack Geliştirici',
                    'Mobil & UI/UX',
                    'DevOps & Cloud',
                    'Veri & Veritabanı',
                  ].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setPrimaryDomain(domain)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all ${primaryDomain === domain
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{domain}</span>
                        {primaryDomain === domain && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 block">Mevcut Deneyim Seviyeniz</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Başlangıç Seviyesi', 'Orta Seviye', 'İleri Seviye'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceLevel(level)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${experienceLevel === level
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Bildiği Teknolojiler */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Code2 className="w-5 h-5 text-indigo-600" />
                  <span>Bildiğiniz Teknolojiler & Diller</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daha önce çalıştığınız veya hakim olduğunuz teknolojileri seçin.
                </p>
              </div>

              {/* Custom Skill Input Form */}
              <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Listede olmayan farklı bir teknoloji/dil ekleyin..."
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!customSkillInput.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </form>

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1">
                {Array.from(new Set([...AVAILABLE_SKILLS, ...selectedSkills])).map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${isSelected
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
          )}

          {/* STEP 3: Kullandığı Araçlar */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Wrench className="w-5 h-5 text-indigo-600" />
                  <span>Kullandığınız Araçlar & Yazılımlar (Tools)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Günlük geliştirme sürecinizde aşina olduğunuz araçları işaretleyin.
                </p>
              </div>

              {/* Custom Tool Input Form */}
              <form onSubmit={handleAddCustomTool} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Listede olmayan farklı bir araç/yazılım ekleyin..."
                  value={customToolInput}
                  onChange={(e) => setCustomToolInput(e.target.value)}
                  className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
                />
                <button
                  type="submit"
                  disabled={!customToolInput.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ekle</span>
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from(new Set([...AVAILABLE_TOOLS, ...selectedTools])).map((tool) => {
                  const isSelected = selectedTools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
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
          )}

          {/* STEP 4: CV Yükleme (PDF, Max 1MB) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Özgeçmiş (CV) Dosyanızı Yükleyin *</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Yöneticiniz ve ekibinizin inceleyebilmesi için güncel CV'nizi ekleyin.
                </p>
              </div>

              {cvError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{cvError}</span>
                </div>
              )}

              {cvFile ? (
                <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl p-5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{cvFile.name}</h4>
                      <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                        {(cvFile.size / 1024).toFixed(1)} KB • PDF Formatı Uygun ✓
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCvFile(null);
                      setCvError('');
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 bg-white"
                    title="Dosyayı Değiştir / Kaldır"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/60 transition-all rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer space-y-3 group">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleCvFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">
                      CV Dosyanızı Buraya Sürükleyin veya Dosya Seçin
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kabul Edilen Format: <strong className="text-indigo-600">PDF</strong> • Maksimum Boyut: <strong className="text-indigo-600">1 MB (1024 KB)</strong>
                    </p>
                  </div>
                </label>
              )}
            </div>
          )}

          {/* STEP 5: Kariyer Hedefleri */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  <span>Kariyer Hedefleri & Beklentileriniz</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Proje sürecinde kendinizi hangi yönlerde geliştirmek ve ne tür işler üstlenmek istiyorsunuz?
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block text-xs mb-1.5">
                  Gelecek Hedefiniz & Notlarınız (Opsiyonel)
                </label>
                <textarea
                  rows={4}
                  placeholder="Örn: React mimarisi ve mikro ön yüz tasarımları konusunda derinleşmek istiyorum. Gerçek zamanlı projelerde aktif görev almak en büyük hedefim..."
                  value={preferredCareerPath}
                  onChange={(e) => setPreferredCareerPath(e.target.value)}
                  className="w-full py-3 px-4 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-indigo-600 leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => {
                setCvError('');
                setCurrentStep((prev) => prev - 1);
              }}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <span>Devam Et</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-xs disabled:opacity-50"
            >
              <span>{loading ? 'Kaydediliyor...' : 'Profilimi Tamamla & Başla'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
