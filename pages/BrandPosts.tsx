
import React, { useState, useMemo, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { PostLog, Category } from '../types';
import { 
  Award, Search, ChevronRight, Package, Eye, 
  ExternalLink, Calendar, X, 
  TrendingUp, BarChart3, RotateCcw,
  Box, Tag, Layers3, ChevronLeft, Home,
  List, LayoutGrid, Monitor, Globe, Zap,
  Percent, Layout
} from 'lucide-react';

type ViewLevel = 'main' | 'sub' | 'brand';
type ViewMode = 'hierarchy' | 'flat-brand';

interface NavStep {
  level: ViewLevel;
  id: string | null;
  name: string;
}

export const BrandPosts: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchy');
  
  // Drill-down navigation stack
  const [navStack, setNavStack] = useState<NavStep[]>([
    { level: 'main', id: null, name: 'Main Category' }
  ]);

  // Date filter: defaults to current month (YYYY-MM)
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [filterDate, setFilterDate] = useState(currentMonth);

  const fetchData = async () => {
    setLoading(true);
    const [p, c] = await Promise.all([
      DBService.getPosts(),
      DBService.getCategories()
    ]);
    setPosts(p);
    setCategories(c);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter posts based on timeline
  const timeFilteredPosts = useMemo(() => {
    if (!filterDate) return posts;
    return posts.filter(p => p.date && p.date.startsWith(filterDate));
  }, [posts, filterDate]);

  // Calculate volume count for each node at the current level based on active timeline
  const itemStats = useMemo(() => {
    const stats: Record<string, number> = {};
    timeFilteredPosts.forEach(p => {
      if (p.main_category_id) stats[p.main_category_id] = (stats[p.main_category_id] || 0) + 1;
      if (p.sub_category_id) stats[p.sub_category_id] = (stats[p.sub_category_id] || 0) + 1;
      if (p.brand_type_id) stats[p.brand_type_id] = (stats[p.brand_type_id] || 0) + 1;
    });
    return stats;
  }, [timeFilteredPosts]);

  const currentStep = navStack[navStack.length - 1];
  const viewLevel = currentStep.level;

  // Search and display items (All items shown, even with 0 volume)
  const filteredDisplayItems = useMemo(() => {
    const safeSearch = searchTerm.toLowerCase().trim();
    
    // 1. Determine active candidates based on View Mode and Drill-down level
    let candidates: Category[] = [];
    if (viewMode === 'flat-brand') {
      // Find all items that are level 3 (Brand level)
      candidates = categories.filter(cat => {
        const parent = categories.find(p => p.id === cat.parentId);
        const grandParent = parent ? categories.find(gp => gp.id === parent.parentId) : null;
        return cat.parentId && parent && grandParent; 
      });
    } else {
      // Hierarchy mode
      candidates = categories.filter(cat => {
        if (navStack.length === 1) return !cat.parentId; // Main categories
        if (navStack.length === 2) return cat.parentId === navStack[1].id; // Sub categories
        if (navStack.length === 3) return cat.parentId === navStack[2].id; // Brands
        return false;
      });
    }

    // 2. Apply Search (Zero-Volume removal REMOVED as per user request)
    return candidates.filter(item => {
      const matchesSearch = !safeSearch || item.name.toLowerCase().includes(safeSearch);
      return matchesSearch;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categories, navStack, viewMode, searchTerm]);

  // KPI calculations for header
  const kpis = useMemo(() => {
    const activeNodes = filteredDisplayItems.length;
    const totalVolume = filteredDisplayItems.reduce((acc, item) => acc + (itemStats[item.id] || 0), 0);
    const focusLabel = viewMode === 'flat-brand' ? 'ALL BRANDS' : viewLevel.toUpperCase();
    
    // Contribution Ratio Calculation
    let ratio = 100;
    let ratioLabel = "Global Scope";
    const globalTotal = timeFilteredPosts.length;

    if (viewMode === 'hierarchy') {
        if (navStack.length === 2) {
            const parentId = navStack[1].id;
            const parentVolume = parentId ? (itemStats[parentId] || 0) : 0;
            ratio = globalTotal > 0 ? (parentVolume / globalTotal) * 100 : 0;
            ratioLabel = "Global Weight";
        } else if (navStack.length === 3) {
            const parentId = navStack[2].id;
            const grandParentId = navStack[1].id;
            const parentVolume = parentId ? (itemStats[parentId] || 0) : 0;
            const grandParentVolume = grandParentId ? (itemStats[grandParentId] || 0) : 0;
            ratio = grandParentVolume > 0 ? (parentVolume / grandParentVolume) * 100 : 0;
            ratioLabel = "Parent Contribution";
        }
    } else {
        ratio = globalTotal > 0 ? (totalVolume / globalTotal) * 100 : 0;
        ratioLabel = "Brands Share";
    }

    return { activeNodes, totalVolume, ratio: ratio.toFixed(1), ratioLabel, focusLabel };
  }, [filteredDisplayItems, itemStats, navStack, viewLevel, timeFilteredPosts, viewMode]);

  // Handle drill-down
  const handleItemClick = (item: Category) => {
    if (viewMode === 'flat-brand') {
      setSelectedBrandId(item.id);
      return;
    }

    if (viewLevel === 'main') {
      setNavStack([...navStack, { level: 'sub', id: item.id, name: item.name }]);
      setSearchTerm('');
    } else if (viewLevel === 'sub') {
      setNavStack([...navStack, { level: 'brand', id: item.id, name: item.name }]);
      setSearchTerm('');
    } else {
      setSelectedBrandId(item.id);
    }
  };

  const handleGoBack = () => {
    if (navStack.length > 1) {
      setNavStack(navStack.slice(0, -1));
      setSearchTerm('');
    }
  };

  const jumpToStep = (index: number) => {
    if (index < navStack.length - 1) {
      setNavStack(navStack.slice(0, index + 1));
      setSearchTerm('');
      setSelectedBrandId(null);
    }
  };

  // Data for the Post Feed Modal
  const brandPosts = useMemo(() => {
    if (!selectedBrandId) return [];
    return timeFilteredPosts.filter(p => p.brand_type_id === selectedBrandId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [timeFilteredPosts, selectedBrandId]);

  const selectedBrandData = useMemo(() => 
    categories.find(c => c.id === selectedBrandId), 
  [categories, selectedBrandId]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Architecting Insights...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700 p-2">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <LayoutGrid size={28} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">
                {viewMode === 'flat-brand' ? 'Brand Intelligence' : 
                 viewLevel === 'main' ? 'Main Category Insights' : 
                 viewLevel === 'sub' ? 'Sub Category Insights' : 'Brand Insights'}
              </h1>
              {/* Interactive Path Flow */}
              <div className="flex items-center gap-2 mt-2">
                 {viewMode === 'hierarchy' ? (
                   navStack.map((step, idx) => (
                     <React.Fragment key={idx}>
                        {idx > 0 && <ChevronRight size={12} className="text-slate-300" />}
                        <button 
                          onClick={() => jumpToStep(idx)}
                          disabled={idx === navStack.length - 1}
                          className={`font-black text-[10px] uppercase tracking-widest transition-all ${
                            idx === 0 ? 'text-blue-600' : 
                            idx === navStack.length - 1 ? 'text-slate-900 pointer-events-none' : 'text-slate-400'
                          } ${idx < navStack.length - 1 ? 'hover:text-blue-700 hover:underline underline-offset-4' : ''}`}
                        >
                          {idx === 0 ? 'Root Intelligence' : step.name}
                        </button>
                     </React.Fragment>
                   ))
                 ) : (
                   <div className="flex items-center gap-2">
                      <span className="font-black text-[10px] uppercase tracking-widest text-blue-600">Flat View</span>
                      <ChevronRight size={12} className="text-slate-300" />
                      <span className="font-black text-[10px] uppercase tracking-widest text-slate-900">All Active Brands</span>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggles */}
          <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center shadow-sm">
             <button 
               onClick={() => setViewMode('hierarchy')}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'hierarchy' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Category
             </button>
             <button 
               onClick={() => {
                 setViewMode('flat-brand');
                 setSearchTerm('');
               }}
               className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'flat-brand' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
             >
               Brand
             </button>
          </div>

          {navStack.length > 1 && viewMode === 'hierarchy' && (
            <button 
              onClick={handleGoBack}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95 group"
            >
              <ChevronLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" /> Go Back
            </button>
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Nodes</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpis.activeNodes}</p>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Volume</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpis.totalVolume}</p>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
           <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Percent size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contribution Ratio</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpis.ratio}%</p>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">({kpis.ratioLabel})</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-200 transition-all">
           <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">View Focus</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{kpis.focusLabel}</p>
           </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#e2e8f0]/40 backdrop-blur-md p-2.5 rounded-full border border-white/40 shadow-sm flex items-center gap-4 transition-all hover:bg-[#e2e8f0]/60 mx-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={viewMode === 'flat-brand' ? "Search across all registered brands..." : "Filter segments..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-3.5 bg-white border-none rounded-full outline-none focus:ring-0 text-sm font-bold text-slate-600 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm min-w-[220px] hover:bg-slate-50 transition-colors">
          <Calendar size={18} className="text-slate-400" />
          <div className="flex flex-col flex-1">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Timeline</span>
             <input 
               type="month" 
               value={filterDate} 
               onChange={(e) => setFilterDate(e.target.value)}
               className="text-xs font-black text-slate-700 outline-none bg-transparent border-none p-0 cursor-pointer w-full tracking-tighter" 
             />
          </div>
          {filterDate !== currentMonth && (
            <button onClick={() => setFilterDate(currentMonth)} className="text-blue-500 hover:text-blue-700 p-1">
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-2">
        {filteredDisplayItems.map(item => {
          const count = itemStats[item.id] || 0;
          const parentName = viewMode === 'flat-brand' 
            ? categories.find(c => c.id === item.parentId)?.name 
            : null;

          return (
            <div 
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`p-10 rounded-[3rem] border transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 hover:translate-y-[-8px] bg-white border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-200/30 ${count === 0 ? 'bg-slate-50/50 grayscale-[0.5]' : ''}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 ${
                viewMode === 'flat-brand' ? 'bg-amber-50 text-amber-600' :
                viewLevel === 'main' ? 'bg-blue-50 text-blue-600' : 
                viewLevel === 'sub' ? 'bg-emerald-50 text-emerald-600' : 
                'bg-amber-50 text-amber-600'
              } ${count === 0 ? '!bg-slate-100 !text-slate-400' : ''}`}>
                {viewMode === 'flat-brand' ? <Tag size={24} strokeWidth={2.5} /> :
                 viewLevel === 'main' ? <Box size={24} /> : 
                 viewLevel === 'sub' ? <Layers3 size={24} /> : 
                 <Tag size={24} strokeWidth={2.5} />}
              </div>
              
              <div className="w-full mb-6">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 truncate px-2 ${count === 0 ? 'text-slate-400' : viewMode === 'flat-brand' ? 'text-blue-500' : 'text-slate-400'}`}>
                  {viewMode === 'flat-brand' ? (parentName || 'Brand Registry') :
                   viewLevel === 'main' ? 'Segment Root' : viewLevel === 'sub' ? 'Branch' : 'Identity'}
                </p>
                <h3 className={`text-xl font-black tracking-tight leading-tight truncate w-full group-hover:text-blue-600 transition-colors ${count === 0 ? 'text-slate-400' : 'text-slate-900'}`}>{item.name}</h3>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-50 w-full flex flex-col">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Volume</p>
                <p className={`text-3xl font-black mt-1 ${count === 0 ? 'text-slate-300' : 'text-slate-900'}`}>{count}</p>
              </div>

              {/* Status Indicator Dot */}
              {count > 0 ? (
                <div className="absolute top-6 left-6 w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
              ) : (
                <div className="absolute top-6 left-6 w-2 h-2 bg-slate-200 rounded-full shadow-sm"></div>
              )}
              
              {/* Interaction Indicator */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                 <ChevronRight size={18} className="text-slate-300" />
              </div>
            </div>
          );
        })}

        {filteredDisplayItems.length === 0 && (
          <div className="col-span-full py-32 text-center">
             <div className="flex flex-col items-center gap-6 opacity-30">
                <List size={64} />
                <p className="text-lg font-black uppercase tracking-widest">
                  No registered segments found.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Final Step: Brand Post Feed Modal */}
      {selectedBrandId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            {/* Modal Header */}
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100 ${brandPosts.length === 0 ? 'bg-slate-400' : 'bg-blue-600'}`}>
                  <Box size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      {selectedBrandData?.name || 'Direct Entry'}
                    </span>
                    {filterDate && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 border border-slate-200 rounded-lg">{filterDate}</span>}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedBrandData?.name} Feed</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Found {brandPosts.length} entries in selection</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBrandId(null)}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all shadow-sm hover:rotate-90 duration-300"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-6">
              {brandPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-200 space-y-6">
                   <div className="p-8 bg-slate-50 rounded-[2.5rem]">
                      <Package size={80} strokeWidth={1} />
                   </div>
                   <div className="text-center">
                     <p className="text-base font-black uppercase tracking-widest text-slate-400">Zero-Volume Segment</p>
                     <p className="text-sm font-bold text-slate-300 mt-2">This category has no historical logs for {filterDate}.</p>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {brandPosts.map((post) => (
                    <div key={post.id} className="group p-10 bg-white border border-slate-100 rounded-[3rem] flex items-center justify-between hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-slate-200/40">
                       <div className="flex items-center gap-10">
                          <div className="flex flex-col items-center justify-center w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.75rem] text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                             <Calendar size={28} />
                             <span className="text-[10px] font-black mt-2 uppercase">{(post.date || '').split('-').slice(1).join('/')}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.1em]">{post.id}</span>
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                post.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                post.status === 'Designed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                {post.status}
                              </span>
                            </div>
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight mt-3">{post.product_model || 'Direct Brand Asset'}</h4>
                            <div className="flex items-center gap-6 mt-4">
                               <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                 <Monitor size={14} className="text-slate-300" /> {post.content_type}
                               </div>
                               <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                 <TrendingUp size={14} className="text-slate-300" /> {post.content_tag}
                               </div>
                            </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-8">
                          {post.asset_link && (
                            <a 
                              href={post.asset_link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                            >
                              Open Asset <ExternalLink size={16} strokeWidth={3} />
                            </a>
                          )}
                          <ChevronRight size={24} className="text-slate-100 group-hover:text-blue-500 transition-all transform group-hover:translate-x-1" />
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex items-center justify-center gap-10">
               <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${brandPosts.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Architecture Sync: Active</span>
               </div>
               <div className="w-px h-6 bg-slate-200"></div>
               <div className="flex items-center gap-3">
                  <BarChart3 size={18} className={brandPosts.length > 0 ? 'text-blue-600' : 'text-slate-300'} />
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{brandPosts.length} Records In-Focus</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
