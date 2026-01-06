
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DBService } from '../services/dbService';
import { AdCampaignEntry } from '../types';
import { 
  ArrowLeft, Calendar, Clock, Target, DollarSign, 
  TrendingUp, Zap, Play, Pause, Square, BarChart3, Info
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export const AdDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ad, setAd] = useState<AdCampaignEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      DBService.getAdsCampaignById(id).then(data => {
        setAd(data);
        setLoading(false);
      });
    }
  }, [id]);

  const calculateDuration = (ad: AdCampaignEntry) => {
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
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-100';
      case 'Active': return 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-100';
      case 'Paused': return 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-100';
      default: return 'bg-slate-400 text-white border-slate-500 shadow-lg shadow-slate-100';
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harvesting Analytics...</p>
    </div>
  );

  if (!ad) return (
    <div className="p-20 text-center">
       <h2 className="text-2xl font-black text-slate-800">Ad Registry Not Found</h2>
       <button onClick={() => navigate('/ads')} className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest">Return to Management</button>
    </div>
  );

  const duration = calculateDuration(ad);
  const costPerResult = ad.result && parseInt(ad.result) > 0 ? (ad.spend / parseInt(ad.result)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/ads')}
              className="w-14 h-14 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm hover:shadow-xl hover:-translate-x-1"
            >
               <ArrowLeft size={24} />
            </button>
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{ad.subject}</h1>
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(ad.status)}`}>{ad.status}</span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{ad.platform} • REF: {ad.id}</p>
            </div>
         </div>
         <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-100">
            <BarChart3 size={32} />
         </div>
      </header>

      {/* Analytics KPI Dashboard */}
      <div className="grid grid-cols-4 gap-8">
        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-blue-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ad Lifespan</p>
           </div>
           <p className="text-4xl font-black text-slate-900 tracking-tight">{duration} Days</p>
           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Reference Tracked</p>
        </div>
        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-3">
              <Target size={14} className="text-purple-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Result</p>
           </div>
           <p className="text-4xl font-black text-slate-900 tracking-tight">{ad.result || '0'}</p>
           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">{ad.primary_kpi} optimization</p>
        </div>
        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-3">
              <DollarSign size={14} className="text-emerald-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Spend</p>
           </div>
           <p className="text-4xl font-black text-emerald-600 tracking-tight">${ad.spend || '0'}</p>
           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Budget: ${ad.total_budget}</p>
        </div>
        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-amber-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost/Result</p>
           </div>
           <p className="text-4xl font-black text-slate-900 tracking-tight">${costPerResult ? costPerResult.toFixed(3) : '0.00'}</p>
           <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Efficiency Score</p>
        </div>
      </div>

      {/* Visual Timeline Section */}
      <div className="bg-slate-900 p-12 rounded-[4rem] space-y-10 border border-slate-800 shadow-2xl">
         <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
            <Clock size={18} /> Ad Lifecycle Progression
         </h4>
         <div className="relative pt-6">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2"></div>
            <div className="flex justify-between relative">
               <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-slate-800 border-4 border-slate-900 rounded-2xl flex items-center justify-center text-slate-500 mb-4 shadow-xl"><Calendar size={18}/></div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Planned</p>
               </div>
               <div className={`flex flex-col items-center transition-all ${ad.start_date ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-xl border-4 border-slate-900 ${ad.start_date ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}><Play size={18}/></div>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Active</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">{ad.start_date || 'Pending'}</p>
               </div>
               <div className={`flex flex-col items-center transition-all ${ad.status === 'Paused' ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-xl border-4 border-slate-900 ${ad.status === 'Paused' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-600'}`}><Pause size={18}/></div>
                  <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Paused</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">{ad.paused_date || 'N/A'}</p>
               </div>
               <div className={`flex flex-col items-center transition-all ${ad.status === 'Completed' ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-xl border-4 border-slate-900 ${ad.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-600'}`}><Square size={16}/></div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Completed</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">{ad.end_date || 'Awaiting'}</p>
               </div>
            </div>
         </div>
      </div>

      {/* Secondary Metrics & ROI */}
      <div className="grid grid-cols-2 gap-10">
        <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-8">
           <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
             <TrendingUp size={20} className="text-blue-600"/> Awareness Metrics
           </h4>
           <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Impressions</p>
                 <p className="text-3xl font-black text-slate-900 tracking-tight">{ad.impression?.toLocaleString() || '0'}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unique Reach</p>
                 <p className="text-3xl font-black text-slate-900 tracking-tight">{ad.reach?.toLocaleString() || '0'}</p>
              </div>
           </div>
           <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[
                   { name: 'Start', val: 0 },
                   { name: 'Mid', val: (ad.impression || 0) * 0.4 },
                   { name: 'End', val: ad.impression || 0 }
                 ]}>
                    <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#3b82f620" strokeWidth={5} />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] shadow-sm flex flex-col">
           <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-8">System Summary</h4>
           <div className="space-y-6 flex-1">
              <div className="flex justify-between items-center py-4 border-b border-slate-200">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Media Format</span>
                 <span className="text-sm font-black text-slate-900">{ad.media_type}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-slate-200">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Conversion Type</span>
                 <span className="text-sm font-black text-slate-900">{ad.primary_kpi}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-slate-200">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Yield ROI</span>
                 <span className="text-sm font-black text-blue-600">{ad.total_budget ? ((ad.spend / ad.total_budget) * 100).toFixed(1) : 0}% Utilized</span>
              </div>
              <div className="p-6 bg-white rounded-3xl border border-slate-200 mt-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={12}/> Analysis Notes</p>
                 <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{ad.other_effects || 'No supplemental performance notes captured for this ad lifecycle.'}"</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
