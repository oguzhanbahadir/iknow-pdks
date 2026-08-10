import React, { useState, useEffect } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Bot,
  Settings,
  MessageSquare,
  Users,
  Terminal,
  ExternalLink,
  Search,
  Globe,
  FileText,
  FolderCheck,
  UserPlus,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../types';
import { getAuthHeaders } from '../utils/api';

interface SettingsPageProps {
  currentUser: User;
}

interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  botName?: string;
  botUsername?: string;
  maskedToken?: string;
  defaultChatId?: string;
  webhookUrl?: string;
  webhookPendingCount?: number;
  webhookLastError?: string;
  message?: string;
}

export default function SettingsPage({ currentUser }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'telegram' | 'admins' | 'storage'>('telegram');

  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  // Test Message State
  const [testChatId, setTestChatId] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Send Message State
  const [targetType, setTargetType] = useState<'DEFAULT' | 'USER' | 'CHAT_ID'>('DEFAULT');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [customChatId, setCustomChatId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Copy helper
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Poll Updates State
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Set Webhook State
  const [webhookSettingUp, setWebhookSettingUp] = useState(false);
  const [webhookResult, setWebhookResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Storage Link State
  const [linkingStorage, setLinkingStorage] = useState(false);
  const [storageResult, setStorageResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Create Admin Form State
  const [adminFormData, setAdminFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    department: 'Yönetim / IK',
    phone: '',
  });
  const [adminCreating, setAdminCreating] = useState(false);
  const [adminResult, setAdminResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Admin Chat ID Update State
  const [editingAdminChatIdUserId, setEditingAdminChatIdUserId] = useState<string | null>(null);
  const [adminChatIdInput, setAdminChatIdInput] = useState('');
  const [adminChatIdSaving, setAdminChatIdSaving] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram/status', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status || null);
        if (data.status?.defaultChatId) {
          setTestChatId(data.status.defaultChatId);
        }
      }
    } catch (err) {
      console.error('Fetch telegram status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => {
    async function init() {
      await Promise.all([fetchStatus(), fetchUsers()]);
    }
    init();
  }, []);

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testChatId.trim()) return;

    setTestSending(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ chatId: testChatId }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setTestResult({ success: true, msg: data.message });
      } else {
        setTestResult({ success: false, msg: data.error || 'Test mesajı iletilemedi.' });
      }
    } catch (err) {
      setTestResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setTestSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    setSendLoading(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          targetType,
          userId: selectedUserId,
          customChatId,
          message: messageContent,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSendResult({ success: true, msg: data.message });
        setMessageContent('');
      } else {
        setSendResult({ success: false, msg: data.error || 'Mesaj iletilemedi.' });
      }
    } catch (err) {
      setSendResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setSendLoading(false);
    }
  };

  const handlePollUpdates = async () => {
    setPolling(true);
    setPollResult(null);
    try {
      const res = await fetch('/api/telegram/poll-updates', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPollResult({ success: true, msg: data.message });
      } else {
        setPollResult({ success: false, msg: data.error || 'Güncellemeler işlenemedi.' });
      }
    } catch (err) {
      setPollResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setPolling(false);
    }
  };

  const handleSetWebhook = async () => {
    setWebhookSettingUp(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWebhookResult({ success: true, msg: data.message });
        await fetchStatus();
      } else {
        setWebhookResult({ success: false, msg: data.error || 'Webhook tanımlanamadı.' });
      }
    } catch (err) {
      setWebhookResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setWebhookSettingUp(false);
    }
  };

  const handleStorageLink = async () => {
    setLinkingStorage(true);
    setStorageResult(null);
    try {
      const res = await fetch('/api/system/storage-link', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStorageResult({ success: true, msg: data.message });
      } else {
        setStorageResult({ success: false, msg: data.error || 'Storage bağlantısı oluşturulamadı.' });
      }
    } catch (err) {
      setStorageResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setLinkingStorage(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.fullName || !adminFormData.email || !adminFormData.password) return;

    setAdminCreating(true);
    setAdminResult(null);

    try {
      const res = await fetch('/api/users/create-admin', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(adminFormData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminResult({ success: true, msg: data.message });
        setAdminFormData({
          fullName: '',
          email: '',
          password: '',
          department: 'Yönetim / IK',
          phone: '',
        });
        await fetchUsers();
      } else {
        setAdminResult({ success: false, msg: data.error || 'Admin kullanıcısı eklenemedi.' });
      }
    } catch (err) {
      setAdminResult({ success: false, msg: 'Sunucu hatası oluştu.' });
    } finally {
      setAdminCreating(false);
    }
  };

  const handleSaveAdminChatId = async (userId: string) => {
    setAdminChatIdSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/telegram-chat-id`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ telegramChatId: adminChatIdInput }),
      });
      if (res.ok) {
        await fetchUsers();
        setEditingAdminChatIdUserId(null);
        setAdminChatIdInput('');
      }
    } catch (err) {
      console.error('Update admin chat id error:', err);
    } finally {
      setAdminChatIdSaving(false);
    }
  };

  const envTemplateText = `TELEGRAM_BOT_TOKEN=BOT_FATHER_TOKENINIZ
TELEGRAM_CHAT_ID=-100XXXXXXXXXX`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplateText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const adminUsers = users.filter((u) => u.role === 'ADMIN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Settings className="w-7 h-7 text-indigo-600" />
            <span>Sistem Ayarları & Yönetim Paneli</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Telegram botunu yapılandırın, yeni admin yöneticiler ekleyin ve dosya storage bağlantılarını yönetin.
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'telegram'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Telegram Entegrasyonu</span>
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'admins'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Yönetici (Admin) Yönetimi ({adminUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all ${
            activeTab === 'storage'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Dosya & Storage Bağlantısı</span>
        </button>
      </div>

      {/* TAB 1: TELEGRAM ENTEGRASYONU */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              <span>Telegram Bot Yapılandırma & Bildirim Merkezi</span>
            </h2>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePollUpdates}
                disabled={polling || !status?.connected}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-50"
                title="Local ortamda webhook olmadan gelen mesajları işler"
              >
                <RefreshCw className={`w-4 h-4 ${polling ? 'animate-spin' : ''}`} />
                <span>Gelen Mesajları İşle (Poll)</span>
              </button>

              <button
                onClick={fetchStatus}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Durumu Yenile</span>
              </button>
            </div>
          </div>

          {pollResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
                pollResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {pollResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{pollResult.msg}</span>
              </div>
            </div>
          )}

          {/* Top Status Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Telegram Bot Bağlantı Durumu</h3>
                    <p className="text-xs text-slate-500">API Entegrasyon Servis Kontrolü</p>
                  </div>
                </div>

                {status?.connected ? (
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Aktif & Bağlandı</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-pulse">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>.env Yapılandırması Bekleniyor</span>
                  </span>
                )}
              </div>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="font-bold text-slate-600">Bot Adı / Kullanıcı Adı:</span>
                  <span className="font-extrabold text-slate-900">
                    {status?.botName ? `${status.botName} (@${status.botUsername})` : 'Tanımlanmadı'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="font-bold text-slate-600">Bot Token (Maskeli):</span>
                  <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                    {status?.maskedToken || 'Yok'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="font-bold text-slate-600">Varsayılan Chat ID:</span>
                  <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                    {status?.defaultChatId || 'Belirtilmedi'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <span className="font-bold text-slate-600">Aktif Webhook URL:</span>
                  <span className="font-mono text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] truncate max-w-[200px]" title={status?.webhookUrl || 'Tanımlanmadı'}>
                    {status?.webhookUrl || 'Tanımlanmadı'}
                  </span>
                </div>
              </div>

              {webhookResult && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                    webhookResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {webhookResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{webhookResult.msg}</span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSetWebhook}
                  disabled={webhookSettingUp || !status?.connected}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>{webhookSettingUp ? 'Tanımlanıyor...' : 'Sunucu Webhook Adresini Telegram\'a Tanımla (setWebhook)'}</span>
                </button>
              </div>

              {status?.message && !status.connected && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl flex items-center space-x-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}
            </div>

            {/* Env Configuration Guide Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xs space-y-4 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>.env Yapılandırma Rehberi</span>
                  </h3>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800">
                    backend/.env
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  API Anahtarlarını güvenle saklamak için aşağıdaki satırları projenizin{' '}
                  <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">backend/.env</code>{' '}
                  dosyasına ekleyin:
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl font-mono text-xs text-indigo-300 relative group space-y-1">
                <button
                  onClick={copyToClipboard}
                  className="absolute top-2.5 right-2.5 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 text-[11px] flex items-center space-x-1"
                  title="Kopyala"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
                <pre className="text-xs">{envTemplateText}</pre>
              </div>

              <p className="text-[11px] text-slate-400 italic flex items-center space-x-1 pt-1">
                <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Bot Tokeniniz sunucunuzda saklanır ve gizliliği korunur.</span>
              </p>
            </div>
          </div>

          {/* BOT COMMANDS & INTERACTIVE LOGIN GUIDE CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <span>Telegram Botu Etkileşimli Giriş & Komut Kılavuzu</span>
              </h3>
              <p className="text-xs text-slate-500">
                Personelleriniz Telegram botunuzla konuşarak hesaplarını PDKS profili ile doğrulayabilir ve kişisel görevlerini listeleyebilir.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Giriş & Eşleştirme (/start)</span>
                </h4>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Personel bota <code className="bg-white border px-1 rounded text-indigo-600 font-bold">/start</code> yazar. Bot sırasıyla <strong>E-posta</strong> ve <strong>PDKS Giriş Şifresi</strong> ister. Şifre doğruysa <code>telegram_chat_id</code> otomatik eşleştirilir.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Kendi Görevlerini Listeleme (/tasks)</span>
                </h4>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Hesabını bağlayan personel bota <code className="bg-white border px-1 rounded text-indigo-600 font-bold">/tasks</code> veya <em>"görevlerim"</em> yazdığında, sistem sadece kendisine atanan aktif görevleri detaylarıyla listeler.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Çıkış Yapma & Eşleşmeyi Kaldırma</span>
                </h4>
                <p className="text-[11.5px] text-slate-600 leading-relaxed">
                  Personel dilediği zaman bota <code className="bg-white border px-1 rounded text-slate-700 font-bold">/logout</code> yazarak Telegram hesabının PDKS eşleştirmesini kaldırabilir.
                </p>
              </div>
            </div>
          </div>

          {/* Main Interactive Action Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Notification Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                  <Send className="w-5 h-5 text-indigo-600" />
                  <span>Hızlı Test Mesajı Gönder</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Bot bağlantısını ve Chat ID erişimini doğrulamak için gruba veya hesabınıza test bildirimi tetikleyin.
                </p>
              </div>

              <form onSubmit={handleTestSend} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">
                    Hedef Chat ID (Grup veya Kullanıcı ID)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: -100123456789 veya 98765432"
                    value={testChatId}
                    onChange={(e) => setTestChatId(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{testResult.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={testSending || !testChatId.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{testSending ? 'Gönderiliyor...' : 'Test Mesajını Tetikle'}</span>
                </button>
              </form>
            </div>

            {/* Custom Broadcast / Personnel Message Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <span>Özel Telegram Bildirimi Yayınla</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Personellere özel görev duyurusu veya gruba anlık mesaj gönderin.
                </p>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block text-xs mb-1">Hedef Kitle</label>
                    <select
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as 'DEFAULT' | 'USER' | 'CHAT_ID')}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                    >
                      <option value="DEFAULT">Varsayılan Grup / Kanal (.env)</option>
                      <option value="USER">Özel Personel</option>
                      <option value="CHAT_ID">Özel Chat ID Gir</option>
                    </select>
                  </div>

                  {targetType === 'USER' && (
                    <div>
                      <label className="font-bold text-slate-700 block text-xs mb-1">Personel Seç</label>
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                      >
                        <option value="">Seçiniz...</option>
                        {users
                          .filter((u) => u.role === 'USER')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} {u.telegram_chat_id ? '✓' : '(Chat ID Yok)'}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {targetType === 'CHAT_ID' && (
                    <div>
                      <label className="font-bold text-slate-700 block text-xs mb-1">Chat ID</label>
                      <input
                        type="text"
                        required
                        placeholder="-100..."
                        value={customChatId}
                        onChange={(e) => setCustomChatId(e.target.value)}
                        className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold text-slate-900"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">Mesaj İçeriği *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Örn: Değerli ekibimiz, yeni oryantasyon dokümanı ve görev güncellemeleri sisteme yüklenmiştir. Lütfen inceleyiniz..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 leading-relaxed text-slate-900"
                  />
                </div>

                {sendResult && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                      sendResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {sendResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{sendResult.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sendLoading || !messageContent.trim()}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendLoading ? 'Mesaj İletiliyor...' : 'Telegram Mesajını İlet'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: YÖNETİCİ (ADMIN) YÖNETİMİ */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Admin Form */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Yeni Admin Hesabı Oluştur</h3>
                  <p className="text-xs text-slate-500">Tam Yetkili Yönetici Ekleme Formu</p>
                </div>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-3.5 pt-1">
                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">Ad Soyad *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Yılmaz"
                      value={adminFormData.fullName}
                      onChange={(e) => setAdminFormData({ ...adminFormData, fullName: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">E-Posta Adresi *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="admin@iknow.com"
                      value={adminFormData.email}
                      onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block text-xs mb-1">Giriş Şifresi * (Min 6 Krktr)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={adminFormData.password}
                      onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block text-xs mb-1">Departman</label>
                    <input
                      type="text"
                      placeholder="Yönetim / IK"
                      value={adminFormData.department}
                      onChange={(e) => setAdminFormData({ ...adminFormData, department: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block text-xs mb-1">Telefon</label>
                    <input
                      type="text"
                      placeholder="+90 532..."
                      value={adminFormData.phone}
                      onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium text-slate-900"
                    />
                  </div>
                </div>

                {adminResult && (
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                      adminResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {adminResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{adminResult.msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={adminCreating || !adminFormData.fullName || !adminFormData.email || !adminFormData.password}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{adminCreating ? 'Oluşturuluyor...' : 'Admin Hesabını Oluştur ve Onayla'}</span>
                </button>
              </form>
            </div>

            {/* Admin Users List */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <span>Mevcut Yönetici (Admin) Listesi</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sistemde tam yetkiye sahip yöneticilerin listesi.</p>
                </div>

                <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-full">
                  Toplam {adminUsers.length} Admin
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {adminUsers.map((adm) => (
                  <div key={adm.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {adm.fullName ? adm.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{adm.fullName}</span>
                          {adm.id === currentUser.id && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">Siz</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500">{adm.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      {editingAdminChatIdUserId === adm.id ? (
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            placeholder="Chat ID örn: 12345678"
                            value={adminChatIdInput}
                            onChange={(e) => setAdminChatIdInput(e.target.value)}
                            className="w-36 py-1 px-2 text-xs bg-white border border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-600 font-mono text-slate-900"
                          />
                          <button
                            onClick={() => handleSaveAdminChatId(adm.id)}
                            disabled={adminChatIdSaving}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors"
                          >
                            {adminChatIdSaving ? '...' : 'Kaydet'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingAdminChatIdUserId(null);
                              setAdminChatIdInput('');
                            }}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] rounded-lg"
                          >
                            İptal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          {adm.telegram_chat_id ? (
                            <div className="flex items-center space-x-1.5">
                              <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span className="font-mono">{adm.telegram_chat_id}</span>
                              </span>
                              <button
                                onClick={() => {
                                  setTestChatId(adm.telegram_chat_id!);
                                  setActiveTab('telegram');
                                }}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-lg text-[10px] flex items-center space-x-1"
                                title="Bu yöneticinin Telegram Chat ID'sine özel test bildirimi at"
                              >
                                <Send className="w-3 h-3" />
                                <span>Test Et</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              Telegram Bağlı Değil
                            </span>
                          )}

                          <button
                            onClick={() => {
                              setEditingAdminChatIdUserId(adm.id);
                              setAdminChatIdInput(adm.telegram_chat_id || '');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 border border-slate-200 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            {adm.telegram_chat_id ? 'Değiştir' : '+ Chat ID Bağla'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOSYA & STORAGE BAĞLANTISI */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shadow-xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <span>Dosya & CV Depolama Sembolik Bağlantısı (storage:link)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Yüklenen PDF CV dosyalarının canlı sunucuda (veya yerelde) erişilebilir olması için Laravel storage sembolik köprüsünü oluşturur.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStorageLink}
                disabled={linkingStorage}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition-colors shadow-xs shrink-0 disabled:opacity-50"
              >
                <FolderCheck className={`w-4 h-4 ${linkingStorage ? 'animate-spin' : ''}`} />
                <span>{linkingStorage ? 'Oluşturuluyor...' : 'Storage Bağlantısını Oluştur (storage:link)'}</span>
              </button>
            </div>

            {storageResult && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 border ${
                  storageResult.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {storageResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{storageResult.msg}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>Storage Sembolik Köprü Rehberi</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Laravel projelerinde yüklenen tüm dosyalar varsayılan olarak <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700">storage/app/public</code> dizinine kaydedilir. Web tarayıcılarının bu dosyalara (PDF CV, Avatarlar vb.) erişebilmesi için public klasörüne <code className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700">public/storage</code> sembolik bağlantısı çekilmelidir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
