
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
}

export type ContentType = 'Static' | 'Carousel' | 'Reel' | 'Video' | 'Story';

export type ContentTag = 
  | 'Offer' 
  | 'Launch' 
  | 'Feature Highlight' 
  | 'Comparison' 
  | 'Tips' 
  | 'Review' 
  | 'Setup Build';

export type PostStatus = 'Planned' | 'Designed' | 'Published';

export interface PostLog {
  id: string;
  date: string; 
  month: string; 
  main_category_id: string;
  sub_category_id: string;
  brand_type_id?: string;
  product_model: string; // The primary string stored in DB
  productModels?: string[]; // UI helper array
  content_type: ContentType;
  content_tag: ContentTag;
  campaign_name?: string;
  status: PostStatus;
  notes?: string;
  asset_link?: string;
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
