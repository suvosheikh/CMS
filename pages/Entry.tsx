
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostLog, Category, User } from '../types';
import { DBService } from '../services/dbService';
import { CONTENT_TYPES, CONTENT_TAGS } from '../constants';
import { 
  Save, CheckCircle, Sparkles, X, Plus, 
  Briefcase, ShieldAlert, Calendar, Layers, 
  Bookmark, Link as LinkIcon, FileText,
  AlignLeft
} from 'lucide-react';

export const Entry: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tempModel, setTempModel] = useState('');
  const [uiModels, setUiModels] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({
    id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    content_type: CONTENT_TYPES[0],
    content_tag: CONTENT_TAGS[0],
    status: 'Planned',
    main_category_id: '',
    sub_category_id: '',
    brand_type_id: '',
    asset_link: '',
    notes: ''
  });

  useEffect(() => {
    Promise.all([
      DBService.getCategories(),
      DBService.getCurrentUser()
    ]).then(([cats, user]) => {
      setCategories(cats);
      setCurrentUser(user);
    });
  }, []);

  const role = currentUser?.role || 'Viewer';
  const isViewer = role === 'Viewer';

  const mainCats = categories.filter(c => !c.parentId);
  const subCats = categories.filter(c => c.parentId === formData.main_category_id);
  const brandCats = categories.filter(c => c.parentId === formData.sub_category_id);

  const addModel = () => {
    if (!tempModel.trim() || isViewer) return;
    const incomingModels = tempModel
      .split(',')
      .map(m => m.trim())
      .filter(m => m !== '' && !uiModels.includes(m));
    if (incomingModels.length > 0) {
      setUiModels(prev => [...prev, ...incomingModels]);
    }
    setTempModel('');
  };

  const removeModel = (index: number) => {
    if (isViewer) return;
    setUiModels(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    const month = formData.date ? formData.date.substring(0, 7) : '';
    const product_model = uiModels.join(', ');
    const postToSave: PostLog = { ...formData, month, product_model };

    try {
      await DBService.savePost(postToSave);
      setIsSuccess(true);
      setTimeout(() => navigate('/posts'), 1500);
    } catch (err) {
      alert("Error saving entry.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewer) return;
    const { name, value } = e.target;
    setFormData(prev => {
      const updates: any = { [name]: value };
      if (name === 'main_category_id') {
        updates.sub_category_id = '';
        updates.brand_type_id = '';
      } else if (name === 'sub_category_id') {
        updates.brand_type_id = '';
      }
      return { ...prev, ...updates };
    });
  };

  const inputClass = "w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none font-semibold text-sm text-slate-700 disabled:opacity-50 disabled:bg-slate-50 transition-all duration-200 hover:border-slate-300 shadow-sm";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2.5 block";

  if (isViewer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="p-6 bg-amber-50 text-amber-600 rounded-full shadow-inner"><ShieldAlert size={48} /></div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Access Restriction</h2>
        <button onClick={() => navigate('/posts')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95">Back to Repository</button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in zoom-in-95">
        <div className="p-8 bg-blue-50 text-blue-600 rounded-[2.5rem] animate-bounce shadow-lg"><CheckCircle size={64} strokeWidth={2.5} /></div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Log Captured!</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <Sparkles size={28} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter leading-none">Content Injection</h1>
            <p className="text-slate-500 font-semibold text-sm mt-1.5 leading-relaxed">
              Provisioning entry <span className="text-blue-600 font-black">{formData.id}</span> into workspace logs.
            </p>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 md:p-14 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* Timing & Status Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                   <Calendar size={14} className="text-blue-600" /> Workflow Details
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={labelClass}>Publish Date</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Workflow Stage</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                    <option value="Planned">Planned</option>
                    <option value="Working">Working</option>
                    <option value="Designed">Designed</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                   <Layers size={14} className="text-emerald-500" /> Structure Mapping
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={labelClass}>Main Category</label>
                  <select name="main_category_id" required value={formData.main_category_id} onChange={handleChange} className={inputClass}>
                    <option value="">Select Root Category</option>
                    {mainCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Subcategory</label>
                  <select name="sub_category_id" required value={formData.sub_category_id} onChange={handleChange} className={inputClass} disabled={!formData.main_category_id}>
                    <option value="">Select Sub-branch</option>
                    {subCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Specifications */}
            <div className="md:col-span-2 space-y-10 pt-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
                   <Bookmark size={14} className="text-amber-500" /> Content Specifications
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                    <label className={labelClass}>Brand / Variant</label>
                    <select name="brand_type_id" value={formData.brand_type_id} onChange={handleChange} className={inputClass} disabled={!formData.sub_category_id}>
                      <option value="">None / N/A</option>
                      {brandCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Content Format</label>
                    <select name="content_type" value={formData.content_type} onChange={handleChange} className={inputClass}>
                      {CONTENT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className={labelClass}>Strategic Goal</label>
                    <select name="content_tag" value={formData.content_tag} onChange={handleChange} className={inputClass}>
                      {CONTENT_TAGS.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                 </div>
              </div>

              {/* Asset Link Moved to top of this section area */}
              <div>
                <label className={labelClass}>Post Link (URL)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input name="asset_link" value={formData.asset_link} onChange={handleChange} placeholder="https://..." className={`${inputClass} pl-14`} />
                </div>
              </div>

              {/* Product Model Name - Now Full Width Below */}
              <div>
                <label className={labelClass}>Product Model Name(s)</label>
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      value={tempModel}
                      onChange={(e) => setTempModel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addModel())}
                      className={`${inputClass} pl-14`} 
                      placeholder="e.g. ASUS TUF F15 (Enter to add)" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={addModel}
                    className="px-8 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center shadow-lg"
                  >
                    <Plus size={22} strokeWidth={3} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 mt-5 min-h-[44px]">
                  {uiModels.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-2xl animate-in zoom-in-90">
                      <span className="text-[12px] font-black">{m}</span>
                      <button type="button" onClick={() => removeModel(idx)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                  {uiModels.length === 0 && (
                    <p className="text-[11px] font-bold text-slate-300 italic flex items-center gap-2 ml-2">
                      No models linked yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className={labelClass}>Production Notes</label>
                <div className="relative">
                  <AlignLeft className="absolute left-5 top-5 text-slate-300" size={18} />
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    rows={4} 
                    className={`${inputClass} pl-14 py-5 resize-none`} 
                    placeholder="Provide additional context, specifications or requirements..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-6 pt-12 border-t border-slate-50">
            <button 
              type="submit" 
              className="flex-1 py-6 bg-blue-600 text-white rounded-[2.25rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <Save size={20} strokeWidth={3} /> Authorize & Sync Entry
            </button>
            <button 
              type="button"
              onClick={() => navigate('/posts')}
              className="px-12 py-6 bg-slate-50 text-slate-400 rounded-[2.25rem] font-black text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              Abort
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
