-- Articles table with SEO and hero configuration
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  summary_en TEXT,
  summary_ar TEXT,
  meta_title_en TEXT,
  meta_title_ar TEXT,
  meta_description_en TEXT,
  meta_description_ar TEXT,
  canonical_url TEXT,
  og_image_url TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Hero configuration
  hero_bg_color TEXT DEFAULT '#000000',
  hero_bg_image_url TEXT,
  hero_bg_opacity INTEGER DEFAULT 15,
  hero_use_image BOOLEAN DEFAULT false,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  author_id UUID,
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Article content blocks (block-based editor)
CREATE TABLE public.article_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- 'text', 'image', 'video', 'callout', 'product_card', 'comparison', 'faq'
  content JSONB NOT NULL DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Article product cards (embedded products)
CREATE TABLE public.article_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.krolist_products(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, product_id)
);

-- Article comments
CREATE TABLE public.article_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.article_comments(id) ON DELETE CASCADE,
  user_id UUID,
  guest_name TEXT,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Article ratings (was this helpful?)
CREATE TABLE public.article_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Related articles (static, manual)
CREATE TABLE public.article_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  related_article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(article_id, related_article_id)
);

-- Article analytics for recommendations
CREATE TABLE public.article_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  session_id TEXT,
  user_id UUID,
  event_type TEXT NOT NULL, -- 'view', 'scroll_25', 'scroll_50', 'scroll_75', 'scroll_100', 'product_click', 'outbound_click', 'time_spent'
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_analytics ENABLE ROW LEVEL SECURITY;

-- Articles policies
CREATE POLICY "Anyone can view published articles" ON public.articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage all articles" ON public.articles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Article blocks policies
CREATE POLICY "Anyone can view article blocks" ON public.article_blocks FOR SELECT USING (EXISTS (SELECT 1 FROM articles WHERE id = article_id AND is_published = true));
CREATE POLICY "Admins can manage article blocks" ON public.article_blocks FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Article products policies
CREATE POLICY "Anyone can view article products" ON public.article_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage article products" ON public.article_products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Comments policies
CREATE POLICY "Anyone can view approved comments" ON public.article_comments FOR SELECT USING (is_approved = true);
CREATE POLICY "Anyone can insert comments" ON public.article_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage comments" ON public.article_comments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ratings policies
CREATE POLICY "Anyone can view ratings" ON public.article_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ratings" ON public.article_ratings FOR INSERT WITH CHECK (true);

-- Relations policies
CREATE POLICY "Anyone can view relations" ON public.article_relations FOR SELECT USING (true);
CREATE POLICY "Admins can manage relations" ON public.article_relations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Analytics policies
CREATE POLICY "Anyone can insert analytics" ON public.article_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view analytics" ON public.article_analytics FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_articles_slug ON public.articles(slug);
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_published ON public.articles(is_published, published_at DESC);
CREATE INDEX idx_article_blocks_article ON public.article_blocks(article_id, display_order);
CREATE INDEX idx_article_analytics_article ON public.article_analytics(article_id, created_at DESC);
CREATE INDEX idx_article_analytics_event ON public.article_analytics(event_type, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();