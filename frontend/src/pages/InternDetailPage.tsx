import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  CheckSquare,
  Building2,
  FileText,
  Clock,
  Sparkles,
  Code2,
  Wrench,
  Compass,
  AlertCircle,
  Trash2,
  X,
  ExternalLink,
  Download,
} from 'lucide-react';
import { PersonelDetail } from '../types';
import { getAuthHeaders } from '../utils/api';

export default function InternDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [intern, setIntern] = useState<PersonelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');
  const [selectedCvIndex, setSelectedCvIndex] = useState(0);

  useEffect(() => {
    async function loadDetail() {
      if (!id) return;
      setLoading(true);
      setErrorMsg('');

      try {
        const res = await fetch(`/api/interns/${id}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setIntern(data.intern);
        } else {
          setErrorMsg('Personel detay bilgileri yüklenemedi.');
        }
      } catch (err) {
        console.error('Load intern detail error:', err);
        setErrorMsg('Sunucu ile bağlantı kurulamadı.');
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 font-semibold text-xs">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2" />
        Personel detay verileri yükleniyor...
      </div>
    );
  }

  if (errorMsg || !intern) {
    return (
      <div className="space-y-6">
        <Link
          to="/team"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Personel Listesine Dön</span>
        </Link>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">{errorMsg || 'Personel bulunamadı'}</h3>
          <p className="text-xs text-slate-500">Aradığınız personel kaydı mevcut olmayabilir veya yetkiniz kısıtlanmış olabilir.</p>
        </div>
      </div>
    );
  }

  const score = intern.scores && intern.scores.length > 0 ? intern.scores[0] : null;
  const cv = intern.cvFiles && intern.cvFiles.length > 0 ? intern.cvFiles[0] : null;
  const tasks = intern.tasksAssigned || [];
  const totalTasks = tasks.length;
  const totalActualHours = tasks.reduce((acc, t) => acc + (Number(t.actualHours) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Back & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/team"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Personel Listesine Dön</span>
        </Link>

        <button
          onClick={() => {
            setIsDeleteModalOpen(true);
            setDeleteErrorMsg('');
          }}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 bg-white px-3 py-2 rounded-xl border border-red-200 shadow-xs transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Personeli Sil</span>
        </button>
      </div>

      {/* Profile Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs border border-slate-700">
            {intern.fullName ? intern.fullName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{intern.fullName}</h1>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-md">
                Personel
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">{intern.department || 'Yazılım'} • {intern.phone || '-'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{intern.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-end">
          <div className="text-center px-4 border-r border-slate-100">
            <span className="text-2xl font-extrabold text-slate-900 block">{totalTasks}</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Atanan Görev</span>
          </div>
          <div className="text-center px-4 border-r border-slate-100">
            <span className="text-2xl font-extrabold text-emerald-600 block">{totalActualHours}h</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Harcanan Efor</span>
          </div>
          <div className="text-center px-4">
            <span className="text-2xl font-extrabold text-indigo-600 block">
              {score ? `${score.overallScore}` : '-'}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Puan Ortalaması</span>
          </div>
        </div>
      </div>

      {/* Onboarding Profile Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>İlk Giriş Oryantasyon & Becerileri Profil Bilgisi</span>
          </h3>
          {intern.isOnboarded ? (
            <span className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              Oryantasyon Tamamlandı
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-0.5 rounded-full">
              Tamamlanması Bekleniyor
            </span>
          )}
        </div>

        {intern.isOnboarded ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5 text-xs">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <span>Ana Alan & Deneyim</span>
              </span>
              <div>
                <p className="font-extrabold text-indigo-900 text-sm">{intern.primaryDomain || 'Belirtilmedi'}</p>
                <p className="text-slate-500 text-[11px] font-medium">{intern.experienceLevel || 'Orta Seviye'}</p>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5 text-xs">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>Bildiği Teknolojiler</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {intern.knownSkills && intern.knownSkills.length > 0 ? (
                  intern.knownSkills.map((sk) => (
                    <span key={sk} className="bg-white border border-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Teknoloji belirtilmedi</span>
                )}
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5 text-xs">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Kullandığı Araçlar (Tools)</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {intern.toolsUsed && intern.toolsUsed.length > 0 ? (
                  intern.toolsUsed.map((tool) => (
                    <span key={tool} className="bg-white border border-slate-200 text-slate-800 font-semibold px-2 py-0.5 rounded-md text-[11px]">
                      {tool}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 italic">Araç belirtilmedi</span>
                )}
              </div>
            </div>

            {intern.preferredCareerPath && (
              <div className="col-span-full bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl space-y-1">
                <span className="font-bold text-indigo-900 flex items-center space-x-1.5 text-xs">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Kariyer Hedefleri & Beklentiler</span>
                </span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {intern.preferredCareerPath}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Bu personel henüz sistem ilk giriş oryantasyon formunu doldurmamış.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Değerlendirme Notları</span>
            </h3>
          </div>

          {score ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Teknik Yetenek</span>
                    <span>{score.techScore}/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${(score.techScore / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Soft Skills & İletişim</span>
                    <span>{score.softSkillScore}/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${(score.softSkillScore / 10) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Disiplin & Sorumluluk</span>
                    <span>{score.punctualityScore}/10</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full"
                      style={{ width: `${(score.punctualityScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {score.feedbackNote && (
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Yönetici Notu</span>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{score.feedbackNote}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs italic">
              Bu personele henüz puan verilmemiş.
            </div>
          )}
        </div>

        {/* Target Company Integration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Hedef Şirket Planlaması</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[11px]">Hedef Şirket / Ekip</span>
              <span className="text-sm font-extrabold text-indigo-950 block mt-0.5">
                {intern.targetCompany || 'Henüz Şirket Atanmadı'}
              </span>
            </div>

            {intern.companyIntegrationNote ? (
              <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-indigo-900 uppercase">Entegrasyon Notları</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {intern.companyIntegrationNote}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 italic">Entegrasyon notu girilmemiş.</p>
            )}

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 font-semibold block text-[11px] mb-1">CV Belgesi</span>
              {cv ? (
                <a
                  href={cv.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
                >
                  <FileText className="w-4 h-4" />
                  <span>{cv.fileName}</span>
                </a>
              ) : (
                <span className="text-slate-400 italic">CV Dosyası Yüklenmemiş</span>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Tasks History */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <span>Görev Geçmişi</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">{tasks.length} adet</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {tasks.map((t) => (
              <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{t.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      t.status === 'DONE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{t.category || 'Genel'}</span>
                  <span className="font-semibold">{t.actualHours}h harcandı</span>
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* EMBEDDED PDF CV VIEWER SECTION */}
      {(() => {
        const cvFiles = intern.cvFiles || [];
        const activeCv = cvFiles[selectedCvIndex] || cvFiles[0];

        return (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Personel Özgeçmiş (CV) Gömülü Belge Görüntüleyici</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personelin sisteme yüklediği orijinal PDF özgeçmiş dosyasını aşağıda canlı inceleyebilirsiniz.
                </p>
              </div>

              {cvFiles.length > 0 && activeCv && (
                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={activeCv.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Yeni Sekmede Aç</span>
                  </a>
                  <a
                    href={activeCv.fileUrl}
                    download
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>İndir ({activeCv.fileName})</span>
                  </a>
                </div>
              )}
            </div>

            {cvFiles.length > 0 && activeCv ? (
              <div className="space-y-3">
                {cvFiles.length > 1 && (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Diğer CV'ler:</span>
                    {cvFiles.map((c, idx) => (
                      <button
                        key={c.id || idx}
                        onClick={() => setSelectedCvIndex(idx)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          selectedCvIndex === idx
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        📄 {c.fileName}
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-full h-[750px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                  <iframe
                    src={activeCv.fileUrl}
                    title={`CV - ${intern.fullName} - ${activeCv.fileName}`}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="font-semibold text-slate-600 text-xs">Yüklenmiş CV Belgesi Bulunamadı</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Bu personele ait sisteme aktarılmış herhangi bir özgeçmiş (PDF) belgesi bulunmamaktadır.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && intern && (
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
                onClick={() => setIsDeleteModalOpen(false)}
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
                <strong className="text-slate-900 font-bold">{intern.fullName}</strong> ({intern.email}) isimli personeli silmek istediğinize emin misiniz?
              </p>
              <p className="text-slate-500 text-[11px]">
                Bu personele ait tüm görevler, performans skorları ve CV dosyaları kalıcı olarak silinecektir.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors text-xs"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!intern) return;
                  setDeleteLoading(true);
                  setDeleteErrorMsg('');
                  try {
                    const res = await fetch(`/api/interns/${intern.id}`, {
                      method: 'DELETE',
                      headers: getAuthHeaders(),
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || 'Personel silinemedi.');
                    }
                    navigate('/team');
                  } catch (err: unknown) {
                    if (err instanceof Error) {
                      setDeleteErrorMsg(err.message);
                    } else {
                      setDeleteErrorMsg('Bir hata oluştu.');
                    }
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
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
    </div>
  );
}
