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
import { DBService } from './services/dbService';
import { User } from './types';
import { LogIn, ShieldCheck, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

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
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="p-10 bg-blue-600 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">RYANS</h1>
            <p className="text-blue-100 font-medium">Workspace Dashboard</p>
          </div>
          
          <div className="p-10 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 animate-shake">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p className="text-xs font-bold leading-tight">{error}</p>
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
                      placeholder="Username"
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
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-blue-700">
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