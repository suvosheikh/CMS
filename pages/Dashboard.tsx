
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DBService } from '../services/dbService';
import { PostLog, Category, AdCampaignEntry } from '../types';
import { CONTENT_TAGS, CONTENT_TYPES } from '../constants';
import { MoreHorizontal, Activity, ChevronRight, ChevronDown, ChevronUp, Calendar, RotateCcw } from 'lucide-react';

const DonutCard: React.FC<{ 
  label: string, 
  value: string | number, 
  percentage: number, 
  color: string, 
  subLabel: string,
  exploreTo?: string
}> = ({ label, value, percentage, color, subLabel, exploreTo }) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 flex flex-col relative overflow-hidden h-full group transition-all hover:shadow-xl hover:shadow-slate-200/50">
    <div className="w-full flex justify-between items-center mb-4">
      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{label}</h4>
      <MoreHorizontal size={14} className="text-slate-200" />
    </div>

    <div className="relative w-28 h-28 mb-6 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value: percentage }, { value: 100 - percentage }]}
            innerRadius={35} outerRadius={42} paddingAngle={0} dataKey="value" startAngle={90} endAngle={-270} stroke="none"
          >
            <Cell fill={color} />
            <Cell fill={`${color}10`} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black text-blue-600">{percentage}%</span>
      </div>
    </div>

    <div className="flex justify-between items-end w-full mt-auto">
      <div className="text-left">
        <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mt-1.5">{subLabel}</p>
      </div>
      
      {exploreTo && (
        <Link 
          to={exploreTo} 
          className="flex items-center gap-1 text-blue-600 font-black text-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0"
        >
          Explore <ChevronRight size={12} strokeWidth={3} />
        </Link>
      )}
    </div>
    
    <div className={`absolute bottom-0 left-0 right-0 h-1`} style={{ backgroundColor: color }}></div>
  </div>
);

