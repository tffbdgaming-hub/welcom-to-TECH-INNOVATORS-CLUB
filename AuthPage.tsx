import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Key, UserPlus, LogIn, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ADMIN_PASSWORD } from '../constants';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

type AuthView = 'login' | 'register' | 'admin';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [loginForm, setLoginForm] = useState({ role: '', idNumber: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '', role: '', fatherName: '', motherName: '',
    session: '', department: '', idNumber: '', photo: null as File | null
  });
  const [adminPass, setAdminPass] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', loginForm.role),
        where('idNumber', '==', loginForm.idNumber)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setError('ভুল রোল বা আইডি নম্বর।');
      } else {
        const userData = snapshot.docs[0].data() as any;
        if (userData.status !== 'approved') {
          setError('আপনার অ্যাকাউন্ট এখনো এডমিন দ্বারা অনুমোদিত হয়নি।');
        } else {
          await login({ ...userData, id: snapshot.docs[0].id });
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Check if role already exists
      const q = query(collection(db, 'users'), where('role', '==', registerForm.role));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setError('এই রোল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।');
        setLoading(false);
        return;
      }

      // Add to pending requests
      await addDoc(collection(db, 'users'), {
        ...registerForm,
        photoUrl: '', // Will handle upload later
        status: 'pending',
        createdAt: Date.now()
      });
      
      alert('রেজিস্ট্রেশন সফল হয়েছে! এডমিন অনুমোদনের জন্য অপেক্ষা করুন।');
      setView('login');
    } catch (err) {
      setError('রেজিস্ট্রেশন করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPass === ADMIN_PASSWORD) {
      await adminLogin();
      navigate('/admin');
    } else {
      setError('ভুল এডমিন পাসওয়ার্ড।');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="flex bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => setView('login')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'login' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              লগইন
            </button>
            <button
              onClick={() => setView('register')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'register' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              রেজিস্ট্রেশন
            </button>
            <button
              onClick={() => setView('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'admin' ? 'bg-emerald-500 text-zinc-950 shadow-lg' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              এডমিন
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center mb-6">ইউজার লগইন</h2>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">রোল নম্বর</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="আপনার রোল লিখুন"
                    value={loginForm.role}
                    onChange={(e) => setLoginForm({ ...loginForm, role: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">আইডি নম্বর</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="আপনার আইডি লিখুন"
                    value={loginForm.idNumber}
                    onChange={(e) => setLoginForm({ ...loginForm, idNumber: e.target.value })}
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                disabled={loading}
                className="w-full bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                <span>লগইন করুন</span>
              </button>
            </motion.form>
          )}

          {view === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center mb-6">নতুন রেজিস্ট্রেশন</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">নাম</label>
                  <input
                    type="text" required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">রোল</label>
                  <input
                    type="text" required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">বাবার নাম</label>
                  <input
                    type="text" required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setRegisterForm({ ...registerForm, fatherName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">মায়ের নাম</label>
                  <input
                    type="text" required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setRegisterForm({ ...registerForm, motherName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">সেশন</label>
                  <input
                    type="text" required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setRegisterForm({ ...registerForm, session: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">ডিপার্টমেন্ট</label>
                  <input
                    type="text" required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">আইডি নম্বর</label>
                <input
                  type="text" required
                  className="w-full bg-zinc-800 border border-white/5 rounded-xl py-2 px-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                  onChange={(e) => setRegisterForm({ ...registerForm, idNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">ছবি আপলোড</label>
                <div className="relative border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-emerald-500/50 transition-all cursor-pointer">
                  <input
                    type="file" accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setRegisterForm({ ...registerForm, photo: e.target.files?.[0] || null })}
                  />
                  <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">{registerForm.photo ? registerForm.photo.name : 'ছবি সিলেক্ট করুন'}</p>
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                disabled={loading}
                className="w-full bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                <span>সাবমিট করুন</span>
              </button>
            </motion.form>
          )}

          {view === 'admin' && (
            <motion.form
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAdminLogin}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-center mb-6">এডমিন লগইন</h2>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">এডমিন পাসওয়ার্ড</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-800 border border-white/5 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                  />
                </div>
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                className="w-full bg-emerald-500 text-zinc-950 font-bold py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>এডমিন লগইন</span>
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
