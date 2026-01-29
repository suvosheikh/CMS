
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DBService } from '../services/dbService';
import { AdCampaignEntry } from '../types';
import { 
  ArrowLeft, Calendar, Clock, Target, DollarSign, 
  TrendingUp, Zap, BarChart3, 
  Info, Globe, Monitor, Activity, ShieldCheck,
  Eye, MousePointer2, UserCheck, Layers, BarChart,
  Hash, RefreshCw, Award, FileText, Briefcase
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

  const chartData = useMemo(() => {
    if (!ad || !ad.daily_metrics || ad.daily_metrics.length === 0) return [];
    
    return ad.daily_metrics
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        name: m.date,
        reach: m.reach,
        impression: m.impression,
        result: parseInt(m.result.toString()),
        spend: m.spend
      }));
  }, [ad]);

  const formatTimestamp = (iso?: string) => {
    if (!iso) return 'Pending First Sync';
    try {
      const d = new Date(iso);
      const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
      const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${datePart} at ${timePart}`;
    } catch (e) {
      return 'Sync Error';
    }
  };

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
               <div className="flex items-center gap-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{ad.platform} Hub • {ad.id}</p>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${ad.boosting_by === 'Agency' ? 'text-red-500' : 'text-blue-500'}`}>{ad.boosting_by} Boosting</span>
               </div>
            </div>
         </div>
         <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-100">
            <Activity size={32} />
         </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group hover:border-purple-200 transition-all">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Target size={14} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Results</p>
           </div>
           <p className="text-3xl font-black text-slate-900 tracking-tight">{parseInt(ad.result || '0').toLocaleString()}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{ad.primary_kpi}</p>
        </div>

        <div className="p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group hover:border-emerald-200 transition-all">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><UserCheck size={14} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reach</p>
           </div>
           <p className="text-3xl font-black text-slate-900 tracking-tight">{ad.reach?.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Unique Audience</p>
        </div>

        <div className="p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group hover:border-blue-200 transition-all">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Eye size={14} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Impressions</p>
           </div>
           <p className="text-3xl font-black text-slate-900 tracking-tight">{ad.impression?.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Total Frequency</p>
        </div>

        <div className="p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group hover:border-slate-900 transition-all">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-900 text-white rounded-xl group-hover:bg-emerald-600 transition-all"><DollarSign size={14} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Spent</p>
           </div>
           <p className="text-3xl font-black text-slate-900 tracking-tight">${ad.spend.toLocaleString()}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">{budgetUtilization.toFixed(1)}% of Budget</p>
        </div>

        <div className="p-7 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group hover:border-amber-400 transition-all">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all"><Zap size={14} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost per Result</p>
           </div>
           <p className="text-3xl font-black text-slate-900 tracking-tight">${costPerResult.toFixed(4)}</p>
           <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Performance Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
             <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-600" size={20}/>
                <h3 className="text-xl font-black text-[#0f172a] tracking-tight">Performance Flow Matrix</h3>
             </div>
             <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase">Impr.</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase">Reach</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase">Results</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase">Spend</span>
                </div>
             </div>
          </div>
          <div className="h-[400px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                    labelStyle={{fontWeight: 'black', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px'}}
                    itemStyle={{fontWeight: '900', fontSize: '11px'}}
                  />
                  <Area type="monotone" dataKey="impression" stroke="#3b82f6" strokeWidth={4} fill="#3b82f608" name="Impressions" />
                  <Area type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={4} fill="#10b98108" name="Reach" />
                  <Area type="monotone" dataKey="result" stroke="#a855f7" strokeWidth={4} fill="#a855f708" name="Results" />
                  <Area type="monotone" dataKey="spend" stroke="#f59e0b" strokeWidth={4} fill="#f59e0b08" name="Spend ($)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300">
                <BarChart3 size={48} className="mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Zero daily metrics logged for this asset.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-slate-200">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2"><Layers size={12}/> Asset Configuration</h4>
             <div className="space-y-6">
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400">Target Brand</span>
                   </div>
                   <span className="text-sm font-black text-amber-400">{ad.brand || 'No Brand Linked'}</span>
                </div>
                {ad.boosting_by === 'Agency' && ad.work_order_no && (
                   <div className="flex justify-between pb-4 border-b border-slate-800 animate-in slide-in-from-top-2">
                      <span className="text-xs font-bold text-slate-400">Work Order No</span>
                      <span className="text-sm font-black text-red-400">{ad.work_order_no}</span>
                   </div>
                )}
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Media Platform</span>
                   <span className="text-sm font-black">{ad.platform} ({ad.boosting_by})</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Main Objective</span>
                   <span className="text-sm font-black">{ad.primary_kpi}</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Operation Duration</span>
                   <span className="text-sm font-black">{duration} Days</span>
                </div>
                <div className="flex justify-between pb-4 border-b border-slate-800">
                   <span className="text-xs font-bold text-slate-400">Budget Cap</span>
                   <span className="text-sm font-black text-emerald-400">${ad.total_budget.toLocaleString()}</span>
                </div>
                
                <div className="flex items-start gap-4 pt-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
                   <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                      <RefreshCw size={18} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] mb-1">Last Update Log</span>
                      <span className="text-xs font-black text-blue-400 leading-none">
                         {formatTimestamp(ad.last_updated_at)}
                      </span>
                   </div>
                </div>
             </div>
          </div>
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6 text-blue-600">
                <Info size={18} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">Production Findings</h4>
             </div>
             <p className="text-sm font-bold text-slate-500 leading-relaxed italic">
               "{ad.other_effects || 'No supplemental qualitative findings have been recorded for this asset yet.'}"
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
