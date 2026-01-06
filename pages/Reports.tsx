
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, Cell as ReCell
} from 'recharts';
import { DBService } from '../services/dbService';
import { PostLog, Category } from '../types';
import { FileText, Download, Filter, Calendar, BarChart3, PieChart as PieIcon, TrendingUp, Award, Tags, Globe, Briefcase } from 'lucide-react';
import { CONTENT_TYPES, CONTENT_TAGS } from '../constants';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#475569'];

export const Reports: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().substring(0, 7));

  useEffect(() => {
    const fetchData = async () => {
      const [p, c] = await Promise.all([
        DBService.getPosts(),
        DBService.getCategories()
      ]);
      setPosts(p);
      setCategories(c);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(p => !filterMonth || p.month === filterMonth);
  }, [posts, filterMonth]);

  const categoryData = useMemo(() => {
    const mainCats = categories.filter(c => !c.parentId);
    return mainCats.map(cat => ({
      name: cat.name,
      count: filteredPosts.filter(p => p.main_category_id === cat.id).length
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredPosts, categories]);

  const contentTypeData = useMemo(() => {
    return CONTENT_TYPES.map(type => ({
      name: type,
      value: filteredPosts.filter(p => p.content_type === type).length
    })).filter(d => d.value > 0);
  }, [filteredPosts]);

  const tagData = useMemo(() => {
    return CONTENT_TAGS.map(tag => ({
      name: tag,
      count: filteredPosts.filter(p => p.content_tag === tag).length
    })).filter(d => d.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredPosts]);

  const brandData = useMemo(() => {
    const brandCounts: Record<string, number> = {};
    filteredPosts.forEach(p => {
      if (p.brand_type_id) {
        const name = categories.find(c => c.id === p.brand_type_id)?.name || 'Unknown';
        brandCounts[name] = (brandCounts[name] || 0) + 1;
      }
    });
    return Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredPosts, categories]);

  const statCard = (label: string, value: number | string, icon: React.ReactNode, color: string) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 group">
      <div className="flex items-center gap-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synthesizing Workspace Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
            <BarChart3 size={24} />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Performance Reports</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">
              Real-time workspace analytics and content flow distribution.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm transition-all hover:border-blue-200">
            <Calendar size={18} className="text-slate-400" />
            <input 
              type="month" 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-sm font-bold text-slate-700 outline-none bg-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-slate-200 active:scale-95">
            <Download size={18} /> Export PDF
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        {statCard("Active Post", filteredPosts.length, <FileText size={24} />, "bg-blue-50 text-blue-600")}
        {statCard("Categories", categoryData.length, <Award size={24} />, "bg-emerald-50 text-emerald-600")}
        {statCard("Content Tags", tagData.length, <TrendingUp size={24} />, "bg-amber-50 text-amber-600")}
        {statCard("Brand Reach", new Set(filteredPosts.map(p => p.brand_type_id)).size, <Globe size={24} />, "bg-purple-50 text-purple-600")}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Category Bar Chart - Horizontal for better readability with many items */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <BarChart3 className="text-blue-600" size={22}/> Content by Category
              </h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">High-level segment distribution</p>
            </div>
          </div>
          <div className="h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 11, fontWeight: 800}} 
                  width={140}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px'}}
                  itemStyle={{color: '#0f172a', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase'}}
                />
                <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={32}>
                  {categoryData.map((entry, index) => (
                    <ReCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Type Mix Pie Chart */}
        <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="mb-10">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <PieIcon className="text-emerald-500" size={22}/> Creative Mix
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Format usage percentage</p>
          </div>
          <div className="flex-1 min-h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contentTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={10}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {contentTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  layout="horizontal" 
                  iconType="circle" 
                  wrapperStyle={{paddingTop: '30px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#64748b'}} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Brand Focus - Horizontal Bar Chart */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] border border-slate-800 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                    <Briefcase className="text-blue-400" size={22}/> Top 10 Active Brands
                  </h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Brand penetration by post count</p>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} 
                      width={120} 
                    />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', color: '#f8fafc'}}
                      cursor={{fill: '#1e293b'}}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <TrendingUp className="text-amber-500" size={22}/> Strategy Heatmap
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Content tag frequency</p>
                </div>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tagData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} 
                      interval={0}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#f59e0b" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
