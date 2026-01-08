
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DBService } from '../services/dbService';
import { AdCampaignEntry } from '../types';
import { 
  ArrowLeft, Calendar, Clock, Target, DollarSign, 
  TrendingUp, Zap, BarChart3, 
  Info, Globe, Monitor, Activity, ShieldCheck
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

  const duration = useMemo(() => {
    if (!ad?.start_date) return 0;
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
  }, [ad]);

  const mockChartData = useMemo(() => {
    if (!ad) return [];
    const points = 7;
    const baseReach = Number(ad.reach) || 0;
    return Array.from({ length: points }).map((_, i) => ({
      name: `Day ${i + 1}`,
      val: Math.floor((baseReach / points) * (i + 1) * (0.8 + Math.random() * 0.4))
    }));
  }, [ad]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Matrix Intelligence...</p>
    </div>
  );

  if (!ad) return (
    <div className="p-20 text-center">
       <h2 className="text-2xl font-black text-slate-800">Entry Not Found</h2>
       <button onClick={() => navigate('/ads')} className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest">Return to Base</button>
    </div>
  );

  const costPerResult = ad.result && parseInt(ad.result) > 0 ? (ad.spend / parseInt(ad.result)) : 0;
  const budgetUtilization = ad.total_budget > 0 ? (ad.spend / ad.total_budget) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
         <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/ads')}
              className="w-14 h-14 bg-white border border-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
            >
               <ArrowLeft size={24} />
            </button>
            <div>
               <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter">{ad.subject}</h1>
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                    ad.status === 'Active' ? 'bg-blue-600 text-white' :
                    ad.status === 'Completed' ? 'bg-emerald-600 text-white' :
                    ad.status === 'Paused' ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                  }`}>{ad.status}</span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{ad.platform} Hub • {ad.id}</p>
            </div>
         </div>
         <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-100">
            <Activity size={32} />
         </div>
      </header>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-blue-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operating Duration</p>
           </div>
           <p className="text-4xl font-black text-slate-900 tracking-tight">{duration} <span className="text-lg text-slate-400">Days</span></p>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <DollarSign size={14} className="text-emerald-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency spend</p>
           </div>
           <p className="text-4xl font-black text-emerald-600 tracking-tight">${ad.spend.toLocaleString()}</p>
           <div className="w-full bg-slate-50 h-1.5 rounded-full mt-3 overflow-hidden">
             <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, budgetUtilization)}%` }}></div>
           </div>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <Target size={14} className="text-purple-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Results ({ad.primary_kpi})</p>
           </div>
           <p className="text-4xl font-black text-slate-900 tracking-tight">{ad.result || '0'}</p>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
           <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-amber-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cost/Result</p>
           </div>
           <p className="text-4xl font-black text-slate-900 tracking-tight">${costPerResult.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
             <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Reach Matrix</h3>
             <div className="flex gap-6">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total reach</p>
                   <p className="text-2xl font-black text-blue-600">{ad.reach?.toLocaleString()}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impressions</p>
                   <p className="text-2xl font-black text-slate-900">{ad.impression?.toLocaleString()}</p>
                </div>
             </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                <Area type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={4} fill="#3b82f610" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Campaign Blueprint</h4>
             <div className="space-y-6">
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Media Platform</span>
                   <span className="text-sm font-black">{ad.platform}</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Objective</span>
                   <span className="text-sm font-black">{ad.primary_kpi}</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Start Date</span>
                   <span className="text-sm font-black">{ad.start_date}</span>
                </div>
                {ad.status === 'Completed' && (
                  <div className="flex justify-between pb-4 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-400">End Date</span>
                    <span className="text-sm font-black text-emerald-400">{ad.end_date}</span>
                  </div>
                )}
             </div>
          </div>
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6 text-blue-600">
                <Info size={18} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Findings</h4>
             </div>
             <p className="text-sm font-bold text-slate-500 leading-relaxed italic">
               "{ad.other_effects || 'No supplemental qualitative findings recorded.'}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
