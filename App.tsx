
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { Posts } from './pages/Posts';
import { Categories } from './pages/Categories';
import { BrandPosts } from './pages/BrandPosts';
import { Entry } from './pages/Entry';
import { UserManagement } from './pages/UserManagement';
import { Profile } from './pages/Profile';
import { AdsCampaign } from './pages/AdsCampaign';
import { AdDetails } from './pages/AdDetails';
import { Reports } from './pages/Reports';
import { CreativeStore } from './pages/CreativeStore';
import { DBService } from './services/dbService';
import { User } from './types';
import { LogIn, ShieldCheck, Lock, User as UserIcon, AlertCircle, Database, Copy, Check } from 'lucide-react';

const SQL_FIX_SETUP = `-- Run this in your PREVIOUS Supabase project to fix login:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.login_user(username_input text, password_input text)
RETURNS SETOF public.users
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.users
  WHERE (name = username_input OR email = username_input)
  AND (password = crypt(password_input, password) OR password = password_input);
END;
$$;

-- Setup Auto-hashing for future updates
CREATE OR REPLACE FUNCTION public.hash_user_password()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.password <> OLD.password) THEN
    NEW.password := crypt(NEW.password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_hash_password ON public.users;
CREATE TRIGGER trigger_hash_password
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.hash_user_password();`;

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSession = async () => {
    const user = await DBService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSetupRequired(false);
    
    const result = await DBService.login(username, password);
    
    if (result.user) {
      DBService.setCurrentUser(result.user);
      setCurrentUser(result.user);
      window.location.hash = '#/';
    } else {
      if (result.setupRequired) {
        setIsSetupRequired(true);
        setError('Login function missing in your old database.');
      } else {
        setError(result.error || 'Check username and security key.');
      }
    }
  };

  const handleLogout = () => {
    DBService.setCurrentUser(null);
    setCurrentUser(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(SQL_FIX_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black text-[10px] uppercase tracking-[0.3em]">RYANS WORKSPACE</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-10 bg-blue-600 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">RYANS</h1>
            <p className="text-blue-100 font-medium">Access Workspace Dashboard</p>
          </div>
          
          <div className="p-10 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="text-xs font-bold leading-tight">{error}</p>
              </div>
            )}

            {isSetupRequired && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-[2rem] space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 text-amber-700">
                  <Database size={18} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Restore Database Fix</p>
                </div>
                <p className="text-[11px] font-bold text-amber-600 leading-relaxed">
                  আপনার আগের ডেটাবেসে লগইন ফাংশনটি কাজ করছে না। ডেটা ডিলিট না করে এটি ঠিক করতে নিচের বাটনটি ক্লিক করুন এবং Supabase-এ রান করুন।
                </p>
                <button 
                  onClick={copyToClipboard}
                  className="w-full py-3 bg-white border border-amber-200 text-amber-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-100 transition-all shadow-sm"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy Fix SQL'}
                </button>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Username / Email</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm"
                      placeholder="Username or Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Security Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm"
                      placeholder="Security Key"
                    />
                  </div>
                </div>
              </div>

              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-blue-700">
                <LogIn size={18} /> Enter Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'Admin';

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar onLogout={handleLogout} />
        <div className="flex-1 ml-72 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-12 overflow-y-auto">
            <div className="max-w-[1500px] mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/entry" element={<Entry />} />
                <Route path="/posts" element={<Posts />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/brands" element={<BrandPosts />} />
                <Route path="/campaigns" element={<Reports />} />
                <Route path="/ads" element={<AdsCampaign />} />
                <Route path="/ads/:id" element={<AdDetails />} />
                <Route path="/creative-store" element={<CreativeStore />} />
                <Route 
                  path="/users" 
                  element={isAdmin ? <UserManagement /> : <Navigate to="/" replace />} 
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