const ProgressCard: React.FC<{ 
  title: string, 
  items: { label: string, value: number, color: string }[], 
  total: number,
  isAdsCard?: boolean
}> = ({ title, items, total, isAdsCard }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const initialLimit = 5;
  const hasMore = items.length > initialLimit;
  const displayedItems = isExpanded ? items : items.slice(0, initialLimit);

  return (
    <div className="bg-white p-6 pb-8 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col h-full transition-all duration-500">
      <div className="flex justify-between items-center mb-8">
        <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest">{title}</h4>
        <MoreHorizontal size={14} className="text-slate-200" />
      </div>

      <div className="space-y-5 flex-1 px-1">
        {displayedItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest w-20 truncate shrink-0">
              {item.label}
            </span>
            <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000" 
                style={{ 
                  width: `${total > 0 && item.value > 0 ? (item.value / total) * 100 : 0}%`, 
                  maxWidth: '100%',
                  backgroundColor: item.value > 0 ? item.color : '#f1f5f9' 
                }}
              />
            </div>
            <span className="text-[12px] font-black text-slate-900 w-5 text-right shrink-0">{item.value}</span>
          </div>
        ))}
      </div>

      {hasMore && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 flex items-center justify-center gap-2 py-1.5 w-full text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-all"
        >
          {isExpanded ? (
            <>SEE LESS <ChevronUp size={12} strokeWidth={3} /></>
          ) : (
            <>SEE MORE <ChevronDown size={12} strokeWidth={3} /></>
          )}
        </button>
      )}

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-80">{total} Entries Total</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [ads, setAds] = useState<AdCampaignEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Time Filter State
  const currentPeriod = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(''); // Empty means "All Time"

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
    // Filter posts and ads based on selectedMonth
    const filteredPosts = selectedMonth 
      ? posts.filter(p => p.month === selectedMonth)
      : posts;
    
    const filteredAds = selectedMonth
      ? ads.filter(a => a.start_date.startsWith(selectedMonth))
      : ads;

    const totalPosts = filteredPosts.length;
    const published = filteredPosts.filter(p => p.status === 'Published').length;
    const designed = filteredPosts.filter(p => p.status === 'Designed').length;
    const working = filteredPosts.filter(p => p.status === 'Working').length;
    const plannedPosts = filteredPosts.filter(p => p.status === 'Planned').length;

    const healthPercent = totalPosts > 0 ? Math.round((published / totalPosts) * 100) : 0;
    
    // For Ad Spend, we calculate based on daily metrics that fall within the selected month
    let totalAdsSpend = 0;
    let totalAdsBudget = 0;

    if (selectedMonth) {
      ads.forEach(ad => {
        const monthSpend = ad.daily_metrics
          ?.filter(m => m.date.startsWith(selectedMonth))
          .reduce((sum, m) => sum + (Number(m.spend) || 0), 0) || 0;
        totalAdsSpend += monthSpend;
      });
      // Budget is tricky for monthly view, we'll show total budget of campaigns active/starting in that month
      totalAdsBudget = filteredAds.reduce((acc, c) => acc + (Number(c.total_budget) || 0), 0);
    } else {
      totalAdsSpend = ads.reduce((acc, c) => acc + (Number(c.spend) || 0), 0);
      totalAdsBudget = ads.reduce((acc, c) => acc + (Number(c.total_budget) || 0), 0);
    }

    const spendPercent = totalAdsBudget > 0 ? Math.round((totalAdsSpend / totalAdsBudget) * 100) : 0;

    const activeCategories = new Set(filteredPosts.map(p => p.main_category_id)).size;
    const catPercent = categories.length > 0 ? Math.round((activeCategories / categories.length) * 100) : 0;

    const dynamicTypes = CONTENT_TYPES.map(type => ({
      label: type as string,
      value: filteredPosts.filter(p => p.content_type === type).length,
      color: '#3b82f6'
    })).sort((a, b) => b.value - a.value);

    const dynamicTags = CONTENT_TAGS.map(tag => ({
      label: tag as string,
      value: filteredPosts.filter(p => p.content_tag === tag).length,
      color: '#3b82f6'
    })).sort((a, b) => b.value - a.value);

    const adObjectives = [
      { label: 'Traffic', value: filteredAds.filter(a => a.primary_kpi === 'Traffic').length, color: '#3b82f6' },
      { label: 'Sales', value: filteredAds.filter(a => a.primary_kpi === 'Sale' || a.primary_kpi === 'Sales').length, color: '#3b82f6' },
      { label: 'Engagement', value: filteredAds.filter(a => a.primary_kpi === 'Engagement').length, color: '#3b82f6' },
      { label: 'Lead Gen', value: filteredAds.filter(a => a.primary_kpi === 'Lead Gen').length, color: '#3b82f6' },
      { label: 'Awareness', value: filteredAds.filter(a => a.primary_kpi === 'Awareness').length, color: '#3b82f6' },
    ].sort((a, b) => b.value - a.value);

    return { 
      totalPosts, published, designed, working, plannedPosts, 
      healthPercent, totalAdsSpend, spendPercent, activeCategories, catPercent,
      dynamicTypes, dynamicTags, adObjectives, totalAds: filteredAds.length
    };
  }, [posts, ads, categories, selectedMonth]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Syncing Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-700">
      <header className="px-2 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Activity size={24} />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-black text-[#0f172a] tracking-tight leading-none mb-1">
              MARCOM Intelligence
            </h1>
            <p className="text-slate-500 font-semibold text-xs leading-relaxed">
              Consolidated real-time operational health and content flow.
            </p>
          </div>
        </div>

        {/* Month Filter Section */}
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm transition-all hover:border-blue-200">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-100">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
              Month Year
            </span>
          </div>
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
          />
          {selectedMonth && (
            <button 
              onClick={() => setSelectedMonth('')} 
              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all ml-1"
              title="Clear Filter"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DonutCard 
          label="Total Post" 
          value={stats.totalPosts} 
          percentage={100} 
          color="#3b82f6" 
          subLabel={selectedMonth ? "PERIOD ENTRIES" : "GLOBAL ENTRIES"} 
          exploreTo="/posts"
        />
        <DonutCard 
          label="Execution Health" 
          value={stats.published} 
          percentage={stats.healthPercent} 
          color="#10b981" 
          subLabel="PUBLISHED RATIO" 
        />
        <DonutCard 
          label="Total Ads Spend" 
          value={`$${stats.totalAdsSpend.toLocaleString()}`} 
          percentage={stats.spendPercent} 
          color="#f59e0b" 
          subLabel="BUDGET UTILIZED" 
          exploreTo="/ads"
        />
        <DonutCard 
          label="Catalog Strength" 
          value={stats.activeCategories} 
          percentage={stats.catPercent} 
          color="#3b82f6" 
          subLabel="ACTIVE SEGMENTS" 
          exploreTo="/categories"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        <ProgressCard 
          title="Lifecycle Mix" 
          total={stats.totalPosts}
          items={[
            { label: 'Published', value: stats.published, color: '#10b981' },
            { label: 'Designed', value: stats.designed, color: '#3b82f6' },
            { label: 'Working', value: stats.working, color: '#f59e0b' },
            { label: 'Planned', value: stats.plannedPosts, color: '#f1f5f9' },
          ]}
        />
        <ProgressCard 
          title="Creative Format" 
          total={stats.totalPosts}
          items={stats.dynamicTypes}
        />
        <ProgressCard 
          title="Strategic Tag" 
          total={stats.totalPosts}
          items={stats.dynamicTags}
        />
        <ProgressCard 
          title="Running Ads Campaign" 
          total={stats.totalAds}
          items={stats.adObjectives}
          isAdsCard
        />
      </div>
    </div>
  );
};
