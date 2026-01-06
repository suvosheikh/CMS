
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DBService } from '../services/dbService';
import { AdCampaignEntry, AdStatus, User } from '../types';
import { 
  Megaphone, Plus, Trash2, Edit2, X, Save, 
  Search, LayoutList, Eye, Info, CheckCircle2,
  Calendar, TrendingUp, DollarSign, Activity, Flag,
  Clock, ShieldAlert
} from 'lucide-react';

export const AdsCampaign: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdCampaignEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<AdCampaignEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<AdCampaignEntry>>({
    platform: 'Meta',
    subject: '',
    media_type: 'Image',
    primary_kpi: 'Traffic',
    planned_duration: 0,
    total_budget: 0,
    spend: 0,
    status: 'Planned',
    start_date: '',
    end_date: '',
    paused_date: '',
    result: '',
    cost_per_result: 0,
    impression: 0,
    reach: 0,
    other_effects: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const [data, user] = await Promise.all([
      DBService.getAdsCampaigns(),
      DBService.getCurrentUser()
    ]);
    setCampaigns(data);
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

  const calculateDuration = (ad: Partial<AdCampaignEntry> | AdCampaignEntry) => {
    if (!ad.start_date) return 0;
    const start = new Date(ad.start_date);
    let end = new Date();
    if (ad.status === 'Completed' && ad.end_date) end = new Date(ad.end_date);
    else if (ad.status === 'Paused' && ad.paused_date) end = new Date(ad.paused_date);
    else if (ad.status === 'Planned' && ad.end_date) end = new Date(ad.end_date);
    const diffTime = end.getTime() - start.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const handleOpenModal = (camp: AdCampaignEntry | null = null) => {
    if (isViewer) return;
    if (camp) {
      setEditingCamp(camp);
      setFormData({ ...camp });
    } else {
      setEditingCamp(null);
      setFormData({
        platform: 'Meta', subject: '', media_type: 'Image', primary_kpi: 'Traffic',
        planned_duration: 0, total_budget: 0, spend: 0, status: 'Planned',
        start_date: '', end_date: '', paused_date: '', result: '',
        cost_per_result: 0, impression: 0, reach: 0, other_effects: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    const duration = calculateDuration(formData);
    const camp: AdCampaignEntry = {
      ...formData,
      planned_duration: duration,
      id: editingCamp ? editingCamp.id : `C-${Math.floor(1000 + Math.random() * 9000)}`,
    } as AdCampaignEntry;

    await DBService.saveAdsCampaign(camp);
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Permanently delete this ad record?')) {
      await DBService.deleteAdsCampaign(id);
      fetchData();
    }
  };

  const getStatusStyle = (status: AdStatus) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-600 text-white border-emerald-700';
      case 'Active': return 'bg-blue-600 text-white border-blue-700';
      case 'Paused': return 'bg-amber-500 text-white border-amber-600';
      default: return 'bg-slate-400 text-white border-slate-500';
    }
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => 
      c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.platform?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [campaigns, searchTerm]);

  const dashboardStats = useMemo(() => {
    const totalSpend = campaigns.reduce((acc, c) => acc + (Number(c.spend) || 0), 0);
    const activeCount = campaigns.filter(c => c.status === 'Active').length;
    const completedCount = campaigns.filter(c => c.status === 'Completed').length;
    return { totalSpend, activeCount, completedCount, totalCampaigns: campaigns.length };
  }, [campaigns]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Megaphone size={22} /></div>
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Ads Management</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">Lifecycle reporting across Channel Hubs.</p>
          </div>
        </div>
        {isEditor && (
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95">
            <Plus size={18} strokeWidth={3} /> New Ad Registry
          </button>
        )}
      </header>

      {isViewer && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 mx-2">
          <ShieldAlert size={18} />
          <p className="text-[11px] font-black uppercase tracking-widest">Protected Insight View Only</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><DollarSign size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spend</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">${dashboardStats.totalSpend.toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Ads</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{dashboardStats.activeCount}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{dashboardStats.completedCount}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
           <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center"><Flag size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registry</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{dashboardStats.totalCampaigns}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-4">
              <div className="relative">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Subject..." className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 text-sm font-bold w-72" />
              </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900">
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Channel</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Subject</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Objective</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-center">Duration</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Budgeting</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Lifecycle</th>
                {!isViewer && <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-right">Ops</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCampaigns.map((camp) => (
                <tr key={camp.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                  <td className="px-8 py-8"><span className="text-[11px] font-black text-slate-900">{camp.platform}</span><p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{camp.media_type}</p></td>
                  <td className="px-8 py-8 max-w-xs"><p className="text-[11px] font-bold text-slate-700 leading-snug line-clamp-2">{camp.subject}</p></td>
                  <td className="px-8 py-8"><span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase border border-slate-200">{camp.primary_kpi}</span></td>
                  <td className="px-8 py-8 text-center"><span className="text-[11px] font-black text-slate-900">{calculateDuration(camp)} Days</span></td>
                  <td className="px-8 py-8"><span className="text-[11px] font-black text-emerald-600">${camp.spend} Spend</span><p className="text-[9px] font-bold text-slate-300 uppercase">Cap: ${camp.total_budget}</p></td>
                  <td className="px-8 py-8"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 w-fit ${getStatusStyle(camp.status)}`}>{camp.status}</span></td>
                  {!isViewer && (
                    <td className="px-8 py-8">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                         <Link to={`/ads/${camp.id}`} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Eye size={16}/></Link>
                         {isEditor && <button onClick={() => handleOpenModal(camp)} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-slate-900 rounded-xl transition-all shadow-sm"><Edit2 size={16}/></button>}
                         {isAdmin && <button onClick={() => handleDelete(camp.id)} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && isEditor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-100"><Megaphone size={28}/></div>
                  <div><h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingCamp ? 'Update Lifecycle' : 'New Ad Registry'}</h3></div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-10">
              {/* Form implementation remains same but logic check 'isEditor' added above */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="col-span-2 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Platform</label>
                        <select value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value as any }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                          <option value="Meta">Meta</option>
                          <option value="Google">Google</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Asset Format</label>
                        <select value={formData.media_type} onChange={e => setFormData(p => ({ ...p, media_type: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none">
                          <option>Image</option>
                          <option>Carousel</option>
                          <option>Video</option>
                          <option>Reel</option>
                        </select>
                      </div>
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Campaign Subject</label>
                      <input required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none" placeholder="e.g. Clearance Sale" />
                   </div>
                </div>
                <div className="space-y-6">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Ad Lifecycle Status</label>
                      <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as AdStatus }))} className="w-full px-5 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest outline-none cursor-pointer">
                        <option value="Planned">Planned</option>
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Completed">Completed</option>
                      </select>
                   </div>
                </div>
              </div>
              <div className="pt-10 border-t border-slate-50 flex gap-4">
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98]"><Save size={18}/> Authorize Update</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
