
import React, { useState, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { User } from '../types';
import { User as UserIcon, Lock, Mail, Shield, Save, CheckCircle, AlertTriangle } from 'lucide-react';

export const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    DBService.getCurrentUser().then(setUser);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (newPass !== confirmPass) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    if (newPass.length < 3) {
      setStatus({ type: 'error', message: 'Password is too short. Minimum 3 characters required.' });
      return;
    }

    if (user) {
      const result = await DBService.updatePassword(user.id, newPass);
      if (result.success) {
        setStatus({ type: 'success', message: 'Security key updated successfully! Your next login will require this new key.' });
        setNewPass('');
        setConfirmPass('');
      } else {
        setStatus({ type: 'error', message: result.error || 'Failed to update password. Please check database permissions.' });
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <header>
        <div className="flex items-center gap-2 mb-2">
           <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><UserIcon size={16}/></span>
           <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Personal Account</span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Profile</h1>
        <p className="text-slate-500 font-medium">Manage your workspace identity and security credentials.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center text-slate-200 mb-8 border-8 border-white shadow-inner">
              <UserIcon size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">{user.name}</h3>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mb-8 ${
              user.role === 'Admin' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {user.role} Privilege
            </span>

            <div className="w-full space-y-4 pt-8 border-t border-slate-50">
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Mail size={20}/></div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-700">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400"><Shield size={20}/></div>
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">User ID</p>
                  <p className="text-sm font-bold text-slate-700 font-mono tracking-tighter">{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-8 flex items-center gap-3">
              <Lock size={20} className="text-blue-600" /> Security Settings
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-8">
              {status && (
                <div className={`p-5 rounded-2xl border flex items-center gap-4 animate-in zoom-in-95 duration-200 ${
                  status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'
                }`}>
                  {status.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
                  <p className="text-sm font-bold">{status.message}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">New Security Key</label>
                  <input 
                    type="password" required value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">Confirm Security Key</label>
                  <input 
                    type="password" required value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm border border-slate-100">
                    <Shield size={20} strokeWidth={2.5}/>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Access Protection</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">
                      Updating your password will not log you out, but you must use the new key for your next login.
                    </p>
                  </div>
                </div>
              </div>

              <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-slate-800">
                <Save size={18} /> Update Credentials
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
