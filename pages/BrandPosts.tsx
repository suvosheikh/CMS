
import React, { useState, useMemo, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { PostLog, Category, User } from '../types';
import { 
  Award, Search, ChevronRight, Package, Eye, 
  ExternalLink, Calendar, Filter, X, 
  TrendingUp, BarChart3, Clock, LayoutGrid,
  Monitor, Layers, Globe, Zap, RotateCcw,
  Info, Box, Tag, Layers3
} from 'lucide-react';

type ViewLevel = 'main' | 'sub' | 'brand';

export const BrandPosts: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('brand');
  
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

  // Helper to get parent category name
  const getParentName = (parentId: string | null) => {
    if (!parentId) return 'Root';
    return categories.find(c => c.id === parentId)?.name || 'Root';
  };

  // Identify categories based on the selected view level
  const activeItems = useMemo(() => {
    return categories.filter(cat => {
      if (viewLevel === 'main') {
        return !cat.parentId;
      }
      
      const parent = categories.find(c => c.id === cat.parentId);
      if (viewLevel === 'sub') {
        return cat.parentId && !parent?.parentId;
      }
      
      if (viewLevel === 'brand') {
        return parent && parent.parentId;
      }
      
      return false;
    }).map(item => ({
      ...item,
      parentName: getParentName(item.parentId)
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, viewLevel]);

  // Filter posts based on date
  const timeFilteredPosts = useMemo(() => {
    if (!filterDate) return posts;
    return posts.filter(p => p.date.startsWith(filterDate));
  }, [posts, filterDate]);

  // Dynamic stats calculation based on view level
  const itemStats = useMemo(() => {
    const stats: Record<string, number> = {};
    timeFilteredPosts.forEach(p => {
      let id = '';
      if (viewLevel === 'main') id = p.main_category_id;
      else if (viewLevel === 'sub') id = p.sub_category_id;
      else if (viewLevel === 'brand') id = p.brand_type_id || '';
      
      if (id) {
        stats[id] = (stats[id] || 0) + 1;
      }
    });
    return stats;
  }, [timeFilteredPosts, viewLevel]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const totalCount = activeItems.length;
    const totalContent = (Object.values(itemStats) as number[]).reduce((a, b) => a + b, 0);
    
    // Active distribution
    const activeSegments = new Set(
      activeItems
        .filter(item => (itemStats[item.id] || 0) > 0)
        .map(item => item.parentName)
    ).size;
    
    let leadingName = 'N/A';
    let maxPosts = 0;
    (Object.entries(itemStats) as [string, number][]).forEach(([id, count]) => {
      if (count > maxPosts) {
        // Only consider items that belong to the current view level
        const item = activeItems.find(i => i.id === id);
        if (item) {
          maxPosts = count;
          leadingName = item.name;
        }
      }
    });

    return { totalCount, totalContent, activeSegments, leadingName };
  }, [activeItems, itemStats]);

  const filteredDisplayItems = useMemo(() => {
    return activeItems.filter(item => {
      const hasContent = (itemStats[item.id] || 0) > 0;
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      return hasContent && matchSearch;
    });
  }, [activeItems, searchTerm, itemStats]);

  const itemPosts = useMemo(() => {
    if (!selectedItemId) return [];
    return timeFilteredPosts.filter(p => {
      if (viewLevel === 'main') return p.main_category_id === selectedItemId;
      if (viewLevel === 'sub') return p.sub_category_id === selectedItemId;
      return p.brand_type_id === selectedItemId;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [timeFilteredPosts, selectedItemId, viewLevel]);

  const selectedItem = useMemo(() => 
    categories.find(c => c.id === selectedItemId), 
  [categories, selectedItemId]);

  const levelLabel = viewLevel === 'main' ? 'Main Category' : viewLevel === 'sub' ? 'Sub Category' : 'Brand';

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Architecting Insights...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <Award size={22} />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">{levelLabel} Intelligence</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">
              Analyzing <span className="text-blue-600 font-black">{filteredDisplayItems.length}</span> active {levelLabel.toLowerCase()} flows.
            </p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] border border-slate-200 shadow-inner no-print">
          <button 
            onClick={() => { setViewLevel('main'); setSelectedItemId(null); }}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewLevel === 'main' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Main Category
          </button>
          <button 
            onClick={() => { setViewLevel('sub'); setSelectedItemId(null); }}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewLevel === 'sub' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Sub Category
          </button>
          <button 
            onClick={() => { setViewLevel('brand'); setSelectedItemId(null); }}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewLevel === 'brand' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Brand
          </button>
        </div>
      </header>

      {/* KPI Cards Row with Context-Aware Tooltips */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-2">
        {/* Active Items Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all relative">
           <div className="absolute top-6 right-6 group/tip">
              <Info size={14} className="text-slate-200 group-hover/tip:text-blue-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-xl leading-relaxed">
                Total unique {levelLabel.toLowerCase()}s with active content for the selected period.
              </div>
           </div>
           <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active {levelLabel}s</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpiStats.totalCount}</p>
           </div>
        </div>

        {/* Period Content Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all relative">
           <div className="absolute top-6 right-6 group/tip">
              <Info size={14} className="text-slate-200 group-hover/tip:text-emerald-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-xl leading-relaxed">
                Total volume of all content types generated within this {levelLabel.toLowerCase()} level.
              </div>
           </div>
           <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Content</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpiStats.totalContent}</p>
           </div>
        </div>

        {/* Active Distribution Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all relative">
           <div className="absolute top-6 right-6 group/tip">
              <Info size={14} className="text-slate-200 group-hover/tip:text-amber-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-xl leading-relaxed">
                Diversity score: Number of distinct parent segments active in this view.
              </div>
           </div>
           <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Segments</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{kpiStats.activeSegments}</p>
           </div>
        </div>

        {/* Leading Item Card */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-200 transition-all relative">
           <div className="absolute top-6 right-6 group/tip">
              <Info size={14} className="text-slate-200 group-hover/tip:text-purple-400 cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-20 shadow-xl leading-relaxed">
                The most frequent {levelLabel.toLowerCase()} entry during this period.
              </div>
           </div>
           <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Zap size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leading {levelLabel}</p>
              <p className="text-xl font-black text-slate-900 tracking-tighter truncate max-w-[120px]">{kpiStats.leadingName}</p>
           </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-[#e2e8f0]/40 backdrop-blur-md p-2.5 rounded-full border border-white/40 shadow-sm flex items-center gap-4 transition-all hover:bg-[#e2e8f0]/60 mx-2 no-print">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={`Search for an active ${levelLabel.toLowerCase()}...`} 
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

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-2">
        {filteredDisplayItems.map(item => {
          const count = itemStats[item.id] || 0;
          return (
            <div 
              key={item.id}
              onClick={() => setSelectedItemId(item.id)}
              className={`p-8 rounded-[2.5rem] border transition-all cursor-pointer group flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 ${
                selectedItemId === item.id 
                  ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-100 text-white translate-y-[-8px]' 
                  : 'bg-white border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
                selectedItemId === item.id ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
              }`}>
                {viewLevel === 'main' ? <Box size={20} /> : viewLevel === 'sub' ? <Layers3 size={20} /> : <Award size={20} strokeWidth={2.5} />}
              </div>
              
              <div className="w-full mb-4">
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-1.5 ${
                  selectedItemId === item.id ? 'text-blue-200' : 'text-slate-400'
                }`}>
                  {item.parentName === 'Root' ? levelLabel : item.parentName}
                </p>
                <h3 className="text-xl font-black tracking-tight leading-tight truncate w-full">{item.name}</h3>
              </div>

              <div className="mt-auto pt-4 border-t border-slate-50/10 w-full flex flex-col">
                <p className={`text-[9px] font-black uppercase tracking-widest ${
                  selectedItemId === item.id ? 'text-white/60' : 'text-slate-400'
                }`}>Volume</p>
                <p className="text-2xl font-black mt-1">{count}</p>
              </div>

              {/* Status Indicator */}
              {count > 0 && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDisplayItems.length === 0 && (
        <div className="py-24 text-center">
           <div className="flex flex-col items-center gap-6 opacity-30">
              <LayoutGrid size={64} />
              <p className="text-lg font-black uppercase tracking-widest">No active {levelLabel.toLowerCase()} data for this period.</p>
           </div>
        </div>
      )}

      {/* Detail Overlay */}
      {selectedItemId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 sticky top-0 z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                  {viewLevel === 'main' ? <Box size={32} /> : viewLevel === 'sub' ? <Layers3 size={32} /> : <Award size={32} strokeWidth={2.5} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                      {selectedItem?.parentId ? getParentName(selectedItem.parentId) : levelLabel}
                    </span>
                    {filterDate && <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 border border-slate-200 rounded-lg">{filterDate}</span>}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{selectedItem?.name} Feed</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Found {itemPosts.length} entries in selection</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItemId(null)}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all shadow-sm hover:rotate-90 duration-300"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-6">
              {itemPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-200 space-y-6">
                   <Package size={64} strokeWidth={1.5} />
                   <p className="text-base font-black uppercase tracking-widest">No matching logs found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {itemPosts.map((post) => (
                    <div key={post.id} className="group p-8 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] flex items-center justify-between hover:bg-white hover:border-blue-200 transition-all hover:shadow-xl hover:shadow-slate-200/50">
                       <div className="flex items-center gap-8">
                          <div className="flex flex-col items-center justify-center w-16 h-16 bg-white border border-slate-100 rounded-2xl text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                             <Calendar size={22} />
                             <span className="text-[9px] font-black mt-1 uppercase">{post.date.split('-').slice(1).join('/')}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.1em]">{post.id}</span>
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                post.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                post.status === 'Designed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-slate-50 text-slate-400 border-slate-100'
                              }`}>
                                {post.status}
                              </span>
                            </div>
                            <h4 className="text-xl font-black text-slate-800 tracking-tight mt-2">{post.product_model || 'General Activity Entry'}</h4>
                            <div className="flex items-center gap-4 mt-3">
                               <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <Monitor size={12} /> {post.content_type}
                               </div>
                               <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <TrendingUp size={12} /> {post.content_tag}
                               </div>
                            </div>
                          </div>
                       </div>

                       <div className="flex items-center gap-6">
                          {post.asset_link && (
                            <a 
                              href={post.asset_link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
                            >
                              Open Asset <ExternalLink size={14} strokeWidth={3} />
                            </a>
                          )}
                          <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-500 transition-all" />
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-50 bg-slate-50/20 flex items-center justify-center">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Architecture Sync: Active</span>
                 </div>
                 <div className="w-px h-4 bg-slate-200"></div>
                 <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-blue-600" />
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{itemPosts.length} Records In-Focus</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
