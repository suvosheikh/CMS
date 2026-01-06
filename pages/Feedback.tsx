
import React, { useState, useEffect, useMemo } from 'react';
import { DBService } from '../services/dbService';
import { Feedback, PostLog, User, FeedbackType } from '../types';
import { 
  MessageSquare, CheckCircle2, Circle, Clock, Filter, 
  Trash2, ExternalLink, ChevronRight, User as UserIcon,
  AlertCircle, PenTool, Type, HelpCircle
} from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('All');
  const [showResolved, setShowResolved] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [f, p, u, curr] = await Promise.all([
      DBService.getFeedback(),
      DBService.getPosts(),
      DBService.getUsers(),
      DBService.getCurrentUser()
    ]);
    setFeedbacks(f);
    setPosts(p);
    setUsers(u);
    setCurrentUser(curr);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return feedbacks.filter(f => {
      const matchType = filterType === 'All' || f.type === filterType;
      const matchResolved = showResolved ? true : !f.is_resolved;
      return matchType && matchResolved;
    });
  }, [feedbacks, filterType, showResolved]);

  const handleToggleResolve = async (id: string, currentStatus: boolean) => {
    await DBService.toggleFeedbackResolution(id, !currentStatus);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this feedback entry?')) {
      await DBService.deleteFeedback(id);
      fetchData();
    }
  };

  const getPostRef = (postId: string) => posts.find(p => p.id === postId);
  const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'Unknown User';

  const getTypeIcon = (type: FeedbackType) => {
    switch(type) {
      case 'Revision': return <PenTool size={14} />;
      case 'Design': return <ExternalLink size={14} />;
      case 'Caption': return <Type size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const getTypeColor = (type: FeedbackType) => {
    switch(type) {
      case 'Revision': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Design': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Caption': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Conversation Thread...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><MessageSquare size={16}/></span>
             <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Review & QA</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Feedback Inbox</h1>
          <p className="text-slate-500 font-medium">Collaborate on content revisions and creative improvements.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowResolved(!showResolved)}
             className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
               showResolved ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
             }`}
           >
             {showResolved ? 'Hide Resolved' : 'Show Resolved'}
           </button>
        </div>
      </header>

      <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex wrap gap-4 items-center">
        <Filter size={18} className="text-slate-400 ml-2" />
        {['All', 'Revision', 'Design', 'Caption', 'General'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filterType === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredData.length === 0 ? (
          <div className="bg-white rounded-[3rem] border border-slate-100 p-20 flex flex-col items-center text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200">
                <CheckCircle2 size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-800 tracking-tight">Zero Pending Feedback</h3>
             <p className="text-sm text-slate-400 max-w-sm">Everything looks good! New revision requests from your team will appear here.</p>
          </div>
        ) : (
          filteredData.map((f) => {
            const post = getPostRef(f.post_id);
            return (
              <div 
                key={f.id} 
                className={`bg-white rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/50 group overflow-hidden ${
                  f.is_resolved ? 'opacity-60 border-slate-100' : 'border-slate-100 hover:-translate-y-1'
                }`}
              >
                <div className="p-8 flex items-start gap-8">
                  <button 
                    onClick={() => handleToggleResolve(f.id, f.is_resolved)}
                    className={`mt-1 transition-transform active:scale-90 ${f.is_resolved ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}
                  >
                    {f.is_resolved ? <CheckCircle2 size={28} strokeWidth={2.5} /> : <Circle size={28} strokeWidth={2.5} />}
                  </button>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getTypeColor(f.type)}`}>
                           {getTypeIcon(f.type)} {f.type}
                         </span>
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1">
                           <Clock size={12} /> {new Date(f.created_at).toLocaleDateString()}
                         </span>
                       </div>
                       <button 
                         onClick={() => handleDelete(f.id)}
                         className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>

                    <p className={`text-base font-bold leading-relaxed transition-colors ${f.is_resolved ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {f.comment}
                    </p>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                             <UserIcon size={14} />
                          </div>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">{getUserName(f.user_id)}</p>
                       </div>

                       {post && (
                         <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl group/post cursor-pointer hover:bg-blue-50 transition-colors">
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Linked Post</p>
                               {/* Fix: Fixed property name access from camelCase to snake_case for PostLog */}
                               <p className="text-[11px] font-black text-slate-800 group-hover/post:text-blue-600 transition-colors">{post.id} • {post.product_model || 'General'}</p>
                            </div>
                            <ChevronRight size={14} className="text-slate-300 group-hover/post:text-blue-500 transition-all group-hover/post:translate-x-1" />
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
