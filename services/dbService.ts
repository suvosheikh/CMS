
import { PostLog, Category, User, Role, Campaign, AdCampaignEntry, Feedback, CreativeLog, CreativeSubOption, CreativeDesigner, Reminder } from '../types';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  CURRENT_USER: 'ryans_active_user'
};

export class DBService {
  private static isSupabaseConfigured(): boolean {
    const url = (supabase as any).supabaseUrl;
    return !!url && !url.includes('placeholder');
  }

  // --- AUTHENTICATION ---
  static async login(username: string, pass: string): Promise<{ user: User | null, setupRequired?: boolean, error?: string }> {
    if (!this.isSupabaseConfigured()) return { user: null, error: 'Supabase settings not applied.' };
    
    try {
      const { data, error } = await supabase
        .rpc('login_user', { 
          username_input: username, 
          password_input: pass 
        })
        .maybeSingle();

      if (error) {
        if (error.message.includes('function') || error.message.includes('login_user')) {
          return { user: null, setupRequired: true, error: 'RPC function login_user is missing.' };
        }
        return { user: null, error: error.message };
      }

      if (!data) {
        return { user: null, error: 'Invalid security key or username.' };
      }

      return { user: data as User | null };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  }

  static async updatePassword(userId: string, newPass: string): Promise<{success: boolean, error?: string}> {
    if (!this.isSupabaseConfigured()) return { success: false, error: 'Configuration missing.' };
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ password: newPass })
        .eq('id', userId);
      
      if (error) {
        console.error("Supabase update error:", error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- REMINDERS ---
  static async getReminders(): Promise<Reminder[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('reminders').select('*').order('created_at', { ascending: false });
      return (data as Reminder[]) || [];
    }
    return [];
  }
  static async saveReminder(reminder: Reminder): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('reminders').upsert(reminder); }
  static async deleteReminder(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('reminders').delete().eq('id', id); }

  // --- FEEDBACK ---
  static async getFeedback(): Promise<Feedback[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
      return (data as Feedback[]) || [];
    }
    return [];
  }

  static async toggleFeedbackResolution(id: string, is_resolved: boolean): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('feedbacks').update({ is_resolved }).eq('id', id);
    }
  }

  static async deleteFeedback(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('feedbacks').delete().eq('id', id);
    }
  }

  // --- POSTS ---
  static async getPosts(): Promise<PostLog[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('posts').select('*').order('date', { ascending: false });
      return (data as PostLog[]) || [];
    }
    return [];
  }
  static async savePost(post: PostLog): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('posts').upsert(post); }
  static async deletePost(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('posts').delete().eq('id', id); }

  // --- CREATIVE STORE ---
  static async getCreativeLogs(): Promise<CreativeLog[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('creative_logs').select('*').order('date', { ascending: false });
      return (data as CreativeLog[]) || [];
    }
    return [];
  }
  static async saveCreativeLog(log: CreativeLog): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('creative_logs').upsert(log); }
  static async deleteCreativeLog(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('creative_logs').delete().eq('id', id); }
  static async updateCreativeLogsCreatorName(oldName: string, newName: string): Promise<void> {
    if (this.isSupabaseConfigured()) await supabase.from('creative_logs').update({ creator_name: newName }).eq('creator_name', oldName);
  }

  static async getCreativeSubOptions(): Promise<CreativeSubOption[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('creative_sub_options').select('*');
      return (data as CreativeSubOption[]) || [];
    }
    return [];
  }
  static async saveCreativeSubOption(option: CreativeSubOption): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('creative_sub_options').upsert(option); }
  static async deleteCreativeSubOption(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('creative_sub_options').delete().eq('id', id); }

  static async getCreativeDesigners(): Promise<CreativeDesigner[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('creative_designers').select('*').order('name');
      return (data as CreativeDesigner[]) || [];
    }
    return [];
  }
  static async saveCreativeDesigner(designer: CreativeDesigner): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('creative_designers').upsert(designer); }
  static async deleteCreativeDesigner(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('creative_designers').delete().eq('id', id); }

  // --- CATEGORIES ---
  static async getCategories(): Promise<Category[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data as Category[]) || [];
    }
    return [];
  }
  static async saveCategory(cat: Category): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('categories').upsert(cat); }
  static async deleteCategory(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('categories').delete().eq('id', id); }

  // --- CAMPAIGNS ---
  static async getCampaigns(): Promise<Campaign[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('campaigns').select('*').order('start_date', { ascending: false });
      return (data as Campaign[]) || [];
    }
    return [];
  }
  static async saveCampaign(camp: Campaign): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('campaigns').upsert(camp); }
  static async deleteCampaign(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('campaigns').delete().eq('id', id); }

  // --- ADS CAMPAIGNS ---
  static async getAdsCampaigns(): Promise<AdCampaignEntry[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('ads_campaigns').select('*').order('start_date', { ascending: false });
      return (data as AdCampaignEntry[]) || [];
    }
    return [];
  }

  static async getAdsCampaignById(id: string): Promise<AdCampaignEntry | null> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('ads_campaigns').select('*').eq('id', id).maybeSingle();
      return (data as AdCampaignEntry) || null;
    }
    return null;
  }

  static async saveAdsCampaign(camp: AdCampaignEntry): Promise<void> { 
    if (this.isSupabaseConfigured()) await supabase.from('ads_campaigns').upsert(camp); 
  }

  static async deleteAdsCampaign(id: string): Promise<void> { 
    if (this.isSupabaseConfigured()) await supabase.from('ads_campaigns').delete().eq('id', id); 
  }

  // --- USERS ---
  static async getUsers(): Promise<User[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('users').select('*');
      return (data as User[]) || [];
    }
    return [];
  }
  static async saveUser(user: User): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('users').upsert(user); }
  static async deleteUser(id: string): Promise<void> { if (this.isSupabaseConfigured()) await supabase.from('users').delete().eq('id', id); }

  // --- SESSION ---
  static async getCurrentUser(): Promise<User | null> {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    try { return JSON.parse(data); } catch { return null; }
  }
  static setCurrentUser(user: User | null): void {
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}
