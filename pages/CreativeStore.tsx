
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DBService } from '../services/dbService';
import { CreativeLog, User, CreativePlatform, CreativeMedium, CreativeSubOption, CreativeDesigner } from '../types';
import { 
  Paintbrush, Plus, Trash2, Edit2, X, Save, 
  Search, CheckCircle2,
  Calendar, TrendingUp, LayoutList,
  Monitor, FileImage, Video as VideoIcon, 
  User as UserIcon, ShieldAlert, Clock, Check,
  Settings, CheckSquare, Square, Filter, ChevronRight,
  UserCheck, CalendarPlus, RotateCcw
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { CREATIVE_PLATFORMS, CREATIVE_MEDIUMS } from '../constants';

export const CreativeStore: React.FC = () => {
  const [logs, setLogs] = useState<CreativeLog[]>([]);
  const [allSubOptions, setAllSubOptions] = useState<CreativeSubOption[]>([]);
  const [designers, setDesigners] = useState<CreativeDesigner[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<CreativeLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date selection states
  const today = new Date().toISOString().split('T')[0];
  const [selectedDates, setSelectedDates] = useState<string[]>([today]);
  const [tempPickedDate, setTempPickedDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [filterCreator, setFilterCreator] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [designerToDelete, setDesignerToDelete] = useState<CreativeDesigner | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newDesignerName, setNewDesignerName] = useState('');
  
  const [editingDesignerId, setEditingDesignerId] = useState<string | null>(null);
  const [editingDesignerName, setEditingDesignerName] = useState('');

  const [formData, setFormData] = useState<Partial<CreativeLog>>({
    date: today,
    creator_name: '',
    subject: '',
    platform: 'Social Media',
    medium: 'Digital Image',
    amount: 0,
    selected_options: ''
  });

  const [selectedTicks, setSelectedTicks] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [data, opts, des, user] = await Promise.all([
      DBService.getCreativeLogs(),
      DBService.getCreativeSubOptions(),
      DBService.getCreativeDesigners(),
      DBService.getCurrentUser()
    ]);
    setLogs(data);
    setAllSubOptions(opts);
    setDesigners(des);
    setCurrentUser(user);
    
    if (des.length > 0 && !formData.creator_name) {
      setFormData(prev => ({ ...prev, creator_name: des[0].name }));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const role = currentUser?.role || 'Viewer';
  const isAdmin = role === 'Admin';
  const isEditor = role === 'Editor' || isAdmin;
  const isViewer = role === 'Viewer';

  const currentPlatformSubOptions = useMemo(() => {
    return allSubOptions.filter(opt => opt.platform === formData.platform);
  }, [allSubOptions, formData.platform]);

  useEffect(() => {
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
      
      setFormData(f => ({ ...f, amount: next.length }));
      return next;
    });
  };

  // Helper to add manual date
  const commitManualDate = () => {
    if (!tempPickedDate) return;
    setSelectedDates(prev => {
      if (prev.includes(tempPickedDate)) return prev;
      return [...prev, tempPickedDate].sort((a, b) => b.localeCompare(a));
    });
    setTempPickedDate('');
  };

  const removeDate = (date: string) => {
    setSelectedDates(prev => prev.filter(d => d !== date));
  };

  // Presets logic
  const setRangePreset = (days: number) => {
    const dates = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setSelectedDates(dates.sort((a, b) => b.localeCompare(a)));
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

  const handleAddDesigner = async () => {
    if (!newDesignerName.trim() || !isAdmin) return;
    const newDes: CreativeDesigner = {
      id: `des-${Math.random().toString(36).substr(2, 9)}`,
      name: newDesignerName.trim()
    };
    await DBService.saveCreativeDesigner(newDes);
    setDesigners(prev => [...prev, newDes].sort((a, b) => a.name.localeCompare(b.name)));
    setNewDesignerName('');
  };

  const startEditingDesigner = (designer: CreativeDesigner) => {
    setEditingDesignerId(designer.id);
    setEditingDesignerName(designer.name);
  };

  const handleUpdateDesigner = async () => {
    if (!editingDesignerId || !editingDesignerName.trim() || !isAdmin) return;
    const updated: CreativeDesigner = {
      id: editingDesignerId,
      name: editingDesignerName.trim()
    };
    await DBService.saveCreativeDesigner(updated);
    setDesigners(prev => prev.map(d => d.id === editingDesignerId ? updated : d).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingDesignerId(null);
    setEditingDesignerName('');
  };

  const confirmDeleteDesigner = async () => {
    if (!isAdmin || !designerToDelete) return;
    await DBService.deleteCreativeDesigner(designerToDelete.id);
    setDesigners(prev => prev.filter(d => d.id !== designerToDelete.id));
    setDesignerToDelete(null);
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
        date: today,
        creator_name: designers.length > 0 ? designers[0].name : '',
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
    return logs.filter(l => {
      const matchSearch = searchTerm === '' || 
        l.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.platform?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDate = selectedDates.length === 0 || selectedDates.includes(l.date);
      const matchCreator = filterCreator === '' || l.creator_name === filterCreator;
      
      return matchSearch && matchDate && matchCreator;
    });
  }, [logs, searchTerm, selectedDates, filterCreator]);

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
        <div className="flex items-center gap-4">
           {isAdmin && (
             <button onClick={() => setIsIdentityModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95">
               <UserCheck size={18} /> Manage Identities
             </button>
           )}
           {isEditor && (
             <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95">
               <Plus size={18} strokeWidth={3} /> Log New Output
             </button>
           )}
        </div>
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

      {/* Advanced Filter Console */}
      <div className="bg-[#e2e8f0]/40 backdrop-blur-md p-2.5 rounded-full border border-white/40 shadow-sm flex items-center gap-4 transition-all hover:bg-[#e2e8f0]/60 mx-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search subjects or platforms..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 bg-white border-none rounded-full outline-none focus:ring-0 text-sm font-medium text-slate-600 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Updated Multi-Date Picker with Presets */}
        <div className="relative" ref={datePickerRef}>
          <button 
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="flex items-center gap-3 bg-white rounded-full px-5 py-3.5 shadow-sm min-w-[220px] hover:bg-slate-50 transition-colors"
          >
            <Calendar size={18} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]">
              {selectedDates.length === 0 ? "All Time" : 
               selectedDates.length === 1 && selectedDates[0] === today ? "Today" :
               selectedDates.length === 7 && selectedDates.includes(today) ? "Last 7 Days" :
               `${selectedDates.length} Dates Active`}
            </span>
          </button>

          {isDatePickerOpen && (
            <div className="absolute top-full mt-3 right-0 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-[100] animate-in slide-in-from-top-2">
              <div className="space-y-6">
                {/* Presets Row */}
                <div className="space-y-3">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick Ranges</p>
                   <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => setSelectedDates([today])} className={`py-2 text-[10px] font-black rounded-xl border transition-all ${selectedDates.length === 1 && selectedDates[0] === today ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}`}>Today</button>
                      <button onClick={() => setRangePreset(7)} className="py-2 bg-white border border-slate-100 text-slate-600 hover:border-blue-200 rounded-xl text-[10px] font-black transition-all">7D</button>
                      <button onClick={() => setRangePreset(15)} className="py-2 bg-white border border-slate-100 text-slate-600 hover:border-blue-200 rounded-xl text-[10px] font-black transition-all">15D</button>
                      <button onClick={() => setRangePreset(30)} className="py-2 bg-white border border-slate-100 text-slate-600 hover:border-blue-200 rounded-xl text-[10px] font-black transition-all">30D</button>
                   </div>
                </div>

                {/* Manual Picker */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Selection</p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        type="date" 
                        value={tempPickedDate}
                        onChange={(e) => setTempPickedDate(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitManualDate()}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-blue-300 transition-all" 
                      />
                    </div>
                    <button 
                      onClick={commitManualDate}
                      className="px-4 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-100"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Tags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Pool</p>
                    <button onClick={() => setSelectedDates([])} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear All</button>
                  </div>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {selectedDates.map(date => (
                      <div key={date} className="flex items-center justify-between p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 animate-in fade-in zoom-in-95">
                        <span className="text-[11px] font-black tracking-tight">{date}</span>
                        <button onClick={() => removeDate(date)} className="text-blue-300 hover:text-blue-600 transition-colors">
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    {selectedDates.length === 0 && (
                      <p className="text-[10px] font-bold text-slate-300 italic text-center py-4">No specific dates selected. All logs visible.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-1.5 shadow-sm min-w-[200px]">
           <UserIcon size={18} className="text-slate-400" />
           <select 
             value={filterCreator} 
             onChange={(e) => setFilterCreator(e.target.value)} 
             className="text-xs font-bold text-slate-700 outline-none bg-transparent border-none py-2 pr-8 cursor-pointer w-full focus:ring-0"
           >
             <option value="">All Identities</option>
             {designers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-300" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Feed ({filteredLogs.length} Records)</span>
           </div>
           {(searchTerm || selectedDates.length > 0 || filterCreator) && (
             <button 
              onClick={() => { 
                setSearchTerm(''); 
                setSelectedDates([today]); 
                setFilterCreator(''); 
              }} 
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-2"
             >
               <RotateCcw size={12} /> Reset View
             </button>
           )}
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
                    <p className="text-[11px] font-bold text-slate-700 leading-snug leading-tight">{log.subject}</p>
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
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
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
                        <Search size={48} />
                        <p className="text-sm font-black uppercase tracking-widest">No production logs found for active filters</p>
                     </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Identity Management Modal */}
      {isIdentityModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
             <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-200"><UserCheck size={28}/></div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Identity Registry</h3>
                </div>
                <button onClick={() => setIsIdentityModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"><X size={24}/></button>
             </div>
             <div className="p-10 space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Add New Producer Identity</label>
                   <div className="flex gap-2">
                      <input 
                        value={newDesignerName} 
                        onChange={e => setNewDesignerName(e.target.value)} 
                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" 
                        placeholder="Designer or Editor Name"
                      />
                      <button 
                        onClick={handleAddDesigner}
                        className="px-6 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
                      >
                        Add
                      </button>
                   </div>
                </div>
                
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                   {designers.map(d => (
                     <div key={d.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-3 flex-1">
                           <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all"><UserIcon size={14}/></div>
                           {editingDesignerId === d.id ? (
                             <input 
                               autoFocus
                               value={editingDesignerName}
                               onChange={(e) => setEditingDesignerName(e.target.value)}
                               className="text-sm font-black text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none w-full"
                               onKeyDown={(e) => e.key === 'Enter' && handleUpdateDesigner()}
                             />
                           ) : (
                             <span className="text-sm font-black text-slate-700">{d.name}</span>
                           )}
                        </div>
                        <div className="flex items-center gap-1">
                           {editingDesignerId === d.id ? (
                             <>
                               <button 
                                 onClick={handleUpdateDesigner}
                                 className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                 title="Save Rename"
                               >
                                 <Check size={16} strokeWidth={3}/>
                               </button>
                               <button 
                                 onClick={() => setEditingDesignerId(null)}
                                 className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
                                 title="Cancel"
                               >
                                 <X size={16}/>
                               </button>
                             </>
                           ) : (
                             <>
                               <button 
                                 onClick={() => startEditingDesigner(d)}
                                 className="p-2 text-slate-200 hover:text-blue-500 transition-all hover:bg-blue-50 rounded-lg"
                                 title="Rename Identity"
                               >
                                 <Edit2 size={16}/>
                               </button>
                               <button 
                                 onClick={() => setDesignerToDelete(d)}
                                 className="p-2 text-slate-200 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                                 title="Remove Identity"
                               >
                                 <Trash2 size={16}/>
                               </button>
                             </>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>
             <div className="p-8 border-t border-slate-50 bg-slate-50/20 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Changes take effect immediately for all entry forms.</p>
             </div>
          </div>
        </div>
      )}

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
                     {designers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                     {designers.length === 0 && <option value="">No Identities Defined</option>}
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

      <ConfirmationModal 
        isOpen={!!designerToDelete}
        title="Remove Producer Identity?"
        message={`Are you certain you want to remove "${designerToDelete?.name}" from the identity registry? Past production logs will remain, but this identity will no longer be available for new logs.`}
        onConfirm={confirmDeleteDesigner}
        onCancel={() => setDesignerToDelete(null)}
        confirmText="Remove Identity"
      />
    </div>
  );
};
