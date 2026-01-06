
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DBService } from '../services/dbService';
import { PostLog, Category, AdCampaignEntry } from '../types';
import { MoreHorizontal, Activity, ChevronRight, LayoutDashboard } from 'lucide-react';

const DonutCard: React.FC<{ 
  label: string, 
  value: string | number, 
  percentage: number, 
  color: string, 
  subLabel: string,
  exploreTo?: string
}> = ({ label, value, percentage, color, subLabel, exploreTo }) => (
  <div className="bg-white p-8 pb-10 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col relative overflow-hidden h-full group transition-all hover:shadow-xl hover:shadow-slate-200/50">
    {/* Card Header */}
    <div className="w-full flex justify-between items-center mb-6">
      <h4 className="text-[14px] font-black text-blue-600 tracking-tight">{label}</h4>
      <MoreHorizontal size={14} className="text-slate-200" />
    </div>

    {/* Donut Section */}
    <div className="relative w-36 h-36 mb-10 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value: percentage }, { value: 100 - percentage }]}
            innerRadius={45} outerRadius={55} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270} stroke="none"
          >
            <Cell fill={color} />
            <Cell fill={`${color}10`} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black text-blue-600">{percentage}%</span>
      </div>
    </div>

    {/* Card Footer Info */}
    <div className="flex justify-between items-end w-full mt-auto">
      <div className="text-left">
        <p className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mt-2">{subLabel}</p>
      </div>
      
      {exploreTo && (
        <Link 
          to={exploreTo} 
          className="flex items-center gap-1 text-blue-600 font-black text-[11px] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
        >
          Explore <ChevronRight size={14} strokeWidth={3} />
        </Link>
      )}
    </div>
    
    {/* Bottom Accent Bar */}
    <div className={`absolute bottom-0 left-0 right-0 h-1.5`} style={{ backgroundColor: color }}></div>
  </div>
);

