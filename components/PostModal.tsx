
import React, { useState, useEffect } from 'react';
import { PostLog, Category } from '../types';
import { DBService } from '../services/dbService';
import { CONTENT_TYPES, CONTENT_TAGS } from '../constants';
import { 
  X, Save, Layers, Package, Plus, Trash2, 
  Sparkles, Calendar, Clock, Bookmark, 
  Link as LinkIcon, FileText, AlignLeft
} from 'lucide-react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: PostLog) => void;
  initialData?: PostLog | null;
}

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tempModel, setTempModel] = useState('');
  const [uiModels, setUiModels] = useState<string[]>([]);
  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    content_type: CONTENT_TYPES[0],
    content_tag: CONTENT_TAGS[0],
    status: 'Planned',
    main_category_id: '',
    sub_category_id: '',
    brand_type_id: '',
    product_model: '',
    asset_link: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        DBService.getCategories()
      ]).then(([cats]) => {
        setCategories(cats);

        if (initialData) {
          const models = initialData.product_model ? initialData.product_model.split(',').map(m => m.trim()).filter(Boolean) : [];
          setUiModels(models);
          setFormData({ ...initialData });
        } else {
          setUiModels([]);
          setFormData({
            id: `P-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            content_type: CONTENT_TYPES[0],
            content_tag: CONTENT_TAGS[0],
            status: 'Planned',
            main_category_id: '',
            sub_category_id: '',
            brand_type_id: '',
            product_model: '',
            asset_link: '',
            notes: ''
          });
        }
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const mainCats = categories.filter(c => !c.parentId);
  const subCats = categories.filter(c => c.parentId === formData.main_category_id);
  const brandCats = categories.filter(c => c.parentId === formData.sub_category_id);

  const addModel = () => {
    if (!tempModel.trim()) return;
    const incomingModels = tempModel.split(',').map(m => m.trim()).filter(m => m !== '' && !uiModels.includes(m));
    if (incomingModels.length > 0) setUiModels(prev => [...prev, ...incomingModels]);
    setTempModel('');
  };

  const removeModel = (index: number) => setUiModels(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const month = formData.date ? formData.date.substring(0, 7) : '';
    const product_model = uiModels.join(', ');
    onSave({ ...formData, month, product_model } as PostLog);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const inputClass = "w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all duration-200 shadow-sm hover:border-slate-300 text-[13px] font-semibold text-slate-700 placeholder:text-slate-400";
  const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-2.5 block";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 relative border border-white/20">
        
        <div className="flex items-center justify-between p-10 border-b border-slate-50 sticky top-0 bg-white/90 backdrop-blur-xl z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-600 rounded-[1.75rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <Sparkles size={28} strokeWidth={2.5}/>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                {initialData ? 'Update Workspace Log' : 'Inject New Post Entry'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full transition-all text-slate-300 hover:text-slate-900"><X size={24} strokeWidth={3}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {/* Timing & Status Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2"><Calendar size={14} className="text-blue-600" /> Timing & Status</h3>
              </div>
              <div className="space-y-6">
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

            {/* Category Mapping Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2"><Layers size={14} className="text-emerald-500" /> Category Mapping</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className={labelClass}>Main Category</label>
                  <select name="main_category_id" required value={formData.main_category_id || ''} onChange={handleChange} className={inputClass}>
                    <option value="">Select Root Category</option>
                    {mainCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Subcategory</label>
                  <select name="sub_category_id" required value={formData.sub_category_id || ''} onChange={handleChange} className={inputClass} disabled={!formData.main_category_id}>
                    <option value="">{formData.main_category_id ? 'Select Subcategory' : 'Select Main Category first'}</option>
                    {subCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Content Specs */}
            <div className="col-span-full pt-4 space-y-10">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2"><Bookmark size={14} className="text-amber-500" /> Specifications</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className={labelClass}>Brand / Variant</label>
                  <select name="brand_type_id" value={formData.brand_type_id || ''} onChange={handleChange} className={inputClass} disabled={!formData.sub_category_id}>
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

              {/* Asset Link Field */}
              <div>
                <label className={labelClass}>Asset Link (URL)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input name="asset_link" value={formData.asset_link} onChange={handleChange} placeholder="https://..." className={`${inputClass} pl-14`} />
                </div>
              </div>

              {/* Product Model Tag Input - Now Full Width */}
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
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-100 px-4 py-2 rounded-2xl">
                      <span className="text-[12px] font-black">{m}</span>
                      <button type="button" onClick={() => removeModel(idx)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Area */}
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
                    placeholder="Provide additional context or requirements..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 pt-10 border-t border-slate-50 justify-end">
            <button type="button" onClick={onClose} className="px-8 py-5 text-slate-400 hover:text-slate-900 font-black text-xs uppercase tracking-[0.2em]">Abort</button>
            <button type="submit" className="px-12 py-5 bg-blue-600 text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all flex items-center gap-3"><Save size={18} strokeWidth={3}/> Commit Entry</button>
          </div>
        </form>
      </div>
    </div>
  );
};
