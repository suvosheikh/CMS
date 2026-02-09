
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DBService } from '../services/dbService';
import { PostLog, Reminder } from '../types';
import { 
  ChevronLeft, ChevronRight, Mail, StickyNote, 
  Calendar as CalIcon, MoreVertical, Layers
} from 'lucide-react';
import { MONTHS } from '../constants';

export const ContentCalendar: React.FC = () => {
  const [posts, setPosts] = useState<PostLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      DBService.getPosts(),
      DBService.getReminders()
    ]);
    setPosts(p);
    setReminders(r);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const month = currentViewDate.getMonth();
    const year = currentViewDate.getFullYear();
    const totalDays = daysInMonth(month, year);
    const startOffset = firstDayOfMonth(month, year);
    // Adjusted offset to start week from Monday (1)
    const adjustedOffset = startOffset === 0 ? 6 : startOffset - 1;

    const days = [];
    const prevMonthDays = daysInMonth(month - 1, year);
    for (let i = adjustedOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, currentMonth: false, dateStr });
    }
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, currentMonth: true, dateStr });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, currentMonth: false, dateStr });
    }
    return days;
  }, [currentViewDate]);

  const postsForSelectedDay = useMemo(() => {
    return posts.filter(p => p.date === selectedDate);
  }, [posts, selectedDate]);

  const remindersForSelectedDay = useMemo(() => {
    return reminders.filter(r => r.due_date === selectedDate);
  }, [reminders, selectedDate]);

  const getPostCountForDate = useCallback((dateStr: string) => {
    return posts.filter(p => p.date === dateStr).length;
  }, [posts]);

  const getReminderCountForDate = useCallback((dateStr: string) => {
    return reminders.filter(r => r.due_date === dateStr).length;
  }, [reminders]);

  const changeMonth = (offset: number) => {
    const next = new Date(currentViewDate);
    next.setMonth(next.getMonth() + offset);
    setCurrentViewDate(next);
  };

  const jumpToMonth = (index: number) => {
    const next = new Date(currentViewDate);
    next.setMonth(index);
    setCurrentViewDate(next);
  };

  const setYear = (year: number) => {
    const next = new Date(currentViewDate);
    next.setFullYear(year);
    setCurrentViewDate(next);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Compiling Schedule...</p>
    </div>
  );

  const viewYear = currentViewDate.getFullYear();

  return (
    <div className="animate-in fade-in duration-700">
      <div className="max-w-[1280px] mx-auto bg-[#f8f5ed] rounded-[2rem] shadow-2xl border-4 md:border-[10px] border-white relative overflow-hidden flex flex-col">
        
        {/* Ring Binder Holes */}
        <div className="hidden sm:flex h-12 items-center justify-around px-8 md:px-16 border-b border-black/5 bg-[#fcfaf4]">
           {[...Array(10)].map((_, i) => (
             <div key={i} className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-slate-200 border-t-2 border-slate-300 shadow-inner"></div>
           ))}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Main Calendar Body */}
          <div className="flex-1 p-4 md:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-black/5">
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <button onClick={() => changeMonth(-1)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"><ChevronLeft size={14}/></button>
                   <h2 className="text-xl md:text-2xl font-serif italic font-black text-[#2d3436] tracking-tight">
                     {MONTHS[currentViewDate.getMonth()]} {viewYear}
                   </h2>
                   <button onClick={() => changeMonth(1)} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"><ChevronRight size={14}/></button>
                </div>
                
                <div className="flex flex-col items-center">
                   <div className="bg-white/80 px-3 py-1 rounded-lg border border-slate-200 flex gap-4 shadow-sm">
                      {[2025, 2026, 2027].map(y => (
                        <button 
                          key={y}
                          onClick={() => setYear(y)} 
                          className={`text-[9px] font-black uppercase transition-all ${viewYear === y ? 'text-blue-600 underline decoration-2 underline-offset-4' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {y}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             {/* Grid */}
             <div className="grid grid-cols-7 gap-px bg-black/5 rounded-xl overflow-hidden border border-black/5 shadow-sm">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                  <div key={d} className="bg-[#fcfaf4] py-2 text-center border-b border-black/5">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</span>
                  </div>
                ))}
                {calendarDays.map((d, i) => {
                  const isActive = d.dateStr === selectedDate;
                  const postCount = d.dateStr ? getPostCountForDate(d.dateStr) : 0;
                  const noteCount = d.dateStr ? getReminderCountForDate(d.dateStr) : 0;
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => d.dateStr && setSelectedDate(d.dateStr)}
                      className={`min-h-[70px] md:min-h-[95px] p-2.5 md:p-4 transition-all relative group cursor-pointer ${
                        !d.currentMonth ? 'bg-[#efeeea] grayscale opacity-40' : 'bg-white hover:bg-blue-50/20'
                      } ${isActive ? '!bg-blue-50/80 ring-1 ring-inset ring-blue-500/20' : ''}`}
                    >
                       <div className="flex items-start justify-between">
                          {/* Date Number on Left */}
                          <span className={`text-2xl md:text-3xl font-serif italic font-bold leading-none ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                            {d.day}
                          </span>

                          {/* Icons Stacked Vertically on Right - BOLDER & LARGER */}
                          <div className="flex flex-col gap-1.5 items-end">
                            {postCount > 0 && d.currentMonth && (
                               <div className="relative animate-in zoom-in-50">
                                  <div className="w-8 h-7 md:w-10 md:h-8 bg-white border border-slate-100 rounded-md shadow-sm flex items-center justify-center text-slate-300 relative group-hover:text-blue-400 transition-colors">
                                     <Mail size={14} className="md:size-5" strokeWidth={2.5} />
                                     <div className="absolute -top-1.5 -right-1.5 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[7px] md:text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                       {postCount}
                                     </div>
                                  </div>
                               </div>
                            )}
                            {noteCount > 0 && d.currentMonth && (
                               <div className="relative animate-in zoom-in-50">
                                  <div className="w-8 h-7 md:w-10 md:h-8 bg-amber-50 border border-amber-100 rounded-md shadow-sm flex items-center justify-center text-amber-500 group-hover:bg-amber-100 transition-colors">
                                     <StickyNote size={14} className="md:size-5" strokeWidth={2.5} />
                                  </div>
                               </div>
                            )}
                          </div>
                       </div>

                       {isActive && (
                         <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-sm"></div>
                       )}
                    </div>
                  );
                })}
             </div>

             {/* Bottom Month Tabs */}
             <div className="pt-2 border-t border-black/5 flex justify-center items-center overflow-x-auto no-scrollbar pb-2">
                <div className="flex gap-1">
                   {MONTHS.map((m, i) => (
                     <button 
                       key={m} 
                       onClick={() => jumpToMonth(i)}
                       className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                         currentViewDate.getMonth() === i ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                       }`}
                     >
                       {m.substring(0, 3)}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Right Side Details Panel */}
          <div className="w-full lg:w-[320px] bg-white/40 p-4 md:p-6 flex flex-col space-y-4">
             <div className="space-y-0.5">
                <h3 className="text-xl md:text-2xl font-serif italic font-black text-[#2d3436] tracking-tight">
                  {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </h3>
                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Post Schedule</p>
             </div>

             {/* Post-it Note */}
             <div className="relative group transition-transform hover:-rotate-1 cursor-default">
                <div className="bg-[#fff984] p-5 rounded-sm shadow-lg shadow-amber-900/10 transform rotate-1 min-h-[120px] relative overflow-hidden border-t border-amber-200">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 bg-white/40 backdrop-blur-sm -mt-1"></div>
                   
                   <p className="text-[8px] font-black text-amber-800/60 uppercase tracking-widest mb-2">Daily Notes</p>
                   <div className="space-y-2">
                      {remindersForSelectedDay.length > 0 ? (
                        remindersForSelectedDay.map(r => (
                          <div key={r.id} className="flex items-start gap-1.5 border-b border-amber-200/40 pb-1 last:border-0">
                             <div className={`w-1 h-1 rounded-full mt-1.5 shrink-0 ${
                               r.priority === 'High' ? 'bg-red-500' : 'bg-amber-800/40'
                             }`}></div>
                             <p className="text-[10px] font-bold text-amber-900/80 leading-snug line-clamp-2">{r.title}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] font-serif italic text-amber-800/40">No instructions logged.</p>
                      )}
                   </div>
                </div>
             </div>

             <div className="space-y-3 flex-1">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Layers size={10} /> Distribution
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                   {postsForSelectedDay.length > 0 ? (
                     postsForSelectedDay.map(post => (
                       <div key={post.id} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                          <div className="flex items-center gap-2.5">
                             <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Mail size={10} />
                             </div>
                             <div className="overflow-hidden">
                                <p className="text-[10px] font-black text-slate-800 tracking-tight truncate max-w-[120px]">{post.product_model || 'Asset'}</p>
                                <p className={`text-[7px] font-bold uppercase mt-0.5 ${
                                  post.status === 'Published' ? 'text-emerald-500' : 'text-slate-400'
                                }`}>{post.status}</p>
                             </div>
                          </div>
                          <MoreVertical size={10} className="text-slate-200 group-hover:text-slate-400 shrink-0" />
                       </div>
                     ))
                   ) : (
                     <div className="py-8 flex flex-col items-center justify-center opacity-30 text-center">
                        <StickyNote size={20} className="mb-1.5" />
                        <p className="text-[8px] font-black uppercase tracking-widest">Empty</p>
                     </div>
                   )}
                </div>
             </div>

             <div className="pt-3 border-t border-black/5 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Architecture Sync</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
