export interface Article {
  id: string;
  slug: string;
  title_en: string;
  title_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  meta_title_en?: string;
  meta_title_ar?: string;
  meta_description_en?: string;
  meta_description_ar?: string;
  canonical_url?: string;
  og_image_url?: string;
  category?: string;
  tags?: string[];
  hero_bg_color?: string;
  hero_bg_image_url?: string;
  hero_bg_opacity?: number;
  hero_use_image?: boolean;
  is_published?: boolean;
  published_at?: string;
  author_id?: string;
  view_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ArticleBlock {
  id: string;
  article_id: string;
  block_type: 'text' | 'image' | 'video' | 'callout' | 'product_card' | 'comparison' | 'faq';
  content: Record<string, unknown>;
  display_order: number;
  created_at?: string;
}

export interface ArticleProduct {
  id: string;
  article_id: string;
  product_id: string;
  display_order: number;
  product?: KrolistProduct;
}

export interface KrolistProduct {
  id: string;
  title: string;
  description?: string;
  current_price: number;
  original_price: number;
  currency: string;
  original_currency: string;
  image_url?: string;
  product_url: string;
  store: string;
  category?: string;
  youtube_url?: string;
  availability_status?: string;
  last_checked_at?: string;
}

export interface ArticleComment {
  id: string;
  article_id: string;
  parent_id?: string;
  user_id?: string;
  guest_name?: string;
  content: string;
  upvotes: number;
  is_approved: boolean;
  created_at?: string;
  replies?: ArticleComment[];
}

export interface ArticleRating {
  id: string;
  article_id: string;
  user_id?: string;
  session_id?: string;
  is_helpful: boolean;
  created_at?: string;
}

export interface ArticleRelation {
  id: string;
  article_id: string;
  related_article_id: string;
  display_order: number;
  related_article?: Article;
}

export interface ArticleAnalytics {
  id: string;
  article_id: string;
  session_id?: string;
  user_id?: string;
  event_type: 'view' | 'scroll_25' | 'scroll_50' | 'scroll_75' | 'scroll_100' | 'product_click' | 'outbound_click' | 'time_spent';
  event_data?: Record<string, unknown>;
  created_at?: string;
}

export interface PriceInsight {
  typical_low: number;
  typical_high: number;
  lowest_recorded: number;
  current_lowest: number;
  volatility: 'stable' | 'moderate' | 'volatile';
  currency: string;
}
