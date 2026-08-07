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
  const [primaryDomain, setPrimaryDomain] = useState(currentUser.department || 'Frontend Yazılım');
  const [experienceLevel, setExperienceLevel] = useState('Orta Seviye');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript', 'Tailwind CSS']);
  const [selectedTools, setSelectedTools] = useState<string[]>(['VS Code', 'Git / GitHub', 'Postman']);
  const [preferredCareerPath, setPreferredCareerPath] = useState('');

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
    setLoading(true);
    try {
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
    } catch (err) {
      console.error('Onboarding submit error:', err);
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
                <h2 className="font-extrabold text-lg text-white">Hoş Geldiniz, {currentUser.fullName}! 🎉</h2>
                <p className="text-xs text-slate-300">İlk Giriş Oryantasyonu & Yetenek Profillemesi</p>
              </div>
            </div>
            <div className="bg-indigo-600/80 text-white text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/50">
              Adım {currentStep} / 4
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all ${
                  step <= currentStep ? 'bg-indigo-500' : 'bg-slate-700'
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
                    'Frontend Yazılım',
                    'Backend Yazılım',
                    'Full-Stack Yazılım',
                    'Mobil & UI/UX',
                    'DevOps & Cloud',
                    'Veri & Veritabanı',
                  ].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setPrimaryDomain(domain)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all ${
                        primaryDomain === domain
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
                      className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                        experienceLevel === level
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

              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto p-1">
                {AVAILABLE_SKILLS.map((skill) => {
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

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_TOOLS.map((tool) => {
                  const isSelected = selectedTools.includes(tool);
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                        isSelected
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

          {/* STEP 4: Kariyer Hedefleri */}
          {currentStep === 4 && (
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
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
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
