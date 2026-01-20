
export type Role = 'Admin' | 'Editor' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

export type AdStatus = 'Active' | 'Paused' | 'Completed' | 'Planned';

export interface Campaign {
  id: string;
  subject: string;
  start_date: string;
}

export interface AdDailyMetric {
  date: string;
  reach: number;
  impression: number;
  result: number;
  spend: number;
}

export interface AdCampaignEntry {
  id: string;
  platform: 'Meta' | 'Google' | 'Others';
  subject: string;
  media_type: string;
  primary_kpi: string;
  planned_duration: number;
  total_budget: number;
  spend: number;
  status: AdStatus;
  start_date: string;
  end_date?: string;
  paused_date?: string;
  result: string;
  cost_per_result: number;
  impression: number;
  reach: number;
  other_effects: string;
  daily_metrics?: AdDailyMetric[];
  last_updated_at?: string;
}

export type ContentType = 
  | 'Static' 
  | 'Carousel' 
  | 'Reel' 
  | 'Video' 
  | 'Story';

export type ContentTag = 
  | 'Offer'
  | 'Launch'
  | 'Feature Highlight'
  | 'Review'
  | 'Tips'
  | 'Gift Handover'
  | 'Branding';

export type PostStatus = 'Planned' | 'Working' | 'Designed' | 'Published';

export interface PostLog {
  id: string;
  date: string; 
  month: string; 
  main_category_id: string;
  sub_category_id: string;
  brand_type_id?: string;
  product_model: string; 
  productModels?: string[]; 
  content_type: ContentType;
  content_tag: ContentTag;
  campaign_name?: string;
  status: PostStatus;
  notes?: string;
  asset_link?: string;
}

export interface CreativeDesigner {
  id: string;
  name: string;
}

export type CreativePlatform = 
  | 'Branch' 
  | 'Social Media' 
  | 'Ads' 
  | 'Website' 
  | 'Website Offer' 
  | 'Thumbnail' 
  | 'Print' 
  | 'TV Content' 
  | 'Others';

export type CreativeMedium = 'Digital Image' | 'Physical Image' | 'Video';

export interface CreativeLog {
  id: string;
  date: string;
  creator_name: string;
  subject: string;
  platform: CreativePlatform;
  medium: CreativeMedium;
  amount: number;
  selected_options?: string;
  created_at?: string;
}

export interface CreativeSubOption {
  id: string;
  platform: CreativePlatform;
  name: string;
}

export type FeedbackType = 'Revision' | 'Design' | 'Caption' | 'General';

export interface Feedback {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  type: FeedbackType;
  is_resolved: boolean;
  created_at: string;
}

export type ReminderStatus = 'Pending' | 'Working' | 'Completed';
export type ReminderPriority = 'Low' | 'Medium' | 'High';

export interface Reminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: ReminderStatus;
  priority: ReminderPriority;
  created_at?: string;
  completed_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
}
