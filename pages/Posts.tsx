
import React, { useState, useMemo, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { PostLog, Category, User } from '../types';
import { 
  Search, Filter, Plus, Download, Edit2, Trash2, 
  ChevronRight, ExternalLink, Calendar, 
  Layers, Package, Monitor, X, Clock, History, CheckCircle, ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { PostModal } from '../components/PostModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const Posts: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostLog | null>(null);
  
  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCat, setFilterCat] = useState('');
  
  const [selectedModelHistory, setSelectedModelHistory] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      DBService.getPosts(), 
      DBService.getCategories(),
      DBService.getCurrentUser()
    ]).then(([p, c, u]) => {
      setPosts(p);
      setCategories(c);
      setCurrentUser(u);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const role = currentUser?.role || 'Viewer';
  const isAdmin = role === 'Admin';
  const isEditor = role === 'Editor' || isAdmin;
  const isViewer = role === 'Viewer';

  const getPostModels = (post: PostLog): string[] => {
    if (!post.product_model) return [];
    return post.product_model.split(',').map(m => m.trim()).filter(Boolean);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(p => {
      const models = getPostModels(p);
      const matchSearch = searchTerm === '' || 
        models.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.campaign_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchMonth = filterMonth === '' || p.month === filterMonth;
      const matchDate = filterDate === '' || p.date === filterDate;
      const matchCat = filterCat === '' || p.main_category_id === filterCat;
      
      return matchSearch && matchMonth && matchDate && matchCat;
    });
  }, [posts, searchTerm, filterMonth, filterDate, filterCat]);

  const modelHistoryData = useMemo(() => {
    if (!selectedModelHistory) return [];
    return posts.filter(p => {
      const models = getPostModels(p);
      return models.includes(selectedModelHistory);
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [posts, selectedModelHistory]);

  const handleSave = async (post: PostLog) => {
    if (isViewer) return;
    await DBService.savePost(post);
    fetchData();
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!isAdmin || !deleteConfirmId) return;
    await DBService.deletePost(deleteConfirmId);
    setDeleteConfirmId(null);
    fetchData();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterMonth('');
    setFilterDate('');
    setFilterCat('');
  };

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Syncing Repository Control...</p>
    </div>
  );

  const hasActiveFilters = searchTerm !== '' || filterMonth !== '' || filterDate !== '' || filterCat !== '';

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <Package size={22} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Content History</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">
              Detailed tracking for {filteredPosts.length} workspace entries.
            </p>
          </div>
        </div>
        
        {isEditor && (
          <button 
            onClick={() => { setEditingPost(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-2xl hover:bg-blue-700 font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Create Entry
          </button>
        )}
      </header>

      {isViewer && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 text-blue-700 mx-2">
          <ShieldAlert size={18} />
          <p className="text-[11px] font-black uppercase tracking-widest">Read-Only Mode Active</p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#e2e8f0]/40 backdrop-blur-md p-3 rounded-[2.5rem] border border-white/40 shadow-sm flex flex-wrap items-center gap-4 transition-all hover:bg-[#e2e8f0]/60 mx-2">
        <div className="relative flex-1 min-w-[300px] group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search products, IDs or campaigns..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-full outline-none focus:ring-0 text-sm font-bold text-slate-600 placeholder:text-slate-400 shadow-sm"
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm min-w-[180px] hover:border-blue-200 border border-transparent transition-all">
           <Calendar size={18} className="text-blue-500" />
           <div className="flex flex-col">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Specific Day</span>
             <input 
               type="date" 
               value={filterDate} 
               onChange={(e) => setFilterDate(e.target.value)} 
               className="text-xs font-black text-slate-700 outline-none bg-transparent border-none p-0 cursor-pointer w-full tracking-tighter" 
             />
           </div>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm min-w-[160px] hover:border-blue-200 border border-transparent transition-all">
           <Clock size={18} className="text-slate-400" />
           <div className="flex flex-col">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Month</span>
             <input 
               type="month" 
               value={filterMonth} 
               onChange={(e) => setFilterMonth(e.target.value)} 
               className="text-xs font-black text-slate-700 outline-none bg-transparent border-none p-0 cursor-pointer w-full tracking-tighter" 
             />
           </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-sm min-w-[200px] hover:border-blue-200 border border-transparent transition-all">
           <Layers size={18} className="text-slate-400" />
           <div className="flex flex-col flex-1">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Category</span>
             <select 
               value={filterCat} 
               onChange={(e) => setFilterCat(e.target.value)} 
               className="text-xs font-black text-slate-700 outline-none bg-transparent border-none py-0 pr-8 cursor-pointer w-full focus:ring-0"
             >
               <option value="">All Categories</option>
               {categories.filter(c => !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
           </div>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={resetFilters}
            className="p-4 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all active:scale-90 shadow-lg shadow-slate-200"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Ref</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hierarchy Mapping</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creative specs</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Anchor</th>
                <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                {!isViewer && <th className="px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 text-slate-300 opacity-60">
                      <Search size={48} strokeWidth={1.5} />
                      <p className="text-sm font-bold tracking-tight uppercase tracking-widest">No matching logs found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPosts.map(post => {
                  const models = getPostModels(post);
                  return (
                    <tr key={post.id} className="hover:bg-blue-50/40 transition-all duration-300 group cursor-default">
                      <td className="px-10 py-7">
                        <p className="font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{post.id}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mt-1 group-hover:text-slate-500 transition-colors">{post.date}</p>
                      </td>
                      <td className="px-10 py-7">
                        <p className="text-sm font-black text-slate-800 transition-colors group-hover:text-slate-950">{getCatName(post.main_category_id)}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase">
                          <span>{getCatName(post.sub_category_id)}</span>
                          {post.brand_type_id && (
                            <>
                              <ChevronRight size={10} className="text-slate-300" />
                              <span className="text-blue-500/80 group-hover:text-blue-600 transition-colors">{getCatName(post.brand_type_id)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <div className="flex gap-2">
                           <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-transform group-hover:scale-105">{post.content_type}</span>
                           <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-transform group-hover:scale-105">{post.content_tag}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {models.length > 0 ? (
                            models.map((m, i) => (
                              <button 
                                key={i} 
                                onClick={(e) => { e.stopPropagation(); setSelectedModelHistory(m); }}
                                className="text-[10px] font-black px-2.5 py-1 bg-white text-slate-600 rounded-lg border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                              >
                                <History size={10} /> {m}
                              </button>
                            ))
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 italic">No models assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-7">
                        <p className="text-sm font-black text-slate-800 tracking-tight transition-colors group-hover:text-slate-950">{post.campaign_name || 'General Content'}</p>
                        {post.asset_link && (
                          <a href={post.asset_link} target="_blank" rel="noreferrer" className="text-[10px] font-black text-blue-500 hover:text-blue-700 flex items-center gap-1.5 mt-1 uppercase tracking-tight transition-all hover:translate-x-1">
                            View Post <ExternalLink size={10} strokeWidth={3} />
                          </a>
                        )}
                      </td>
                      <td className="px-10 py-7 text-center">
                        <span className={`inline-block px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 group-hover:shadow-md ${
                          post.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50' :
                          post.status === 'Designed' ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-blue-50' :
                          post.status === 'Working' ? 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50' :
                          'bg-slate-50 text-slate-500 border-slate-100 shadow-slate-50'
                        }`}>
                          {post.status}
                        </span>
                      </td>
                      {!isViewer && (
                        <td className="px-10 py-7">
                          <div className="flex justify-end gap-3 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            {isEditor && (
                              <button 
                                onClick={() => { setEditingPost(post); setIsModalOpen(true); }}
                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-lg hover:shadow-blue-100 rounded-2xl transition-all active:scale-90"
                              >
                                <Edit2 size={16} strokeWidth={3} />
                              </button>
                            )}
                            {isAdmin && (
                              <button 
                                onClick={() => setDeleteConfirmId(post.id)}
                                className="p-3 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-lg hover:shadow-red-100 rounded-2xl transition-all active:scale-90"
                              >
                                <Trash2 size={16} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedModelHistory && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
                  <History size={24} strokeWidth={2.5}/>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Model Posting History</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedModelHistory}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModelHistory(null)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-full text-slate-300 hover:text-slate-900 transition-all"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6">
               <div className="flex items-center justify-between px-6 py-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Total Appearances</span>
                  <span className="text-2xl font-black text-blue-700">{modelHistoryData.length}</span>
               </div>
               <div className="space-y-3">
                  {modelHistoryData.map((h) => (
                    <div key={h.id} className="group p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 transition-all hover:bg-slate-50/50">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800 tracking-tight">{new Date(h.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Entry Ref: {h.id}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                           h.status === 'Published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                           h.status === 'Working' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                           'bg-slate-50 text-slate-400 border-slate-100'
                         }`}>
                           {h.status}
                         </span>
                         <ChevronRight size={14} className="text-slate-200 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {isEditor && (
        <PostModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSave} 
          initialData={editingPost}
        />
      )}

      <ConfirmationModal 
        isOpen={!!deleteConfirmId}
        title="Confirm Purge"
        message="Are you certain you want to permanently remove this content log from the global repository? This action is irreversible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
