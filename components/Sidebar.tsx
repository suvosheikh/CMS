
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  FolderTree, 
  Users, 
  LogOut,
  ChevronDown,
  Briefcase,
  User as UserIcon,
  Megaphone,
  BarChart3,
  Paintbrush,
  Award,
  BellRing
} from 'lucide-react';
import { DBService } from '../services/dbService';
import { User } from '../types';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  isNew?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, badge, isNew }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`group flex items-center justify-between px-5 py-3 rounded-xl transition-all duration-300 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>
          {icon}
        </span>
        <span className={`text-[13px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {isNew && (
          <span className="bg-amber-400 text-white text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest shadow-sm">New</span>
        )}
        {badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-bold min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full transition-all ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
            {badge}
          </span>
        )}
        {!isActive && <ChevronDown size={12} className="text-slate-200" />}
      </div>
    </Link>
  );
};

export const Sidebar: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [counts, setCounts] = useState({ posts: 0, categories: 0, ads: 0, users: 0, creatives: 0, reminders: 0 });
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      const [user, posts, cats, adCamps, users, creatives, reminders] = await Promise.all([
        DBService.getCurrentUser(), 
        DBService.getPosts(), 
        DBService.getCategories(),
        DBService.getAdsCampaigns(),
        DBService.getUsers(),
        DBService.getCreativeLogs(),
        DBService.getReminders()
      ]);
      setCurrentUser(user);
      setCounts({
        posts: posts.length,
        categories: cats.length,
        ads: adCamps.length,
        users: users.length,
        creatives: creatives.length,
        reminders: reminders.filter(r => r.status !== 'Completed').length
      });
    };
    fetchData();
  }, [location.pathname]);

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="w-72 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-xl shadow-blue-200 shrink-0">
          CMS
        </div>
        <div className="flex flex-col">
          <div className="flex items-center">
            <img src="https://www.ryans.com/assets/images/ryans-logo.svg" alt="Ryans Logo" className="h-5 w-auto" />
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Workspace</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <NavItem to="/entry" icon={<Briefcase size={18} />} label="New Entry" isNew />
        <NavItem to="/posts" icon={<FileText size={18} />} label="Posts" badge={counts.posts} />
        <NavItem to="/categories" icon={<FolderTree size={18} />} label="Categories" badge={counts.categories} />
        <NavItem to="/brands" icon={<Award size={18} />} label="Brand Insights" />
        <NavItem to="/campaigns" icon={<BarChart3 size={18} />} label="Reports" />
        <NavItem to="/ads" icon={<Megaphone size={18} />} label="Ads Campaign" badge={counts.ads} />
        <NavItem to="/creative-store" icon={<Paintbrush size={18} />} label="Creative Store" badge={counts.creatives} />
        <NavItem to="/reminders" icon={<BellRing size={18} />} label="Reminders" badge={counts.reminders} />
        {isAdmin && (
          <NavItem to="/users" icon={<Users size={18} />} label="User Access" badge={counts.users} />
        )}
      </nav>

      <div className="p-6">
        <div className="bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100 flex flex-col">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em] mb-4">Active Identity</p>
          
          <div className="flex items-center gap-3">
            <Link 
              to="/profile"
              className="flex-1 flex items-center gap-3 group/user overflow-hidden hover:bg-white p-2 -m-2 rounded-2xl transition-all cursor-pointer"
            >
              <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-300 shadow-sm group-hover/user:border-blue-500 group-hover/user:text-blue-500 transition-all">
                <UserIcon size={18} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <p className="text-xs font-black text-slate-800 truncate group-hover/user:text-blue-600 transition-colors">
                  {currentUser?.name || 'Admin User'}
                </p>
                <span className="bg-red-50 text-red-500 text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-red-100 w-fit mt-0.5">
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
            </Link>

            <div className="flex flex-col gap-1">
              <button 
                onClick={onLogout}
                className="text-slate-300 hover:text-red-500 transition-colors p-1.5 bg-white border border-slate-100 rounded-lg shadow-sm"
                title="Secure Logout"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
