
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DBService } from '../services/dbService';
import { AdCampaignEntry, AdStatus, User, AdDailyMetric } from '../types';
import { 
  Megaphone, Plus, Trash2, Edit2, X, Save, 
  Search, Eye, CheckCircle2,
  Calendar, DollarSign, Activity, Flag,
  ShieldAlert, Globe, PlayCircle, PauseCircle, Clock,
  BarChart3, LayoutList, Target, TrendingUp, AlertCircle,
  Info, RotateCcw, Filter, PlusCircle, Calculator,
  Loader2, Check, RefreshCw, Layers, ClipboardPaste, Table as TableIcon
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const AdsCampaign: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AdCampaignEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRawData, setBulkRawData] = useState('');
  const [editingCamp, setEditingCamp] = useState<AdCampaignEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentYear = new Date().getFullYear().toString();
  const [filterMonth, setFilterMonth] = useState(currentYear);
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<AdCampaignEntry>>({
    platform: 'Meta',
    subject: '',
    media_type: 'Image',
    primary_kpi: 'Traffic',
    total_budget: 0,
    spend: 0,
    status: 'Planned',
    start_date: today,
    end_date: '',
    paused_date: '',
    result: '0',
    impression: 0,
    reach: 0,
    other_effects: '',
    daily_metrics: []
  });

  // Daily metric local form state
  const [metricDate, setMetricDate] = useState(today);
  const [metricReach, setMetricReach] = useState('');
  const [metricImpression, setMetricImpression] = useState('');
  const [metricResult, setMetricResult] = useState('');
  const [metricSpend, setMetricSpend] = useState('');

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

  const getDuration = (ad: Partial<AdCampaignEntry>) => {
    if (!ad.start_date) return 0;
    const start = new Date(ad.start_date);
    let end = new Date();

    if (ad.status === 'Completed' && ad.end_date) {
      end = new Date(ad.end_date);
    } else if (ad.status === 'Paused' && ad.paused_date) {
      end = new Date(ad.paused_date);
    } else if (ad.status === 'Planned' && ad.end_date) {
      end = new Date(ad.end_date);
    }

    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
      const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${datePart} at ${timePart}`;
    } catch (e) {
      return '--';
    }
  };

  // Parsing Logic for Bulk Data
  const parsedBulkItems = useMemo(() => {
    if (!bulkRawData.trim()) return [];
    
    const lines = bulkRawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const records: AdDailyMetric[] = [];
    let currentRecord: Partial<AdDailyMetric> | null = null;
    let numbersInBlock: number[] = [];
    let moneyInBlock: number | null = null;

    const finalizeRecord = () => {
      if (currentRecord && currentRecord.date) {
        records.push({
          date: currentRecord.date,
          result: numbersInBlock[0] || 0,
          reach: numbersInBlock[1] || 0,
          impression: numbersInBlock[2] || 0,
          spend: moneyInBlock || 0
        });
      }
    };

    lines.forEach(line => {
      // Date Check (YYYY-MM-DD)
      const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        finalizeRecord();
        currentRecord = { date: dateMatch[1] };
        numbersInBlock = [];
        moneyInBlock = null;
        return;
      }

      if (!currentRecord) return;

      // Filter out bracketed lines like [2]
      if (line.match(/^\[.*\]$/)) return;

      // Extract Money ($)
      const moneyMatch = line.match(/\$(\d+[\d,.]*)/);
      if (moneyMatch && moneyInBlock === null) {
        moneyInBlock = parseFloat(moneyMatch[1].replace(/,/g, ''));
        return;
      }

      // Extract Leading Numbers (handling commas and dashes)
      // We normalize dashes to 0
      let cleanedLine = line.replace(/^[—–-]$/, '0');
      const numberMatch = cleanedLine.match(/^([\d,.-]+)/);
      if (numberMatch) {
        const valStr = numberMatch[1].replace(/,/g, '');
        const val = valStr === '-' || valStr === '—' || valStr === '–' ? 0 : parseFloat(valStr);
        if (!isNaN(val)) {
          numbersInBlock.push(val);
        }
      }
    });

    finalizeRecord();
    return records;
  }, [bulkRawData]);

  const commitBulkData = () => {
    if (parsedBulkItems.length === 0) return;

    setFormData(prev => {
      // FIX: Explicitly type existing metrics and Map to avoid 'unknown' type inference errors
      const existing: AdDailyMetric[] = prev.daily_metrics || [];
      const metricsMap = new Map<string, AdDailyMetric>(existing.map(m => [m.date, m]));
      
      // Upsert: Overwrite if date exists
      parsedBulkItems.forEach(item => {
        metricsMap.set(item.date, item);
      });

      const updated = Array.from(metricsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      
      // Recalculate totals
      const totalReach = updated.reduce((acc, m) => acc + m.reach, 0);
      const totalImp = updated.reduce((acc, m) => acc + m.impression, 0);
      const totalResult = updated.reduce((acc, m) => acc + m.result, 0);
      const totalSpend = updated.reduce((acc, m) => acc + m.spend, 0);
      
      return { 
        ...prev, 
        daily_metrics: updated,
        reach: totalReach,
        impression: totalImp,
        result: totalResult.toString(),
        spend: totalSpend
      };
    });

    setBulkRawData('');
    setIsBulkModalOpen(false);
  };

  const handleOpenModal = (camp: AdCampaignEntry | null = null) => {
    if (isViewer) return;
    if (camp) {
      setEditingCamp(camp);
      setFormData({ ...camp, daily_metrics: camp.daily_metrics || [] });
    } else {
      setEditingCamp(null);
      setFormData({
        platform: 'Meta',
        subject: '',
        media_type: 'Image',
        primary_kpi: 'Traffic',
        total_budget: 0,
        spend: 0,
        status: 'Planned',
        start_date: today,
        end_date: '',
        paused_date: '',
        result: '0',
        impression: 0,
        reach: 0,
        other_effects: '',
        daily_metrics: []
      });
    }
    setIsModalOpen(true);
  };

  const addDailyMetric = () => {
    if (!metricDate) return;
    const newMetric: AdDailyMetric = {
      date: metricDate,
      reach: parseInt(metricReach) || 0,
      impression: parseInt(metricImpression) || 0,
      result: parseInt(metricResult) || 0,
      spend: parseFloat(metricSpend) || 0
    };
    setFormData(prev => {
      const existing = prev.daily_metrics || [];
      const filtered = existing.filter(m => m.date !== metricDate);
      const updated = [...filtered, newMetric].sort((a, b) => a.date.localeCompare(b.date));
      const totalReach = updated.reduce((acc, m) => acc + m.reach, 0);
      const totalImp = updated.reduce((acc, m) => acc + m.impression, 0);
      const totalResult = updated.reduce((acc, m) => acc + m.result, 0);
      const totalSpend = updated.reduce((acc, m) => acc + m.spend, 0);
      return { 
        ...prev, 
        daily_metrics: updated,
        reach: totalReach,
        impression: totalImp,
        result: totalResult.toString(),
        spend: totalSpend
      };
    });
    setMetricReach('');
    setMetricImpression('');
    setMetricResult('');
    setMetricSpend('');
    setMetricDate(today);
  };

  const editDailyMetric = (metric: AdDailyMetric) => {
    setMetricDate(metric.date);
    setMetricResult(metric.result.toString());
    setMetricReach(metric.reach.toString());
    setMetricImpression(metric.impression.toString());
    setMetricSpend(metric.spend.toString());
  };

  const removeDailyMetric = (date: string) => {
    setFormData(prev => {
      const updated = (prev.daily_metrics || []).filter(m => m.date !== date);
      const totalReach = updated.reduce((acc, m) => acc + m.reach, 0);
      const totalImp = updated.reduce((acc, m) => acc + m.impression, 0);
      const totalResult = updated.reduce((acc, m) => acc + m.result, 0);
      const totalSpend = updated.reduce((acc, m) => acc + m.spend, 0);
      return { 
        ...prev, 
        daily_metrics: updated,
        reach: totalReach,
        impression: totalImp,
        result: totalResult.toString(),
        spend: totalSpend
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer || isSaving) return;
    setIsSaving(true);
    try {
      const currentDuration = getDuration(formData);
      const results = parseInt(formData.result || '0');
      const cpr = results > 0 ? (Number(formData.spend) / results) : 0;
      const campToSave: AdCampaignEntry = {
        ...formData,
        platform: formData.platform || 'Meta',
        subject: formData.subject || '',
        media_type: formData.media_type || 'Image',
        primary_kpi: formData.primary_kpi || 'Traffic',
        planned_duration: currentDuration,
        cost_per_result: Number(cpr.toFixed(2)),
        total_budget: Number(formData.total_budget) || 0,
        spend: Number(formData.spend) || 0,
        reach: Number(formData.reach) || 0,
        impression: Number(formData.impression) || 0,
        result: formData.result || '0',
        status: formData.status as AdStatus,
        id: editingCamp ? editingCamp.id : `C-${Math.floor(1000 + Math.random() * 9000)}`,
        daily_metrics: formData.daily_metrics || [],
        last_updated_at: new Date().toISOString()
      } as AdCampaignEntry;
      await DBService.saveAdsCampaign(campToSave);
      await new Promise(r => setTimeout(r, 500));
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Database sync failed. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !deleteConfirmId) return;
    await DBService.deleteAdsCampaign(deleteConfirmId);
    setDeleteConfirmId(null);
    fetchData();
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = searchTerm === '' || 
        c.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.platform?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMonth = !filterMonth || (c.start_date && c.start_date.startsWith(filterMonth));
      return matchSearch && matchMonth;
    });
  }, [campaigns, searchTerm, filterMonth]);

  const stats = useMemo(() => {
    const totalSpend = filteredCampaigns.reduce((acc, c) => acc + (Number(c.spend) || 0), 0);
    const activeCount = filteredCampaigns.filter(c => c.status === 'Active').length;
    const completedCount = filteredCampaigns.filter(c => c.status === 'Completed').length;
    return { totalSpend, activeCount, completedCount, total: filteredCampaigns.length };
  }, [filteredCampaigns]);

  const inputClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-bold text-[13px] text-slate-700 transition-all";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 block ml-1";
  const isFullYearView = filterMonth.length === 4;

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Workspace...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Megaphone size={22} /></div>
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Ads Campaign</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">
              Tracking performance for <span className="text-blue-600 font-black">{isFullYearView ? `Year ${filterMonth}` : `Period ${filterMonth}`}</span>.
            </p>
          </div>
        </div>
        {isEditor && (
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95">
            <Plus size={18} strokeWidth={3} /> Initialize Ad
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><DollarSign size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{isFullYearView ? 'Yearly Spend' : 'Monthly Spend'}</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">${stats.totalSpend.toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><Activity size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.activeCount}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-200 transition-all">
           <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><CheckCircle2 size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.completedCount}</p>
           </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-slate-200 transition-all">
           <div className="w-14 h-14 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all"><Flag size={24} /></div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Total</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden mx-2">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-wrap items-center gap-6">
           <div className="relative group flex-1 max-w-md">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search Campaign Subject..." className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 text-sm font-bold shadow-sm" />
           </div>

           <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm transition-all hover:border-blue-200">
                <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
                   <Filter size={14} className="text-blue-500" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                     {isFullYearView ? 'Full Year' : 'Monthly'}
                   </span>
                </div>
                <Calendar size={18} className="text-slate-400" />
                <input 
                  type="month" 
                  value={isFullYearView ? '' : filterMonth} 
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                />
                {!isFullYearView && (
                  <button 
                    onClick={() => setFilterMonth(currentYear)} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all ml-2"
                  >
                    <RotateCcw size={12} /> This Year
                  </button>
                )}
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
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Start Date</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-center">Duration</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Budgeting</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-center">Lifecycle</th>
                <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest">Update Log</th>
                {!isViewer && <th className="px-8 py-5 text-[9px] font-black text-white uppercase tracking-widest text-right">Operations</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCampaigns.map((camp) => (
                <tr key={camp.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                  <td className="px-8 py-8">
                    <span className="text-[11px] font-black text-slate-900">{camp.platform}</span>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{camp.media_type}</p>
                  </td>
                  <td className="px-8 py-8 max-w-xs">
                    <p className="text-[11px] font-bold text-slate-700 leading-tight line-clamp-2">{camp.subject}</p>
                  </td>
                  <td className="px-8 py-8">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase border border-slate-200">{camp.primary_kpi}</span>
                  </td>
                  <td className="px-8 py-8">
                    <span className="text-[11px] font-black text-slate-900">{camp.start_date}</span>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className="text-[11px] font-black text-slate-900">{getDuration(camp)} Days</span>
                    <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{camp.status === 'Planned' ? 'Estimated' : 'Active'}</p>
                  </td>
                  <td className="px-8 py-8">
                    <span className={`text-[11px] font-black ${camp.status === 'Planned' ? 'text-slate-300' : 'text-emerald-600'}`}>
                      {camp.status === 'Planned' ? '$0.00' : `$${camp.spend.toLocaleString()} Spent`}
                    </span>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">Cap: ${camp.total_budget.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${
                      camp.status === 'Active' ? 'bg-blue-600 text-white' :
                      camp.status === 'Completed' ? 'bg-emerald-600 text-white' :
                      camp.status === 'Paused' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-2 text-blue-500/80">
                      <RefreshCw size={10} className="shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                        {formatTimestamp(camp.last_updated_at)}
                      </span>
                    </div>
                  </td>
                  {!isViewer && (
                    <td className="px-8 py-8">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                         <Link to={`/ads/${camp.id}`} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-blue-600 rounded-xl transition-all shadow-sm"><Eye size={16}/></Link>
                         {isEditor && <button onClick={() => handleOpenModal(camp)} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-slate-900 rounded-xl transition-all shadow-sm"><Edit2 size={16}/></button>}
                         {isAdmin && <button onClick={() => setDeleteConfirmId(camp.id)} className="p-2.5 bg-white border border-slate-100 text-slate-300 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={16}/></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredCampaigns.length === 0 && (
                <tr>
                   <td colSpan={9} className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                         <LayoutList size={48} />
                         <p className="text-xs font-black uppercase tracking-[0.3em]">No records found for {isFullYearView ? `Year ${filterMonth}` : `Month ${filterMonth}`}</p>
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
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
               <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-100"><Megaphone size={28}/></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingCamp ? 'Transition Lifecycle' : 'Initial Planning'}</h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Status: {formData.status}</p>
                  </div>
               </div>
               <button onClick={() => !isSaving && setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-10 overflow-y-auto max-h-[75vh] custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div>
                    <label className={labelClass}>Operating Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value as AdStatus }))} 
                      className={`${inputClass} !bg-slate-900 !text-white`}
                    >
                      {!editingCamp && <option value="Planned">Planned (New)</option>}
                      {editingCamp && (
                        <>
                          <option value="Planned">Planned</option>
                          <option value="Active">Active</option>
                          <option value="Paused">Paused</option>
                          <option value="Completed">Completed</option>
                        </>
                      )}
                    </select>
                 </div>
                 <div className="md:col-span-2">
                    <label className={labelClass}>Campaign Subject</label>
                    <input required value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} className={inputClass} placeholder="e.g. SONOS Roam 2 Launch Phase 1" />
                 </div>
                 <div>
                    <label className={labelClass}>Platform Hub</label>
                    <select value={formData.platform} onChange={e => setFormData(p => ({ ...p, platform: e.target.value as any }))} className={inputClass}>
                      <option value="Meta">Meta</option>
                      <option value="Google">Google</option>
                      <option value="Others">Others</option>
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Primary KPI</label>
                    <select value={formData.primary_kpi} onChange={e => setFormData(p => ({ ...p, primary_kpi: e.target.value }))} className={inputClass}>
                      <option value="Traffic">Traffic (Clicks)</option>
                      <option value="Sale">Conversion (Sales)</option>
                      <option value="Engagement">Engagement</option>
                      <option value="Lead Gen">Lead Generation</option>
                      <option value="Awareness">Reach / Awareness</option>
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Content Format</label>
                    <select value={formData.media_type} onChange={e => setFormData(p => ({ ...p, media_type: e.target.value }))} className={inputClass}>
                      <option>Image</option>
                      <option>Carousel</option>
                      <option>Video</option>
                      <option>Reel</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-50">
                 <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-blue-600" />
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Timeline & Budget</h4>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                       <label className={labelClass}>Launch Date</label>
                       <input type="date" required value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} className={inputClass} />
                    </div>
                    {formData.status === 'Completed' ? (
                       <div>
                        <label className={`${labelClass} text-emerald-600`}>Actual End Date</label>
                        <input type="date" required value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} className={`${inputClass} bg-emerald-50 border-emerald-100`} />
                      </div>
                    ) : formData.status === 'Paused' ? (
                      <div>
                        <label className={`${labelClass} text-amber-500`}>Paused On</label>
                        <input type="date" required value={formData.paused_date} onChange={e => setFormData(p => ({ ...p, paused_date: e.target.value }))} className={`${inputClass} bg-amber-50 border-amber-100`} />
                      </div>
                    ) : (
                      <div>
                        <label className={labelClass}>Estimated End Date</label>
                        <input type="date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} className={inputClass} />
                      </div>
                    )}
                    <div>
                       <label className={labelClass}>Total Project Budget ($)</label>
                       <input type="number" step="0.01" required value={formData.total_budget} onChange={e => setFormData(p => ({ ...p, total_budget: Number(e.target.value) }))} className={inputClass} />
                    </div>
                 </div>
              </div>

              {formData.status !== 'Planned' && (
                <div className="space-y-10 pt-8 border-t border-slate-50 animate-in slide-in-from-top-4">
                   <div className="flex items-center gap-3">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Performance Feed (Daily Metrics)</h4>
                   </div>
                   
                   <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                         <div>
                            <label className={labelClass}>Select Date</label>
                            <input type="date" value={metricDate} onChange={e => setMetricDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm" />
                         </div>
                         <div>
                            <label className={labelClass}>Results</label>
                            <input type="text" value={metricResult} onChange={e => setMetricResult(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm" placeholder="QTY" />
                         </div>
                         <div>
                            <label className={labelClass}>Reach</label>
                            <input type="text" value={metricReach} onChange={e => setMetricReach(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm" placeholder="Unique" />
                         </div>
                         <div>
                            <label className={labelClass}>Impressions</label>
                            <input type="text" value={metricImpression} onChange={e => setMetricImpression(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm" placeholder="Views" />
                         </div>
                         <div>
                            <label className={labelClass}>Spend ($)</label>
                            <input type="text" value={metricSpend} onChange={e => setMetricSpend(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm" placeholder="Cost" />
                         </div>
                      </div>
                      <div className="flex justify-end pt-2 gap-3">
                        <button 
                           type="button" 
                           onClick={() => setIsBulkModalOpen(true)}
                           className="px-6 py-3.5 bg-white border border-slate-200 text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-95 transition-all"
                         >
                           <ClipboardPaste size={14} /> BULK Entry
                         </button>
                        <button type="button" onClick={addDailyMetric} className="px-10 py-3.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                           <PlusCircle size={14} /> Commit Entry
                         </button>
                      </div>

                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                         {(formData.daily_metrics || []).map((m, idx) => (
                           <div key={idx} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl animate-in slide-in-from-right-4 group">
                              <div className="flex items-center gap-8">
                                 <div className="flex items-center gap-3 min-w-[110px]">
                                    <Calendar size={14} className="text-blue-500" />
                                    <span className="text-[11px] font-black text-slate-900">{m.date}</span>
                                 </div>
                                 <div className="grid grid-cols-4 gap-6 min-w-[420px]">
                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Results</span><span className="text-xs font-black text-purple-600">{m.result.toLocaleString()}</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reach</span><span className="text-xs font-black text-emerald-600">{m.reach.toLocaleString()}</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Impr.</span><span className="text-xs font-black text-blue-600">{m.impression.toLocaleString()}</span></div>
                                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Spend</span><span className="text-xs font-black text-slate-900">${m.spend.toLocaleString()}</span></div>
                                 </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button type="button" onClick={() => editDailyMetric(m)} className="p-2 text-slate-300 hover:text-blue-600 transition-colors" title="Edit day data"><Edit2 size={14} /></button>
                                <button type="button" onClick={() => removeDailyMetric(m.date)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Delete day record"><Trash2 size={16} /></button>
                              </div>
                           </div>
                         ))}
                         {(!formData.daily_metrics || formData.daily_metrics.length === 0) && (
                           <div className="py-10 text-center bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matrix logs captured. Add daily metrics to sync totals.</p>
                           </div>
                         )}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl group transition-all hover:bg-emerald-100">
                        <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 block flex items-center gap-1"><Calculator size={10}/> Total Spend</label>
                        <p className="text-2xl font-black text-emerald-700">${formData.spend?.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">Calculated From Logs</p>
                      </div>
                      <div className="p-6 bg-purple-50 border border-purple-100 rounded-3xl relative group transition-all hover:bg-purple-100">
                        <label className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1 block">Net Results</label>
                        <input type="number" value={formData.result} onChange={e => setFormData(p => ({ ...p, result: e.target.value }))} className={`w-full bg-transparent text-2xl font-black text-purple-700 outline-none border-none p-0 ${formData.daily_metrics?.length ? 'pointer-events-none opacity-100' : ''}`} readOnly={(formData.daily_metrics?.length || 0) > 0} />
                        {(formData.daily_metrics?.length || 0) > 0 && <span className="absolute bottom-2 right-4 text-[7px] font-black text-purple-300 uppercase tracking-tighter">Auto-Sync</span>}
                      </div>
                      <div className="p-6 bg-slate-900 rounded-3xl col-span-2 flex items-center justify-between text-white shadow-xl shadow-slate-200">
                         <div className="flex flex-col"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reach</span><span className="text-2xl font-black">{formData.reach?.toLocaleString()}</span></div>
                         <div className="flex flex-col text-right"><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Impressions</span><span className="text-2xl font-black">{formData.impression?.toLocaleString()}</span></div>
                      </div>
                   </div>

                   <div>
                      <label className={labelClass}>Insight Log / Performance Notes</label>
                      <textarea value={formData.other_effects} onChange={e => setFormData(p => ({ ...p, other_effects: e.target.value }))} className={`${inputClass} min-h-[120px] py-4 resize-none`} placeholder="Trends, demographic insights, creative wins..." />
                   </div>
                </div>
              )}

              <div className="pt-10 border-t border-slate-50 flex gap-4">
                <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? <><Loader2 size={18} className="animate-spin" />Syncing...</> : <><Save size={18}/>Commit Log</>}
                </button>
                <button type="button" disabled={isSaving} onClick={() => setIsModalOpen(false)} className="px-12 py-5 bg-slate-50 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors disabled:opacity-50">Abort</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Entry Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95">
             <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ClipboardPaste size={24}/></div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Bulk Performance Ingestion</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Parse multiple daily metrics at once</p>
                   </div>
                </div>
                <button onClick={() => setIsBulkModalOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"><X size={20}/></button>
             </div>
             
             <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Raw Input Data</label>
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">
                        <Check size={10} /> Auto-Overwrite ON
                      </div>
                   </div>
                   <textarea 
                     value={bulkRawData}
                     onChange={(e) => setBulkRawData(e.target.value)}
                     className="w-full h-[400px] p-6 bg-slate-50 border border-slate-100 rounded-3xl font-mono text-[11px] leading-relaxed text-slate-600 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all resize-none"
                     placeholder="Paste raw content here...&#10;2026-01-21&#10;98&#10;[2]&#10;Follows or likes&#10;10,685&#10;11,701&#10;$2.83"
                   />
                </div>

                <div className="space-y-4 flex flex-col">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <TableIcon size={12} className="text-blue-500"/> Ingestion Preview
                   </label>
                   <div className="flex-1 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden flex flex-col">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="bg-slate-900 sticky top-0">
                               <tr>
                                  <th className="px-4 py-3 text-[8px] font-black text-white uppercase">Date</th>
                                  <th className="px-4 py-3 text-[8px] font-black text-white uppercase text-center">Res</th>
                                  <th className="px-4 py-3 text-[8px] font-black text-white uppercase text-center">Reach</th>
                                  <th className="px-4 py-3 text-[8px] font-black text-white uppercase text-center">Impr</th>
                                  <th className="px-4 py-3 text-[8px] font-black text-white uppercase text-center">Spend</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                               {parsedBulkItems.map((item, idx) => (
                                 <tr key={idx} className="bg-white">
                                    <td className="px-4 py-2.5 text-[10px] font-bold text-slate-900">{item.date}</td>
                                    <td className="px-4 py-2.5 text-[10px] font-black text-purple-600 text-center">{item.result.toLocaleString()}</td>
                                    <td className="px-4 py-2.5 text-[10px] font-black text-emerald-600 text-center">{item.reach.toLocaleString()}</td>
                                    <td className="px-4 py-2.5 text-[10px] font-black text-blue-600 text-center">{item.impression.toLocaleString()}</td>
                                    <td className="px-4 py-2.5 text-[10px] font-black text-slate-900 text-center">${item.spend.toLocaleString()}</td>
                                 </tr>
                               ))}
                               {parsedBulkItems.length === 0 && (
                                 <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                       <div className="flex flex-col items-center gap-3 opacity-20">
                                          <LayoutList size={32} />
                                          <p className="text-[9px] font-black uppercase tracking-widest">Awaiting Valid Input</p>
                                       </div>
                                    </td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>
             </div>

             <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex gap-4">
                <button 
                  onClick={commitBulkData}
                  disabled={parsedBulkItems.length === 0}
                  className="flex-1 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18}/> Commit {parsedBulkItems.length} Records
                </button>
                <button onClick={() => setIsBulkModalOpen(false)} className="px-10 py-5 bg-white border border-slate-200 text-slate-400 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:text-slate-900">Cancel</button>
             </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={!!deleteConfirmId} title="Purge Campaign?" message="Permanently remove this campaign registry? This action is irreversible." onConfirm={handleDelete} onCancel={() => setDeleteConfirmId(null)} />
    </div>
  );
};
