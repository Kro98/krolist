-- Create news_updates table for admin-managed news
CREATE TABLE public.news_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  title_ar TEXT,
  content_en TEXT NOT NULL,
  content_ar TEXT,
  category TEXT NOT NULL CHECK (category IN ('announcement', 'feature', 'update')),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_published BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published news"
  ON public.news_updates FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all news"
  ON public.news_updates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create page_content table for CMS
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key TEXT UNIQUE NOT NULL,
  content_en TEXT NOT NULL,
  content_ar TEXT,
  content_type TEXT DEFAULT 'text',
  category TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view page content"
  ON public.page_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage page content"
  ON public.page_content FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add admin RLS policies to krolist_products
CREATE POLICY "Admins can insert Krolist products"
  ON public.krolist_products FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update Krolist products"
  ON public.krolist_products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete Krolist products"
  ON public.krolist_products FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add updated_at trigger to news_updates
CREATE TRIGGER update_news_updates_updated_at
  BEFORE UPDATE ON public.news_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger to page_content
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();