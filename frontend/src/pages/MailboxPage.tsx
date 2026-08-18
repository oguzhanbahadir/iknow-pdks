import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  Inbox,
  RefreshCw,
  Trash2,
  Reply,
  CheckCircle2,
  AlertCircle,
  Settings,
  Sparkles,
  Search,
  Paperclip,
  Calendar,
  Clock,
  User as UserIcon,
  ShieldCheck,
  FolderKanban,
  X,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { User, UserEmailAccount, EmailMessageHeader, EmailMessageDetail, Project } from '../types';
import { getAuthHeaders } from '../utils/api';

interface MailboxPageProps {
  currentUser: User;
}

export default function MailboxPage({ currentUser }: MailboxPageProps) {
  // State
  const [account, setAccount] = useState<UserEmailAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [messages, setMessages] = useState<EmailMessageHeader[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessageDetail | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<'INBOX' | 'UNREAD'>('INBOX');

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Settings Form State
  const [formData, setFormData] = useState({
    emailAddress: '',
    displayName: '',
    imapHost: '',
    imapPort: 993,
    imapEncryption: 'ssl',
    smtpHost: '',
    smtpPort: 587,
    smtpEncryption: 'tls',
    username: '',
    password: '',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Compose Form State
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    subject: '',
    body: '',
  });
  const [sendingMail, setSendingMail] = useState(false);

  // Convert to Task Form State
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    projectId: '',
    category: 'Yazışma / Mail',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    dueDate: '',
    estimatedHours: 4,
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskSuccessBanner, setTaskSuccessBanner] = useState<string | null>(null);

  // Floating Selection Action State
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ top: number; left: number } | null>(null);
  const emailContentRef = useRef<HTMLDivElement>(null);

  // Fetch Account & Projects on Load
  useEffect(() => {
    fetchAccount();
    fetchProjects();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoadingAccount(true);
      const res = await fetch('/api/mail/account', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.account) {
        setAccount(data.account);
        setFormData({
          emailAddress: data.account.emailAddress || '',
          displayName: data.account.displayName || '',
          imapHost: data.account.imapHost || '',
          imapPort: data.account.imapPort || 993,
          imapEncryption: data.account.imapEncryption || 'ssl',
          smtpHost: data.account.smtpHost || '',
          smtpPort: data.account.smtpPort || 587,
          smtpEncryption: data.account.smtpEncryption || 'tls',
          username: data.account.username || '',
          password: '',
        });
        fetchInbox();
      } else {
        setShowSettingsModal(true);
      }
    } catch (err) {
      console.error('Mail account fetch error:', err);
    } finally {
      setLoadingAccount(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Projects fetch error:', err);
    }
  };

  const fetchInbox = async (searchOverride?: string) => {
    try {
      setLoadingInbox(true);
      const query = searchOverride !== undefined ? searchOverride : searchQuery;
      const url = query ? `/api/mail/inbox?search=${encodeURIComponent(query)}` : '/api/mail/inbox';
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Inbox fetch error:', err);
    } finally {
      setLoadingInbox(false);
    }
  };

  const handleSelectMessage = async (uid: string) => {
    setSelectedUid(uid);
    setSelectedMessage(null);
    setSelectedText('');
    setSelectionPosition(null);

    // Mark as read locally
    setMessages((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, isUnread: false } : m))
    );

    try {
      setLoadingMessage(true);
      const res = await fetch(`/api/mail/messages/${uid}`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.message) {
        setSelectedMessage(data.message);
      }
    } catch (err) {
      console.error('Message fetch error:', err);
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleDeleteMessage = async (uid: string) => {
    if (!confirm('Bu e-postayı silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/mail/messages/${uid}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => prev.filter((m) => m.uid !== uid));
        if (selectedUid === uid) {
          setSelectedUid(null);
          setSelectedMessage(null);
        }
      } else {
        alert(data.error || 'E-posta silinemedi.');
      }
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  // Provider Presets
  const applyPreset = (type: 'gmail' | 'outlook' | 'yandex' | 'cpanel') => {
    if (type === 'gmail') {
      setFormData((prev) => ({
        ...prev,
        imapHost: 'imap.gmail.com',
        imapPort: 993,
        imapEncryption: 'ssl',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpEncryption: 'tls',
      }));
    } else if (type === 'outlook') {
      setFormData((prev) => ({
        ...prev,
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        imapEncryption: 'ssl',
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpEncryption: 'tls',
      }));
    } else if (type === 'yandex') {
      setFormData((prev) => ({
        ...prev,
        imapHost: 'imap.yandex.com',
        imapPort: 993,
        imapEncryption: 'ssl',
        smtpHost: 'smtp.yandex.com',
        smtpPort: 465,
        smtpEncryption: 'ssl',
      }));
    } else if (type === 'cpanel') {
      const domain = formData.emailAddress.split('@')[1] || 'siteniz.com';
      setFormData((prev) => ({
        ...prev,
        imapHost: `mail.${domain}`,
        imapPort: 993,
        imapEncryption: 'ssl',
        smtpHost: `mail.${domain}`,
        smtpPort: 465,
        smtpEncryption: 'ssl',
      }));
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/mail/test', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || 'Bağlantı kurulamadı.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Bağlantı hatası oluştu.' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/mail/account', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setAccount(data.account);
        setShowSettingsModal(false);
        fetchInbox();
      } else {
        alert(data.error || 'Ayarlar kaydedilemedi.');
      }
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMail(true);
    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(composeData),
      });
      const data = await res.json();
      if (data.success) {
        alert('E-posta başarıyla gönderildi!');
        setShowComposeModal(false);
        setComposeData({ to: '', cc: '', subject: '', body: '' });
      } else {
        alert(data.error || 'E-posta gönderilemedi.');
      }
    } catch (err) {
      console.error('Send mail error:', err);
    } finally {
      setSendingMail(false);
    }
  };

  // Open "Convert to Task" Modal
  const handleOpenTaskModal = (initialQuote?: string) => {
    if (!selectedMessage) return;

    const quote = initialQuote || selectedText;
    let descriptionText = '';

    if (quote) {
      descriptionText = `📌 E-Postadan Alıntı:\n"${quote}"\n\n✉️ Gönderen: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>\n📅 Tarih: ${new Date(selectedMessage.date).toLocaleString('tr-TR')}`;
    } else {
      descriptionText = `✉️ Gönderen: ${selectedMessage.fromName} <${selectedMessage.fromEmail}>\n📅 Tarih: ${new Date(selectedMessage.date).toLocaleString('tr-TR')}\n\n📄 E-Posta İçeriği:\n${selectedMessage.plainBody ? selectedMessage.plainBody.slice(0, 500) + '...' : ''}`;
    }

    setTaskData({
      title: quote ? quote.slice(0, 80) : selectedMessage.subject,
      description: descriptionText,
      projectId: '',
      category: 'Yazışma / Mail',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      estimatedHours: 4,
    });

    setShowTaskModal(true);
    setSelectedText('');
    setSelectionPosition(null);
  };

  // Submit New Task from Email
  const handleCreateTaskFromEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTask(true);
    try {
      const res = await fetch('/api/mail/convert-to-task', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...taskData,
          emailSubject: selectedMessage?.subject,
          emailFrom: selectedMessage?.fromEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowTaskModal(false);
        setTaskSuccessBanner(`"${taskData.title}" başlıklı görev başarıyla panonuza eklendi!`);
        setTimeout(() => setTaskSuccessBanner(null), 6000);
      } else {
        alert(data.error || 'Görev oluşturulamadı.');
      }
    } catch (err) {
      console.error('Create task error:', err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Handle Text Selection in Email Reader
  const handleMouseUpInEmail = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        top: rect.top + window.scrollY - 40,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    } else {
      setSelectedText('');
      setSelectionPosition(null);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (activeFolder === 'UNREAD') return m.isUnread;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black text-slate-900">E-Posta & Webmail</h1>
              {account && (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{account.emailAddress}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Gelen maillerinizi görüntüleyin, yeni e-posta gönderin veya tek tıkla e-postadan görev oluşturun.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => {
              setComposeData({ to: '', cc: '', subject: '', body: '' });
              setShowComposeModal(true);
            }}
            disabled={!account}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni E-Posta</span>
          </button>

          <button
            onClick={() => fetchInbox()}
            disabled={loadingInbox || !account}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1 disabled:opacity-50"
            title="Gelen Kutusunu Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingInbox ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Yenile</span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1"
            title="E-Posta Hesap Ayarları"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Ayarlar</span>
          </button>
        </div>
      </div>

      {/* Task Created Success Banner */}
      {taskSuccessBanner && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{taskSuccessBanner}</span>
          </div>
          <a
            href="/tasks"
            className="text-emerald-700 hover:underline inline-flex items-center space-x-1 font-bold"
          >
            <span>Görevlere Git</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Main Mailbox Interface Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        {/* Left Column: Folders & Filters (2 cols on lg) */}
        <div className="lg:col-span-3 border-r border-slate-200 p-3.5 bg-slate-50/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="E-postada ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchInbox(searchQuery);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
              />
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveFolder('INBOX')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFolder === 'INBOX'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Inbox className="w-4 h-4" />
                  <span>Gelen Kutusu</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeFolder === 'INBOX' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {messages.length}
                </span>
              </button>

              <button
                onClick={() => setActiveFolder('UNREAD')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeFolder === 'UNREAD'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Okunmamış</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeFolder === 'UNREAD' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {messages.filter((m) => m.isUnread).length}
                </span>
              </button>
            </nav>
          </div>

          {/* Account Card in Sidebar Footer */}
          {account && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bağlı Hesap</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Aktif Bağlantı" />
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{account.emailAddress}</p>
              <p className="text-[10px] text-slate-500 truncate">IMAP: {account.imapHost}</p>
            </div>
          )}
        </div>

        {/* Middle Column: Messages List (4 cols on lg) */}
        <div className="lg:col-span-4 border-r border-slate-200 flex flex-col h-full max-h-[700px]">
          <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Mesajlar ({filteredMessages.length})</span>
            {loadingInbox && <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingInbox && messages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Gelen kutusu yükleniyor...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                {account ? 'Bu klasörde e-posta bulunmuyor.' : 'Lütfen önce e-posta hesap ayarlarınızı yapın.'}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedUid === msg.uid;
                const initials = msg.fromName
                  ? msg.fromName.slice(0, 2).toUpperCase()
                  : msg.fromEmail.slice(0, 2).toUpperCase();

                return (
                  <button
                    key={msg.uid}
                    onClick={() => handleSelectMessage(msg.uid)}
                    className={`w-full text-left p-3.5 transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-l-4 border-indigo-600'
                        : msg.isUnread
                        ? 'bg-blue-50/30 hover:bg-slate-50 font-bold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : msg.isUnread
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs truncate ${msg.isUnread ? 'font-black text-slate-900' : 'font-semibold text-slate-800'}`}>
                          {msg.fromName || msg.fromEmail}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {msg.date ? new Date(msg.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      <h4 className={`text-xs truncate ${msg.isUnread ? 'font-black text-slate-900' : 'font-medium text-slate-700'}`}>
                        {msg.subject || '(Konusuz)'}
                      </h4>

                      <div className="flex items-center space-x-2 mt-1">
                        {msg.isUnread && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <span className="text-[10px] text-slate-400">
                          {Math.round((msg.size || 0) / 1024)} KB
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Message Content Reader (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col h-full max-h-[700px] bg-slate-50/30">
          {loadingMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2 p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>E-posta içeriği alınıyor...</span>
            </div>
          ) : selectedMessage ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Message Header & Action Toolbar */}
              <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                    {selectedMessage.subject || '(Konusuz)'}
                  </h2>
                  <div className="flex items-center space-x-1 shrink-0">
                    {/* PRIMARY CONVERT TO TASK ACTION */}
                    <button
                      onClick={() => handleOpenTaskModal()}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all transform active:scale-95"
                      title="Bu e-postayı göreve dönüştür"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Göreve Dönüştür</span>
                    </button>

                    <button
                      onClick={() => {
                        setComposeData({
                          to: selectedMessage.fromEmail,
                          cc: '',
                          subject: selectedMessage.subject.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
                          body: `<br><br><hr><blockquote><b>Kimden:</b> ${selectedMessage.fromName} &lt;${selectedMessage.fromEmail}&gt;<br><b>Tarih:</b> ${new Date(selectedMessage.date).toLocaleString('tr-TR')}<br><b>Konu:</b> ${selectedMessage.subject}<br><br>${selectedMessage.htmlBody || selectedMessage.plainBody}</blockquote>`,
                        });
                        setShowComposeModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Yanıtla"
                    >
                      <Reply className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteMessage(selectedMessage.uid)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                      {selectedMessage.fromName ? selectedMessage.fromName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{selectedMessage.fromName || selectedMessage.fromEmail}</div>
                      <div className="text-[10px] text-slate-400">&lt;{selectedMessage.fromEmail}&gt;</div>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium">
                    {selectedMessage.date ? new Date(selectedMessage.date).toLocaleString('tr-TR') : ''}
                  </div>
                </div>

                {/* Tip for Highlight Selection */}
                <div className="p-2 bg-indigo-50/60 border border-indigo-100 rounded-xl text-[10.5px] text-indigo-800 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>İpucu: E-posta metninden herhangi bir cümleyi fareyle seçerek anında seçili metinden görev üretebilirsiniz!</span>
                </div>
              </div>

              {/* Message Body Display */}
              <div
                ref={emailContentRef}
                onMouseUp={handleMouseUpInEmail}
                className="flex-1 p-4 overflow-y-auto bg-white text-xs text-slate-800 leading-relaxed relative"
              >
                {selectedMessage.htmlBody ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedMessage.htmlBody }}
                    className="prose prose-sm max-w-none break-words"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800">
                    {selectedMessage.plainBody || '(İçerik boş)'}
                  </pre>
                )}

                {/* Attachments Section if any */}
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <h5 className="font-bold text-xs text-slate-800 mb-2 flex items-center space-x-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ekler ({selectedMessage.attachments.length})</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedMessage.attachments.map((att, index) => (
                        <div
                          key={index}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-700 truncate">{att.fileName}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {Math.round(att.size / 1024)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs space-y-3 p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Mail className="w-6 h-6" />
              </div>
              <p className="font-semibold">İçeriğini okumak için soldan bir e-posta seçin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Convert to Task Button on Highlight */}
      {selectedText && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <button
            onClick={() => handleOpenTaskModal(selectedText)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center space-x-2 border border-indigo-400 transition-transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Seçili Metinden Görev Oluştur ({selectedText.slice(0, 20)}...)</span>
          </button>
        </div>
      )}

      {/* MODAL 1: CONVERT TO TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">E-Postadan Görev Üret</h3>
                  <p className="text-[11px] text-slate-300">Görevi panonuza ve ilgili projeye ekleyin</p>
                </div>
              </div>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskFromEmail} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Görev Başlığı *</label>
                <input
                  type="text"
                  required
                  value={taskData.title}
                  onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
                  placeholder="Görev başlığını girin..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Görev Açıklaması & Alıntı</label>
                <textarea
                  rows={4}
                  value={taskData.description}
                  onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Proje (İsteğe Bağlı)</label>
                  <select
                    value={taskData.projectId}
                    onChange={(e) => setTaskData({ ...taskData, projectId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="">-- Projesiz Bireysel Görev --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        📁 {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Öncelik</label>
                  <select
                    value={taskData.priority}
                    onChange={(e) => setTaskData({ ...taskData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 font-medium"
                  >
                    <option value="LOW">🔵 Düşük</option>
                    <option value="MEDIUM">🟡 Orta</option>
                    <option value="HIGH">🔴 Yüksek</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <input
                    type="text"
                    value={taskData.category}
                    onChange={(e) => setTaskData({ ...taskData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bitiş / Teslim Tarihi</label>
                  <input
                    type="date"
                    value={taskData.dueDate}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{creatingTask ? 'Oluşturuluyor...' : 'Görevi Oluştur ve Ekle'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPOSE NEW EMAIL MODAL */}
      {showComposeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <h3 className="font-extrabold text-sm text-white">Yeni E-Posta Gönder</h3>
              </div>
              <button
                onClick={() => setShowComposeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMail} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kime (To) *</label>
                <input
                  type="email"
                  required
                  placeholder="ornek@alanadi.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bilgi (CC)</label>
                <input
                  type="text"
                  placeholder="Virgülle ayırarak birden fazla e-posta girebilirsiniz"
                  value={composeData.cc}
                  onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Konu *</label>
                <input
                  type="text"
                  required
                  placeholder="E-posta konusunu girin..."
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">E-Posta İçeriği *</label>
                <textarea
                  rows={7}
                  required
                  placeholder="Mesajınızı buraya yazın..."
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs font-sans"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowComposeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={sendingMail}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMail ? 'Gönderiliyor...' : 'E-Postayı Gönder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EMAIL ACCOUNT SETTINGS & ENCRYPTION MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">E-Posta (IMAP & SMTP) Hesap Ayarları</h3>
                  <p className="text-[11px] text-slate-300">Kişisel e-posta kutunuza bağlanın</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Encryption Security Badge */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Uçtan Uca Şifreli Güvenlik</span>
                  <span className="text-[11px] text-emerald-700">
                    E-posta şifreniz veritabanımızda <b>AES-256 (Laravel Crypt)</b> ile şifreli saklanır, asla açık metin olarak tutulmaz.
                  </span>
                </div>
              </div>

              {/* Quick Provider Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Hızlı Sağlayıcı Seçimi</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="p-2 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
                  >
                    Gmail
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('outlook')}
                    className="p-2 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
                  >
                    Outlook / O365
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('yandex')}
                    className="p-2 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
                  >
                    Yandex Mail
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('cpanel')}
                    className="p-2 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-xl text-xs font-semibold text-slate-700 transition-all text-center"
                  >
                    Kurumsal cPanel
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">E-Posta Adresi *</label>
                  <input
                    type="email"
                    required
                    placeholder="ad.soyad@sirket.com"
                    value={formData.emailAddress}
                    onChange={(e) => setFormData({ ...formData, emailAddress: e.target.value, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Görünen İsim</label>
                  <input
                    type="text"
                    placeholder={currentUser.fullName}
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              {/* IMAP Incoming Server */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <Inbox className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Gelen Sunucusu (IMAP)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">IMAP Sunucu Host *</label>
                    <input
                      type="text"
                      required
                      placeholder="imap.gmail.com"
                      value={formData.imapHost}
                      onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Port</label>
                    <input
                      type="number"
                      required
                      value={formData.imapPort}
                      onChange={(e) => setFormData({ ...formData, imapPort: parseInt(e.target.value) || 993 })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SMTP Outgoing Server */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Giden Sunucusu (SMTP)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">SMTP Sunucu Host *</label>
                    <input
                      type="text"
                      required
                      placeholder="smtp.gmail.com"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Port</label>
                    <input
                      type="number"
                      required
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 587 })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kullanıcı Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="ornek@alanadi.com"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    E-Posta Şifresi / Uygulama Şifresi {account ? '(Değiştirmeyecekseniz boş bırakın)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!account}
                    placeholder={account ? '••••••••••••' : 'Şifrenizi girin'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              {/* Test Result Message */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.imapHost || !formData.username || (!formData.password && !account)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                  <span>{testingConnection ? 'Test Ediliyor...' : 'Bağlantıyı Test Et'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {savingSettings ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
