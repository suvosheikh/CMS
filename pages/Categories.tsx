
import React, { useState, useMemo, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { Category, PostLog, User } from '../types';
import { 
  Plus, Trash2, Folder, FolderPlus, Tag, X, 
  AlertTriangle, Layers, Info, 
  ChevronRight, ChevronDown, Package,
  RefreshCcw, FolderTree, ShieldAlert
} from 'lucide-react';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignParentId, setReassignParentId] = useState<string | 'DELETE_ALL'>('DELETE_ALL');

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const [catData, postData, userData] = await Promise.all([
        DBService.getCategories(),
        DBService.getPosts(),
        DBService.getCurrentUser()
      ]);
      setCategories(catData || []);
      setPosts(postData || []);
      setCurrentUser(userData);
    } catch (error) {
      console.error("Data fetch failed:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const role = currentUser?.role || 'Viewer';
  const isAdmin = role === 'Admin';
  const isEditor = role === 'Editor' || isAdmin;
  const isViewer = role === 'Viewer';

  const categoryPostCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(cat => {
      counts[cat.id] = posts.filter(p => 
        p.main_category_id === cat.id || 
        p.sub_category_id === cat.id || 
        p.brand_type_id === cat.id
      ).length;
    });
    return counts;
  }, [categories, posts]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const currentAddingLevel = useMemo(() => {
    if (!parentId) return 'Main Category';
    const parent = categories.find(c => c.id === parentId);
    if (!parent?.parentId) return 'Sub-Category';
    return 'Brand / Type';
  }, [parentId, categories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !isEditor) return;

    const newCat: Category = {
      id: `${parentId ? parentId + '.' : ''}${Math.random().toString(36).substr(2, 4)}`,
      name: newCatName,
      parentId
    };

    try {
      await DBService.saveCategory(newCat);
      setNewCatName('');
      if (parentId) setExpandedIds(prev => new Set(prev).add(parentId));
      fetchData(true);
    } catch (err) {
      alert("Failed to save category.");
    }
  };

  const getChildCategories = (id: string) => categories.filter(c => c.parentId === id);

  const initiateDelete = async (cat: Category) => {
    if (!isAdmin) return;
    const children = getChildCategories(cat.id);
    if (children.length === 0) {
      if (confirm(`Delete ${cat.name}?`)) {
        await DBService.deleteCategory(cat.id);
        fetchData(true);
      }
    } else {
      setCategoryToDelete(cat);
      setReassignParentId('DELETE_ALL');
    }
  };

  const finalizeDelete = async () => {
    if (!categoryToDelete || !isAdmin) return;
    if (reassignParentId === 'DELETE_ALL') {
       const toDelete = [categoryToDelete.id];
       const findChildren = (pid: string) => {
         categories.filter(c => c.parentId === pid).forEach(child => {
           toDelete.push(child.id);
           findChildren(child.id);
         });
       };
       findChildren(categoryToDelete.id);
       for (const id of toDelete) await DBService.deleteCategory(id);
    } else {
      const children = categories.filter(c => c.parentId === categoryToDelete.id);
      const actualParent = reassignParentId === 'NONE' ? null : reassignParentId;
      for (const child of children) await DBService.saveCategory({ ...child, parentId: actualParent });
      await DBService.deleteCategory(categoryToDelete.id);
    }
    setCategoryToDelete(null);
    fetchData(true);
  };

  const availableParents = useMemo(() => {
    return categories.filter(c => {
      const parent = categories.find(p => p.id === c.parentId);
      return !c.parentId || (c.parentId && !parent?.parentId);
    });
  }, [categories]);

  const renderTree = (pId: string | null = null, level: number = 0) => {
    const children = categories.filter(c => c.parentId === pId);
    if (children.length === 0) return null;

    return (
      <div className={`space-y-3 ${level > 0 ? 'ml-8 border-l-2 border-slate-100 pl-6' : ''}`}>
        {children.map(cat => {
          const hasChildren = categories.some(c => c.parentId === cat.id);
          const isExpanded = expandedIds.has(cat.id);
          const postCount = categoryPostCounts[cat.id] || 0;

          return (
            <div key={cat.id} className="space-y-3">
              <div 
                onClick={() => hasChildren && toggleExpand(cat.id)}
                className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all group cursor-pointer outline-none select-none ${
                  level === 0 ? 'border-slate-100 shadow-sm' : 'border-slate-50'
                } ${isExpanded ? 'border-blue-200 bg-blue-50/20' : 'hover:border-blue-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-6 text-slate-300">
                    {hasChildren ? (
                      isExpanded ? <ChevronDown size={16} strokeWidth={3} className="text-blue-500" /> : <ChevronRight size={16} strokeWidth={3} />
                    ) : null}
                  </div>
                  
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-sm ${
                    level === 0 ? 'bg-blue-600 text-white' : 
                    level === 1 ? 'bg-emerald-500 text-white' : 
                    'bg-amber-500 text-white'
                  }`}>
                    {level === 0 ? <Folder size={18} strokeWidth={3} /> : 
                     level === 1 ? <FolderPlus size={18} strokeWidth={3} /> : 
                     <Tag size={18} strokeWidth={3} />}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-800 tracking-tight text-sm">{cat.name}</span>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        postCount > 0 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {postCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-mono font-bold tracking-tighter uppercase mt-0.5">
                      {level === 0 ? 'Main Category' : level === 1 ? 'Sub-Branch' : 'Brand Tag'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {level < 2 && isEditor && (
                    <button 
                      onClick={() => { setParentId(cat.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors outline-none"
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  )}
                  {isAdmin && (
                    <button 
                      onClick={() => initiateDelete(cat)}
                      className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors outline-none"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
              {isExpanded && renderTree(cat.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const inputClass = "w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-200 shadow-sm hover:border-slate-300 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2.5 block";

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Architecting Structure...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <FolderTree size={22} />
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Structural Architecture</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">
              Define the hierarchical taxonomy for {categories.length} workspace segments.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isViewer && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl">
               <ShieldAlert size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Locked (Read-Only)</span>
            </div>
          )}
          {isRefreshing && (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl animate-pulse">
              <RefreshCcw size={14} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Syncing</span>
            </div>
          )}
        </div>
      </header>

      <div className={`grid grid-cols-1 ${isViewer ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-10`}>
        {!isViewer && (
          <div className="lg:col-span-4">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/20 sticky top-32">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <Plus size={20} strokeWidth={3} />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Provision Segment</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentAddingLevel}</p>
                 </div>
              </div>
              <form onSubmit={handleAddCategory} className="space-y-6">
                <div>
                  <label className={labelClass}>Segment Name</label>
                  <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Graphic Cards" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Placement Root</label>
                  <select value={parentId || ''} onChange={(e) => setParentId(e.target.value || null)} className={inputClass}>
                    <option value="">No Parent (Root Level)</option>
                    {availableParents.map(c => <option key={c.id} value={c.id}>{c.parentId ? '↳ ' : ''}{c.name}</option>)}
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 hover:bg-blue-700 transition-all active:scale-[0.98]">
                    <FolderPlus size={18} /> Inject Structure
                  </button>
                  {parentId && (
                    <button type="button" onClick={() => setParentId(null)} className="w-full mt-4 py-3 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">
                      Reset to Root
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={isViewer ? "lg:col-span-1" : "lg:col-span-8"}>
          <div className="bg-slate-50/50 p-2 rounded-[3.5rem] border border-slate-100">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm min-h-[600px]">
              <div className="flex items-center justify-between mb-10 pb-6 border-b border-slate-50">
                 <div className="flex items-center gap-3">
                    <Layers size={18} className="text-blue-600" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Hierarchy</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Main</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Sub</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Brand</span>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                {categories.filter(c => !c.parentId).length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <Package size={48} className="text-slate-100 mb-4" />
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">No structures defined</p>
                  </div>
                ) : (
                  renderTree(null)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {categoryToDelete && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-10 border-b border-slate-50 flex items-center gap-5 bg-red-50/30">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shadow-sm"><AlertTriangle size={28} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recursive Dependency</h3>
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-1">Impact Warning</p>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <p className="text-sm font-bold text-slate-600 leading-relaxed"><span className="font-black text-slate-900">"{categoryToDelete.name}"</span> contains nested branches. Choose resolution strategy:</p>
              <select value={reassignParentId} onChange={(e) => setReassignParentId(e.target.value as any)} className={inputClass}>
                <option value="DELETE_ALL">Purge All (Recursive Delete)</option>
                <option value="NONE">Move to Root (Detach dependents)</option>
                {availableParents.filter(p => p.id !== categoryToDelete.id).map(p => <option key={p.id} value={p.id}>Reassign to: {p.name}</option>)}
              </select>
              <div className="flex gap-4 pt-4">
                 <button onClick={finalizeDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100">Confirm Deletion</button>
                 <button onClick={() => setCategoryToDelete(null)} className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest">Abort</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
