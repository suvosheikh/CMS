
import React, { useState, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { User, Role } from '../types';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Shield, Mail, Trash2, Edit2, ShieldCheck, ShieldAlert, X, Save, Lock, UserCheck, Loader2 } from 'lucide-react';
import { ROLES } from '../constants';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({ 
    name: '', 
    email: '', 
    role: 'Viewer' as Role,
    password: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, curr] = await Promise.all([
        DBService.getUsers(),
        DBService.getCurrentUser()
      ]);
      setUsers(u);
      setCurrentUser(curr);
    } catch (err) {
      console.error("Management data fail:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = currentUser?.role === 'Admin';

  const handleOpenModal = (user: User | null = null) => {
    if (!isAdmin) return;
    setErrorMessage(null);
    if (user) {
      setEditingUser(user);
      setFormData({ 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        password: '' 
      });
    } else {
      setEditingUser(null);
      setFormData({ 
        name: '', 
        email: '', 
        role: 'Viewer', 
        password: '123' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !isAdmin || isSaving) return;
    
    setErrorMessage(null);
    setIsSaving(true);
    
    // Create the ID only for new users
    const newId = `u-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalId = editingUser ? editingUser.id : newId;

    const user: User = {
      id: finalId,
      name: formData.name, 
      email: formData.email, 
      role: formData.role as Role, 
      password: formData.password || (editingUser ? editingUser.password : '123')
    } as User;

    const result = await DBService.saveUser(user);
    setIsSaving(false);

    if (result.success) {
      setIsModalOpen(false);
      fetchData();
    } else {
      setErrorMessage(result.error || 'Check database permissions.');
    }
  };

  const handleDeleteUser = async () => {
    if (!isAdmin || !deleteConfirmId) return;
    if (deleteConfirmId === currentUser?.id) {
      alert("Self-deletion protocol blocked.");
      setDeleteConfirmId(null);
      return;
    }
    
    const result = await DBService.deleteUser(deleteConfirmId);
    if (result.success) {
      setDeleteConfirmId(null);
      fetchData();
    } else {
      alert(`Delete failed: ${result.error}`);
    }
  };

  const getRoleBadge = (role: Role) => {
    const styles = {
      Admin: "bg-red-50 text-red-600 border-red-100",
      Editor: "bg-blue-50 text-blue-600 border-blue-100",
      Viewer: "bg-slate-50 text-slate-600 border-slate-100"
    };
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${styles[role]}`}>
        {role === 'Admin' ? <ShieldAlert size={12}/> : role === 'Editor' ? <ShieldCheck size={12}/> : <Shield size={12}/>} {role}
      </span>
    );
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying User Index...</p>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
         <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center animate-pulse"><Lock size={40} /></div>
         <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Security Protocol Active</h2>
         <p className="text-slate-500 font-medium">This module is restricted to Global Administrators only.</p>
         <button onClick={() => navigate('/')} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Users size={22} /></div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Global Governance</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5">Active directory management and privilege control.</p>
          </div>
        </div>

        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95">
          <UserPlus size={18} strokeWidth={3} /> Provision Identity
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        {users.map(user => (
          <div key={user.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/40 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenModal(user)} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-2xl shadow-sm transition-all"><Edit2 size={16}/></button>
              {user.id !== currentUser?.id && (
                <button onClick={() => setDeleteConfirmId(user.id)} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-2xl shadow-sm transition-all"><Trash2 size={16}/></button>
              )}
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border-8 border-white shadow-inner"><UserCheck size={40} /></div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 truncate w-full">{user.name}</h3>
              <p className="text-sm font-bold text-slate-400 mb-8 truncate w-full">{user.email}</p>
              <div className="pt-8 border-t border-slate-50 w-full flex flex-col items-center gap-4">
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserPlus size={24}/></div>
                <h3 className="text-2xl font-black tracking-tighter text-slate-900">{editingUser ? 'Update Credentials' : 'Provision Identity'}</h3>
              </div>
              <button onClick={() => !isSaving && setIsModalOpen(false)} className="p-3 bg-white rounded-full text-slate-300 hover:text-slate-900 transition-all border border-slate-100"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-10 space-y-8">
              {errorMessage && (
                <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-600 animate-in slide-in-from-top-2">
                   <ShieldAlert className="shrink-0 mt-0.5" size={20} />
                   <div className="flex flex-col">
                      <p className="text-xs font-black uppercase tracking-widest mb-1">Database Error</p>
                      <p className="text-xs font-bold leading-tight">{errorMessage}</p>
                   </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2.5 block">Full Identity Name</label>
                  <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2.5 block">Access Email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" placeholder="john@ryans.com" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Security Key</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="text" 
                        value={formData.password} 
                        onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} 
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-sm outline-none shadow-sm focus:border-blue-500 transition-all" 
                        placeholder={editingUser ? "Leave empty to keep current" : "Min 3 chars"} 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Access Privilege</label>
                    <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value as Role }))} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {isSaving ? 'Processing...' : 'Commit Authorization'}
                </button>
                <button type="button" onClick={() => !isSaving && setIsModalOpen(false)} className="px-8 py-5 bg-slate-50 text-slate-400 rounded-[1.75rem] font-black text-xs uppercase tracking-widest">
                  Abort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        title="Revoke Access?"
        message="Are you certain you wish to permanently terminate this user's identity and workspace access?"
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
