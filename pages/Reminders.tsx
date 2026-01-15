
import React, { useState, useEffect, useMemo } from 'react';
import { DBService } from '../services/dbService';
import { Reminder, ReminderStatus, ReminderPriority, User } from '../types';
import { 
  BellRing, Plus, Trash2, Edit2, X, Save, 
  Search, CheckCircle2, Clock, Calendar, 
  AlertCircle, ChevronRight, 
  Loader2, RotateCcw,
  CheckSquare, ListTodo, FileText, 
  Timer, Hash, Activity, CheckCircle,
  User as UserIcon, ShieldCheck
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const Reminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Confirmation Modal States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reopenConfirmId, setReopenConfirmId] = useState<string | null>(null);
  const [finishConfirmId, setFinishConfirmId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: '',
    description: '',
    due_date: today,
    status: 'Pending',
    priority: 'Medium'
  });

  const fetchData = async () => {
    setLoading(true);
    const [data, user] = await Promise.all([
      DBService.getReminders(),
      DBService.getCurrentUser()
    ]);
    setReminders(data);
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAdmin = currentUser?.role === 'Admin';
  const canModify = !!currentUser; 

  const handleOpenModal = (rem: Reminder | null = null) => {
    if (rem) {
      setEditingReminder(rem);
      setFormData({ ...rem });
    } else {
      setEditingReminder(null);
      setFormData({
        title: '',
        description: '',
        due_date: today,
        status: 'Pending',
        priority: 'Medium'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || !currentUser) return;
    setIsSaving(true);

    try {
      const remToSave: Reminder = {
        ...formData,
        id: editingReminder ? editingReminder.id : `REM-${Math.floor(1000 + Math.random() * 9000)}`,
        status: formData.status as ReminderStatus,
        priority: formData.priority as ReminderPriority,
        title: formData.title || '',
        description: formData.description || '',
        created_by_name: editingReminder ? editingReminder.created_by_name : currentUser.name,
        updated_by_name: currentUser.name
      } as Reminder;

      await DBService.saveReminder(remToSave);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || !isAdmin) return;
    await DBService.deleteReminder(deleteConfirmId);
    setDeleteConfirmId(null);
    fetchData();
  };

  const handleReopen = async () => {
    if (!reopenConfirmId || !isAdmin || !currentUser) return;
    
    // Find the original completed task
    const originalRem = reminders.find(r => r.id === reopenConfirmId);
    if (originalRem) {
      // Instead of updating the old one, we create a clone with a NEW ID
      // This preserves the "Log" of the completed task in the database.
      const newRem: Reminder = {
        ...originalRem,
        id: `REM-${Math.floor(1000 + Math.random() * 9000)}`, // New Unique ID
        status: 'Pending',
        created_at: new Date().toISOString(),
        completed_at: undefined,
        created_by_name: currentUser.name, // The person who re-opened it is the new owner
        updated_by_name: currentUser.name
      };
      
      await DBService.saveReminder(newRem);
      fetchData(); // This will show both the old completed log and the new pending task
    }
    setReopenConfirmId(null);
  };

  const handleFinish = async () => {
    if (!finishConfirmId) return;
    const rem = reminders.find(r => r.id === finishConfirmId);
    if (rem) {
      await updateStatus(rem, 'Completed');
    }
    setFinishConfirmId(null);
  };

  const updateStatus = async (rem: Reminder, status: ReminderStatus) => {
    if (!currentUser) return;
    const updated: Reminder = { 
      ...rem, 
      status,
      updated_by_name: currentUser.name,
      completed_at: status === 'Completed' ? new Date().toISOString() : undefined 
    };
    await DBService.saveReminder(updated);
    setReminders(prev => prev.map(r => r.id === rem.id ? updated : r));
  };

  const calculateDaysTaken = (rem: Reminder) => {
    if (!rem.created_at || !rem.completed_at) return null;
    const start = new Date(rem.created_at);
    const end = new Date(rem.completed_at);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays;
  };

  const filteredReminders = useMemo(() => {
    const safeSearch = (searchTerm || '').toLowerCase();
    return reminders.filter(r => 
      (r.title || '').toLowerCase().includes(safeSearch) || 
      (r.description || '').toLowerCase().includes(safeSearch)
    ).sort((a, b) => {
      if (a.status === 'Completed' && b.status !== 'Completed') return 1;
      if (a.status !== 'Completed' && b.status === 'Completed') return -1;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [reminders, searchTerm]);

  const stats = useMemo(() => {
    const pending = reminders.filter(r => r.status === 'Pending').length;
    const working = reminders.filter(r => r.status === 'Working').length;
    const done = reminders.filter(r => r.status === 'Completed').length;
    return { pending, working, done, total: reminders.length };
  }, [reminders]);

  const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-sm transition-all text-slate-700";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1";

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Workspace...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <BellRing size={20} />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tighter leading-none">Reminder Hub</h1>
            <p className="text-slate-500 font-semibold text-xs mt-1 leading-relaxed">
              Tracking <span className="text-blue-600 font-black">{stats.pending + stats.working} active instructions</span>.
            </p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={14} strokeWidth={3} /> New Instruction
        </button>
      </header>

      {/* Analytics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {[
          { label: 'Total', val: stats.total, icon: <ListTodo size={18}/>, bg: 'bg-slate-50', text: 'text-slate-600' },
          { label: 'Pending', val: stats.pending, icon: <Clock size={18}/>, bg: 'bg-amber-50', text: 'text-amber-600' },
          { label: 'Working', val: stats.working, icon: <Activity size={18}/>, bg: 'bg-blue-50', text: 'text-blue-600' },
          { label: 'Done', val: stats.done, icon: <CheckCircle2 size={18}/>, bg: 'bg-emerald-50', text: 'text-emerald-600' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
             <div className={`w-10 h-10 ${s.bg} ${s.text} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>{s.icon}</div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">{s.val}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-[#e2e8f0]/30 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-sm flex items-center gap-3 transition-all mx-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl outline-none focus:ring-0 text-sm font-bold text-slate-600 placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 px-2">
        {filteredReminders.map(rem => {
          const daysTaken = calculateDaysTaken(rem);
          const isDone = rem.status === 'Completed';

          return (
            <div 
              key={rem.id} 
              className={`p-6 bg-white rounded-[2rem] border transition-all hover:shadow-xl hover:shadow-slate-200/40 group relative flex flex-col ${
                isDone ? 'border-emerald-100 shadow-emerald-50/20' : 'border-slate-100'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                    rem.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                    rem.priority === 'Medium' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {rem.priority}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1 px-2 py-1 rounded-lg ${
                    isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-300'
                  }`}>
                    <Hash size={10}/> {rem.id}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleOpenModal(rem)} className="p-1.5 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-lg shadow-sm transition-all"><Edit2 size={12}/></button>
                  {isAdmin && (
                    <button onClick={() => setDeleteConfirmId(rem.id)} className="p-1.5 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-lg shadow-sm transition-all"><Trash2 size={12}/></button>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className={`text-lg font-black tracking-tight leading-snug transition-colors ${
                  isDone ? 'text-slate-400 line-through decoration-emerald-500/20' : 'text-slate-900'
                }`}>
                  {rem.title}
                </h3>
                <p className={`text-xs font-semibold leading-relaxed line-clamp-3 transition-opacity ${
                  isDone ? 'text-slate-400 opacity-80' : 'text-slate-500'
                }`}>
                  {rem.description}
                </p>
              </div>

              <div className="h-px bg-slate-50 w-full my-4"></div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Calendar size={10} className={isDone ? 'text-emerald-500' : 'text-blue-500'} /> Due
                    </span>
                    <p className={`text-[11px] font-black tracking-tight ${isDone ? 'text-slate-400' : 'text-slate-800'}`}>{rem.due_date || 'N/A'}</p>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                       <Clock size={10} className="text-slate-400" /> State
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isDone ? 'bg-emerald-500' :
                        rem.status === 'Working' ? 'bg-blue-500 animate-pulse' :
                        'bg-amber-400'
                      }`}></div>
                      <p className={`text-[11px] font-black tracking-tight uppercase ${isDone ? 'text-emerald-600' : 'text-slate-800'}`}>{rem.status}</p>
                    </div>
                 </div>
              </div>

              {/* Workflow Tracking - Positioned exactly below calendar/due area */}
              <div className="pt-3 border-t border-slate-50 flex flex-col gap-1.5 bg-slate-50/50 p-3 rounded-xl mt-auto">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <UserIcon size={10} className="text-blue-500" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Workflow Summary</span>
                   </div>
                   <div className="text-[7px] font-black text-slate-300 uppercase">Live Identity</div>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400">Created by:</span>
                    <span className="text-[9px] font-black text-blue-600 truncate max-w-[120px]">{rem.created_by_name || 'System'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400">Last Action by:</span>
                    <span className="text-[9px] font-black text-slate-700 truncate max-w-[120px]">{rem.updated_by_name || 'System'}</span>
                  </div>
                </div>
              </div>

              {isDone && (
                <div className="mt-4 p-3 bg-emerald-50/40 border border-emerald-100/50 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-1">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                         <Timer size={14} strokeWidth={2.5}/>
                      </div>
                      <div>
                         <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Efficiency</p>
                         <p className="text-[11px] font-black text-emerald-700 tracking-tight">
                           Closed by <span className="font-black">{rem.updated_by_name}</span> in <span className="underline decoration-emerald-300 underline-offset-2">{daysTaken} day{daysTaken! > 1 ? 's' : ''}</span>
                         </p>
                      </div>
                   </div>
                   <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100">
                      <CheckCircle size={14} />
                   </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                <div className="flex gap-2">
                  {!isDone ? (
                    <>
                      {rem.status === 'Pending' ? (
                        <button 
                          onClick={() => updateStatus(rem, 'Working')}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
                        >
                          <Activity size={12} /> Start
                        </button>
                      ) : (
                        <button 
                          onClick={() => setFinishConfirmId(rem.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-50 active:scale-95"
                        >
                          <CheckCircle size={12} /> Finish
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {isAdmin && (
                        <button 
                          onClick={() => setReopenConfirmId(rem.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-blue-600 hover:border-blue-100 transition-all active:scale-95 shadow-sm"
                        >
                          <RotateCcw size={12} /> Reopen
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && canModify && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-100"><BellRing size={24}/></div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{editingReminder ? 'Update Note' : 'New Instruction'}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Contributor: {currentUser?.name}</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                 <div>
                    <label className={labelClass}>Note Title</label>
                    <div className="relative">
                      <ListTodo className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        required 
                        value={formData.title} 
                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
                        className={`${inputClass} pl-12`} 
                        placeholder="Subject..." 
                      />
                    </div>
                 </div>

                 <div>
                    <label className={labelClass}>Description</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-5 text-slate-300" size={16} />
                      <textarea 
                        required 
                        value={formData.description} 
                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} 
                        className={`${inputClass} pl-12 min-h-[120px] py-4 resize-none`} 
                        placeholder="Details..." 
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className={labelClass}>Deadline</label>
                       <div className="relative">
                         <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                         <input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} className={`${inputClass} pl-12`} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className={labelClass}>Priority</label>
                       <div className="relative">
                         <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                         <select value={formData.priority} onChange={e => setFormData(p => ({ ...p, priority: e.target.value as ReminderPriority }))} className={`${inputClass} pl-12 appearance-none`}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                         </select>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex gap-3">
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-blue-700">
                   {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14}/>}
                   Save Task
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        title="Purge Task?"
        message="Permanently remove this instruction? This action is strictly reserved for Admins."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <ConfirmationModal 
        isOpen={!!reopenConfirmId}
        title="Reopen Task?"
        message="Are you sure you want to spawn a new instance of this task? The original completed entry will remain as a historical log, and a new Pending task will be created with a unique ID."
        onConfirm={handleReopen}
        onCancel={() => setReopenConfirmId(null)}
        confirmText="Yes, Spawn New Task"
        type="warning"
      />

      <ConfirmationModal 
        isOpen={!!finishConfirmId}
        title="Complete Task?"
        message="Confirm this task is fully resolved and ready to be archived?"
        onConfirm={handleFinish}
        onCancel={() => setFinishConfirmId(null)}
        confirmText="Finish Task"
        type="warning"
      />
    </div>
  );
};