const ProgressCard: React.FC<{ 
  title: string, 
  items: { label: string, value: number, color: string }[], 
  total: number 
}> = ({ title, items, total }) => (
  <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col h-full">
    <div className="flex justify-between items-center mb-10">
      <h4 className="text-[13px] font-black text-slate-800 tracking-tight">{title}</h4>
      <MoreHorizontal size={14} className="text-slate-200" />
    </div>

    <div className="space-y-6 flex-1">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between gap-6">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-24 truncate">{item.label}</span>
          <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000" 
              style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%`, backgroundColor: item.color }}
            />
          </div>
          <span className="text-[11px] font-black text-slate-900 w-8 text-right">{item.value}</span>
        </div>
      ))}
    </div>

    <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-center">
      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{total} Entries Total</span>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [ads, setAds] = useState<AdCampaignEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      DBService.getPosts(), 
      DBService.getCategories(),
      DBService.getAdsCampaigns()
    ]).then(([p, c, a]) => {
      setPosts(p);
      setCategories(c);
      setAds(a);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const published = posts.filter(p => p.status === 'Published').length;
    const designed = posts.filter(p => p.status === 'Designed').length;
    const plannedPosts = posts.filter(p => p.status === 'Planned').length;

    const healthPercent = totalPosts > 0 ? Math.round((published / totalPosts) * 100) : 0;
    
    // Ads Spend Calculations
    const totalAdsSpend = ads.reduce((acc, c) => acc + (Number(c.spend) || 0), 0);
    const totalAdsBudget = ads.reduce((acc, c) => acc + (Number(c.total_budget) || 0), 0);
    const spendPercent = totalAdsBudget > 0 ? Math.round((totalAdsSpend / totalAdsBudget) * 100) : 0;

    const activeCategories = new Set(posts.map(p => p.main_category_id)).size;
    const catPercent = categories.length > 0 ? Math.round((activeCategories / categories.length) * 100) : 0;

    const creativeTypes = {
      Static: posts.filter(p => p.content_type === 'Static').length,
      Carousel: posts.filter(p => p.content_type === 'Carousel').length,
      Reels: posts.filter(p => p.content_type === 'Reel').length,
      Video: posts.filter(p => p.content_type === 'Video').length,
      Others: posts.filter(p => !['Static', 'Carousel', 'Reel', 'Video'].includes(p.content_type)).length,
    };

    const tags = {
      Offer: posts.filter(p => p.content_tag === 'Offer').length,
      Highlight: posts.filter(p => p.content_tag === 'Feature Highlight').length,
      Review: posts.filter(p => p.content_tag === 'Review').length,
      Tips: posts.filter(p => p.content_tag === 'Tips').length,
      Others: posts.filter(p => !['Offer', 'Feature Highlight', 'Review', 'Tips'].includes(p.content_tag)).length,
    };

    const adObjectives = {
      Engagement: ads.filter(a => a.primary_kpi === 'Engagement').length,
      Sales: ads.filter(a => a.primary_kpi === 'Sale').length,
      Traffic: ads.filter(a => a.primary_kpi === 'Traffic').length,
    };

    return { 
      totalPosts, published, designed, plannedPosts, 
      healthPercent, totalAdsSpend, spendPercent, activeCategories, catPercent,
      creativeTypes, tags, adObjectives, totalAds: ads.length
    };
  }, [posts, ads, categories]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Command Data...</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Centered Header with Icon to the Left of Text */}
      <header className="px-2 flex justify-center">
        <div className="flex items-center gap-6">
          {/* Boxed Icon on the Left */}
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Activity size={24} />
          </div>
          
          {/* Title and Sharpened Subtitle on the Right */}
          <div className="flex flex-col text-left">
            <h1 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tighter leading-none mb-1.5">
              Command Dashboard
            </h1>
            <p className="text-slate-500 font-semibold text-sm md:text-base leading-relaxed">
              Visualizing real-time content flow and operational health.
            </p>
          </div>
        </div>
      </header>

      {/* Row 1: Donut Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DonutCard 
          label="Total Post" 
          value={stats.totalPosts} 
          percentage={100} 
          color="#3b82f6" 
          subLabel="Post Published" 
          exploreTo="/posts"
        />
        <DonutCard 
          label="Execution Health" 
          value={stats.published} 
          percentage={stats.healthPercent} 
          color="#10b981" 
          subLabel="Published Ratio" 
        />
        <DonutCard 
          label="Total Ads Spend" 
          value={`$${stats.totalAdsSpend.toLocaleString()}`} 
          percentage={stats.spendPercent} 
          color="#f59e0b" 
          subLabel="Budget Utilized" 
          exploreTo="/ads"
        />
        <DonutCard 
          label="Catalog Strength" 
          value={stats.activeCategories} 
          percentage={stats.catPercent} 
          color="#3b82f6" 
          subLabel="Structure Active" 
          exploreTo="/categories"
        />
      </div>

      {/* Row 2: Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ProgressCard 
          title="Lifecycle Mix" 
          total={stats.totalPosts}
          items={[
            { label: 'Published', value: stats.published, color: '#3b82f6' },
            { label: 'Designed', value: stats.designed, color: '#10b981' },
            { label: 'Planned', value: stats.plannedPosts, color: '#f1f5f9' },
          ]}
        />
        <ProgressCard 
          title="Creative Format" 
          total={stats.totalPosts}
          items={[
            { label: 'Static', value: stats.creativeTypes.Static, color: '#3b82f6' },
            { label: 'Carousel', value: stats.creativeTypes.Carousel, color: '#10b981' },
            { label: 'Reels', value: stats.creativeTypes.Reels, color: '#f1f5f9' },
            { label: 'Video', value: stats.creativeTypes.Video, color: '#f1f5f9' },
            { label: 'Others', value: stats.creativeTypes.Others, color: '#f1f5f9' },
          ]}
        />
        <ProgressCard 
          title="Strategic Tag" 
          total={stats.totalPosts}
          items={[
            { label: 'Offer', value: stats.tags.Offer, color: '#3b82f6' },
            { label: 'Feature Highlight', value: stats.tags.Highlight, color: '#10b981' },
            { label: 'Review', value: stats.tags.Review, color: '#f1f5f9' },
            { label: 'Tips', value: stats.tags.Tips, color: '#f1f5f9' },
            { label: 'Others', value: stats.tags.Others, color: '#f1f5f9' },
          ]}
        />
        <ProgressCard 
          title="Running Ads Campaign" 
          total={stats.totalAds}
          items={[
            { label: 'Engagement', value: stats.adObjectives.Engagement, color: '#3b82f6' },
            { label: 'Sales', value: stats.adObjectives.Sales, color: '#10b981' },
            { label: 'Traffic', value: stats.adObjectives.Traffic, color: '#f1f5f9' },
          ]}
        />
      </div>
    </div>
  );
};
