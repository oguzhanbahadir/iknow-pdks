import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface RegisterPageProps {
  onLoginSuccess: (user: User) => void;
}

export default function RegisterPage({ onLoginSuccess }: RegisterPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Frontend Yazılım');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          department,
          phone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kayıt işlemi başarısız.');
      }

      if (data.token) {
        localStorage.setItem('pdks_token', data.token);
      }

      onLoginSuccess(data.user);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-xs">
            IK
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">IKnow Technology</h1>
          <div className="inline-block bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100">
            Personel Kayıt Formu
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-emerald-900 text-base">Hesabınız Başarıyla Oluşturuldu!</h3>
            <p className="text-xs text-emerald-700">Sisteme yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ad Soyad *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">E-Posta Adresi *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="personel@iknow.com.tr"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Şifre Belirleyin *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Departman / Alan</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900 font-semibold"
                >
                  <option value="Frontend Yazılım">Frontend Yazılım</option>
                  <option value="Backend Yazılım">Backend Yazılım</option>
                  <option value="Full-Stack Yazılım">Full-Stack Yazılım</option>
                  <option value="Mobil & UI/UX">Mobil & UI/UX</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Telefon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 5XX XXX XX XX"
                  className="w-full py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 text-slate-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 shadow-xs mt-2"
            >
              <span>{loading ? 'Kaydediliyor...' : 'Kayıt Ol ve Giriş Yap'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Zaten hesabınız var mı?{' '}
          <Link to="/" className="font-bold text-indigo-600 hover:underline">
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}
