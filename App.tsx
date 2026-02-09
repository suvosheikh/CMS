
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
import { Reminders } from './pages/Reminders';
import { ContentCalendar } from './pages/ContentCalendar';
import { DBService } from './services/dbService';
import { User } from './types';
import { LogIn, ShieldCheck, Lock, User as UserIcon, AlertCircle, Fingerprint, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
    
    const result = await DBService.login(username, password);
    
    if (result.user) {
      DBService.setCurrentUser(result.user);
      setCurrentUser(result.user);
      window.location.hash = '#/';
    } else {
      setError(result.error || 'Invalid credentials. Please check your username and key.');
    }
  };

  const handleLogout = () => {
    DBService.setCurrentUser(null);
    setCurrentUser(null);
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
        <div className="max-w-[440px] w-full bg-white rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
          <div className="p-12 pb-8 text-center flex flex-col items-center">
            {/* Custom Logo Component based on Image */}
            <div className="w-20 h-20 bg-blue-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl shadow-blue-100 mb-6">
              <Fingerprint size={40} strokeWidth={1.5} />
            </div>
            
            <div className="flex flex-col items-center mb-10">
               <h1 className="text-4xl font-black italic tracking-tighter text-[#76b82a] leading-none mb-1">RYANS</h1>
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Workspace</span>
                  <span className="text-blue-600 font-black text-xs">•</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">MarCom</span>
               </div>
            </div>
            
            {error && (
              <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-shake mb-6">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="text-xs font-bold leading-tight text-left">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleLogin} className="w-full space-y-8 text-left">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 block ml-1">Identity Access</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 focus:bg-white outline-none font-bold text-sm text-slate-600 placeholder:text-slate-300 transition-all"
                      placeholder="Username or Email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 block ml-1">Security Key</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 focus:bg-white outline-none font-bold text-sm text-slate-600 placeholder:text-slate-300 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-blue-700">
                <LogIn size={20} strokeWidth={2.5} /> Authorize Session
              </button>
            </form>
          </div>
          
          <div className="p-8 border-t border-slate-50 flex items-center justify-center gap-2 bg-slate-50/30">
            <Shield size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Encrypted Governance Mode</span>
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
                <Route path="/calendar" element={<ContentCalendar />} />
                <Route path="/ads" element={<AdsCampaign />} />
                <Route path="/ads/:id" element={<AdDetails />} />
                <Route path="/creative-store" element={<CreativeStore />} />
                <Route path="/reminders" element={<Reminders />} />
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
