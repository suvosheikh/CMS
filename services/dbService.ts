
import { PostLog, Category, User, Role, Campaign, AdCampaignEntry, Feedback } from '../types';
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
  static async login(username: string, pass: string): Promise<User | null> {
    if (!this.isSupabaseConfigured()) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.eq.${username},email.eq.${username}`)
      .eq('password', pass)
      .maybeSingle();

    if (error) {
      console.error('Login technical error:', error.message);
      return null;
    }

    return data as User | null;
  }

  static async updatePassword(userId: string, newPass: string): Promise<boolean> {
    if (!this.isSupabaseConfigured()) return false;
    const { error } = await supabase
      .from('users')
      .update({ password: newPass })
      .eq('id', userId);
    
    return !error;
  }

  // --- POSTS ---
  static async getPosts(): Promise<PostLog[]> {
    if (this.isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('date', { ascending: false });
      return (data as PostLog[]) || [];
    }
    return [];
  }

  static async savePost(post: PostLog): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('posts').upsert(post);
    }
  }

  static async deletePost(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('posts').delete().eq('id', id);
    }
  }

  // --- CATEGORIES ---
  static async getCategories(): Promise<Category[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('categories').select('*').order('name');
      return (data as Category[]) || [];
    }
    return [];
  }

  static async saveCategory(cat: Category): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('categories').upsert(cat);
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('categories').delete().eq('id', id);
    }
  }

  // --- ORIGINAL CAMPAIGNS ---
  static async getCampaigns(): Promise<Campaign[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('campaigns').select('*').order('start_date', { ascending: false });
      return (data as Campaign[]) || [];
    }
    return [];
  }

  static async saveCampaign(camp: Campaign): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('campaigns').upsert(camp);
    }
  }

  static async deleteCampaign(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('campaigns').delete().eq('id', id);
    }
  }

  // --- NEW ADS CAMPAIGNS ---
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
      return data as AdCampaignEntry | null;
    }
    return null;
  }

  static async saveAdsCampaign(camp: AdCampaignEntry): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('ads_campaigns').upsert(camp);
    }
  }

  static async deleteAdsCampaign(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('ads_campaigns').delete().eq('id', id);
    }
  }

  // --- USERS ---
  static async getUsers(): Promise<User[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase.from('users').select('*');
      return (data as User[]) || [];
    }
    return [];
  }

  static async saveUser(user: User): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('users').upsert(user);
    }
  }

  static async deleteUser(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('users').delete().eq('id', id);
    }
  }

  // --- FEEDBACK ---
  static async getFeedback(): Promise<Feedback[]> {
    if (this.isSupabaseConfigured()) {
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      return (data as Feedback[]) || [];
    }
    return [];
  }

  static async toggleFeedbackResolution(id: string, isResolved: boolean): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase
        .from('feedback')
        .update({ is_resolved: isResolved })
        .eq('id', id);
    }
  }

  static async deleteFeedback(id: string): Promise<void> {
    if (this.isSupabaseConfigured()) {
      await supabase.from('feedback').delete().eq('id', id);
    }
  }

  // --- SESSION MANAGEMENT ---
  static async getCurrentUser(): Promise<User | null> {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }
}
