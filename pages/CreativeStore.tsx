
import React, { useState, useEffect, useMemo } from 'react';
import { DBService } from '../services/dbService';
import { CreativeLog, User, CreativePlatform, CreativeMedium, CreativeSubOption } from '../types';
import { 
  Paintbrush, Plus, Trash2, Edit2, X, Save, 
  Search, CheckCircle2,
  Calendar, TrendingUp, LayoutList,
  Monitor, FileImage, Video as VideoIcon, 
  User as UserIcon, ShieldAlert, Clock, Check,
  Settings, CheckSquare, Square
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CREATIVE_PLATFORMS, CREATIVE_MEDIUMS, DESIGNER_NAMES } from '../constants';

export const CreativeStore: React.FC = () => {
  const [logs, setLogs] = useState<CreativeLog[]>([]);
  const [allSubOptions, setAllSubOptions] = useState<CreativeSubOption[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CreativeLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');

  const [formData, setFormData] = useState<Partial<CreativeLog>>({
    date: new Date().toISOString().split('T')[0],
    creator_name: DESIGNER_NAMES[0],
    subject: '',
    platform: 'Social Media',
    medium: 'Digital Image',
    amount: 0,
    selected_options: ''
  });

  const [selectedTicks, setSelectedTicks] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [data, opts, user] = await Promise.all([
      DBService.getCreativeLogs(),
      DBService.getCreativeSubOptions(),
      DBService.getCurrentUser()
    ]);
    setLogs(data);
    setAllSubOptions(opts);
    setCurrentUser(user);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const role = currentUser?.role || 'Viewer';
  const isAdmin = role === 'Admin';
  const isEditor = role === 'Editor' || isAdmin;
  const isViewer = role === 'Viewer';

  const currentPlatformSubOptions = useMemo(() => {
    return allSubOptions.filter(opt => opt.platform === formData.platform);
  }, [allSubOptions, formData.platform]);

  useEffect(() => {
    // If not editing, reset ticks when platform changes
    if (!editingLog) {
      setSelectedTicks([]);
      setFormData(prev => ({ ...prev, amount: 0 }));
    }
  }, [formData.platform, editingLog]);

  const toggleTick = (optionName: string) => {
    setSelectedTicks(prev => {
      const next = prev.includes(optionName) 
        ? prev.filter(t => t !== optionName) 
        : [...prev, optionName];
      
      // Auto-update quantity
      setFormData(f => ({ ...f, amount: next.length }));
      return next;
    });
  };

  const handleAddSubOption = async () => {
    if (!newOptionName.trim() || !formData.platform || !isEditor) return;
    const newOpt: CreativeSubOption = {
      id: `cso-${Math.random().toString(36).substr(2, 9)}`,
      platform: formData.platform as CreativePlatform,
      name: newOptionName.trim()
    };
    await DBService.saveCreativeSubOption(newOpt);
    setAllSubOptions(prev => [...prev, newOpt]);
    setNewOptionName('');
    setIsAddingOption(false);
  };

  const handleOpenModal = (log: CreativeLog | null = null) => {
    if (isViewer) return;
    if (log) {
      setEditingLog(log);
      setFormData({ ...log });
      setSelectedTicks(log.selected_options ? log.selected_options.split(', ') : []);
    } else {
      setEditingLog(null);
      setSelectedTicks([]);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        creator_name: DESIGNER_NAMES[0],
        subject: '',
        platform: 'Social Media',
        medium: 'Digital Image',
        amount: 0,
        selected_options: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    
    const log: CreativeLog = {
      ...formData,
      selected_options: selectedTicks.join(', '),
      id: editingLog ? editingLog.id : `CR-${Math.floor(1000 + Math.random() * 9000)}`,
    } as CreativeLog;

    await DBService.saveCreativeLog(log);
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!isAdmin || !deleteConfirmId) return;
    await DBService.deleteCreativeLog(deleteConfirmId);
    setDeleteConfirmId(null);
    fetchData();
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.platform?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const stats = useMemo(() => {
    const totalItems = logs.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const digitalCount = logs.filter(l => l.medium === 'Digital Image').reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const physicalCount = logs.filter(l => l.medium === 'Physical Image').reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const videoCount = logs.filter(l => l.medium === 'Video').reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    
    return { totalItems, digitalCount, physicalCount, videoCount };
  }, [logs]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Creative Vault...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Paintbrush size={22} /></div>
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Creative Store</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">Daily production ledger for designers and editors.</p>
          </div>
        </div>
        {isEditor && (
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95">
            <Plus size={18} strokeWidth={3} /> Log New Output
          </button>
        )}
      </header>

      {isViewer && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 mx-2">
          <ShieldAlert size={18} />
          <p className="text-[11px] font-black uppercase tracking-widest">Registry Viewer Protocol Active</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><LayoutList size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Assets</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.totalItems}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Monitor size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Digital Design</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.digitalCount}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
           <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileImage size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Physical Print</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.physicalCount}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-200 transition-all">
           <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><VideoIcon size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Video Output</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.videoCount}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search creator or subject..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 text-sm font-bold w-80" />
           </div>
           <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Production Feed</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900">
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Date / Creator</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Subject Reference</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Channel Hub</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-center">Medium Type</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-center">Qty</th>
                {!isViewer && <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-right">Ops</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><UserIcon size={18} /></div>
                       <div>
                          <p className="text-[11px] font-black text-slate-900">{log.creator_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{log.date}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 max-w-xs">
                    <p className="text-[11px] font-bold text-slate-700 leading-snug">{log.subject}</p>
                    {log.selected_options && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {log.selected_options.split(', ').map((opt, i) => (
                          <span key={i} className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-md tracking-widest">{opt}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-8"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">{log.platform}</span></td>
                  <td className="px-8 py-8 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase inline-block ${
                      log.medium === 'Video' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      log.medium === 'Physical Image' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {log.medium}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-center"><span className="text-base font-black text-slate-900">{log.amount}</span></td>
                  {!isViewer && (
                    <td className="px-8 py-8">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                         {isEditor && <button onClick={() => handleOpenModal(log)} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Edit2 size={16} strokeWidth={3}/></button>}
                         {isAdmin && <button onClick={() => setDeleteConfirmId(log.id)} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={16} strokeWidth={3}/></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                     <div className="flex flex-col items-center gap-4 opacity-30">
                        <Paintbrush size={48} />
                        <p className="text-sm font-black uppercase tracking-widest">No production logs found</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && isEditor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-100"><Paintbrush size={28}/></div>
                  <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingLog ? 'Update Production Log' : 'Log New Production'}</h3></div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-10 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-8">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Date</label>
                   <input type="date" required value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Creative Identity</label>
                   <select value={formData.creator_name} onChange={e => setFormData(p => ({ ...p, creator_name: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                     {DESIGNER_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                   </select>
                </div>
                <div className="col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Subject / Product / Topic</label>
                   <input required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" placeholder="e.g. Sonos roam 2 feature set" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Channel Hub</label>
                   <select value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value as CreativePlatform }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                     {CREATIVE_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Content Medium</label>
                   <select value={formData.medium} onChange={e => setFormData(p => ({ ...p, medium: e.target.value as CreativeMedium }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                     {CREATIVE_MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                </div>

                {/* Dynamic Tick Marks Section */}
                <div className="col-span-2 space-y-6 pt-4 border-t border-slate-50">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare size={16} className="text-blue-600" />
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Work Selection (Auto Quantity)</label>
                      </div>
                      {isEditor && (
                        <button 
                          type="button" 
                          onClick={() => setIsAddingOption(!isAddingOption)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all"
                        >
                          <Plus size={12} strokeWidth={3}/> Add Option
                        </button>
                      )}
                   </div>

                   {isAddingOption && (
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Add new "{formData.platform}" task type</p>
                        <div className="flex gap-2">
                           <input 
                             value={newOptionName} 
                             onChange={e => setNewOptionName(e.target.value)} 
                             className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" 
                             placeholder="e.g. YouTube Reel, Newsletter"
                           />
                           <button 
                             type="button" 
                             onClick={handleAddSubOption}
                             className="px-5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all"
                           >
                             Save
                           </button>
                        </div>
                     </div>
                   )}

                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {currentPlatformSubOptions.map(opt => (
                        <div 
                          key={opt.id} 
                          onClick={() => toggleTick(opt.name)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                            selectedTicks.includes(opt.name) 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                              : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                          }`}
                        >
                           <span className="text-[11px] font-black tracking-tight">{opt.name}</span>
                           <div className={`transition-all ${selectedTicks.includes(opt.name) ? 'scale-110' : 'group-hover:scale-110'}`}>
                             {selectedTicks.includes(opt.name) ? <Check size={16} strokeWidth={4} /> : <div className="w-4 h-4 border-2 border-slate-100 rounded-md"></div>}
                           </div>
                        </div>
                      ))}
                      {currentPlatformSubOptions.length === 0 && !isAddingOption && (
                        <div className="col-span-full py-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No tasks defined for this hub. Click "+ Add Option" to create one.</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="col-span-2 pt-6 border-t border-slate-50">
                   <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[2rem] text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
                           <LayoutList size={22} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Quantity Produced</p>
                           <p className="text-xs font-bold text-slate-400">Sum of selected tasks above</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <input 
                           type="number" 
                           min="0" 
                           required 
                           value={formData.amount} 
                           onChange={e => setFormData(p => ({ ...p, amount: parseInt(e.target.value) || 0 }))} 
                           className="w-24 px-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-3xl outline-none text-center text-white focus:border-blue-500 transition-all" 
                        />
                      </div>
                   </div>
                </div>
              </div>
              <div className="pt-10 border-t border-slate-50 flex gap-4">
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98]"><Save size={18}/> Commit to Ledger</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        title="Delete Production Entry?"
        message="Are you certain you want to remove this record from the production history? This action is permanent."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
