import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Activity, 
  ChevronRight, 
  LayoutDashboard, 
  FileText, 
  FolderTree, 
  Users, 
  Briefcase, 
  Tags, 
  MessageSquare,
  User as UserIcon,
  BarChart3
} from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageContext = () => {
    const path = location.pathname;
    switch (path) {
      case '/': return { title: 'Workspace Intelligence', icon: <LayoutDashboard size={18} /> };
      case '/entry': return { title: 'Content Injection', icon: <Briefcase size={18} /> };
      case '/posts': return { title: 'Repository Archives', icon: <FileText size={18} /> };
      case '/categories': return { title: 'Structural Architecture', icon: <FolderTree size={18} /> };
      case '/campaigns': return { title: 'Performance Analytics', icon: <BarChart3 size={18} /> };
      case '/comments': return { title: 'Review Feed', icon: <MessageSquare size={18} /> };
      case '/users': return { title: 'Access Governance', icon: <Users size={18} /> };
      case '/profile': return { title: 'Identity Security', icon: <UserIcon size={18} /> };
      default: return { title: 'System Operations', icon: <Activity size={18} /> };
    }
  };

  const context = getPageContext();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
            {context.icon}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest">Ryans</span>
               </div>
               <ChevronRight size={10} className="text-slate-200" />
               <span className="text-[10px] font-black text-blue-600 tracking-widest">MarCom</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none mt-0.5">{context.title}</h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-10">
        <div className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Infrastructure: <span className="text-red-600">Live</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-none">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest mt-1">
              {currentTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </header>
  );
};