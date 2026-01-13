import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Image, Palette, Globe, Tags, X } from 'lucide-react';
import { Article } from '@/types/article';
import { BilingualInput } from './BilingualInput';

interface ArticleMetaFormProps {
  article: Partial<Article>;
  onChange: (updates: Partial<Article>) => void;
}

export const ArticleMetaForm = ({ article, onChange }: ArticleMetaFormProps) => {
  const [newTag, setNewTag] = useState('');
  const [heroOpen, setHeroOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  
  const handleTitleChange = (title: string) => {
    onChange({ 
      title_en: title,
      slug: article.slug || generateSlug(title),
    });
  };
  
  const addTag = () => {
    if (newTag.trim() && !article.tags?.includes(newTag.trim())) {
      onChange({ tags: [...(article.tags || []), newTag.trim()] });
      setNewTag('');
    }
  };
  
  const removeTag = (tag: string) => {
    onChange({ tags: article.tags?.filter(t => t !== tag) || [] });
  };
  
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bilingual Title with Auto-Translate */}
          <BilingualInput
            labelEn="Title (English) *"
            labelAr="Title (Arabic)"
            valueEn={article.title_en || ''}
            valueAr={article.title_ar || ''}
            onChangeEn={handleTitleChange}
            onChangeAr={(value) => onChange({ title_ar: value })}
            placeholderEn="Best Gaming Monitors in Saudi Arabia 2024"
            placeholderAr="أفضل شاشات الألعاب في السعودية 2024"
            context="article title for a product comparison website"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/articles/</span>
                <Input
                  id="slug"
                  value={article.slug || ''}
                  onChange={(e) => onChange({ slug: e.target.value })}
                  placeholder="best-gaming-monitors-2024"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={article.category || ''}
                onChange={(e) => onChange({ category: e.target.value })}
                placeholder="Monitors, GPUs, Laptops..."
              />
            </div>
          </div>
          
          {/* Bilingual Summary with Auto-Translate */}
          <BilingualInput
            labelEn="Summary (English)"
            labelAr="Summary (Arabic)"
            valueEn={article.summary_en || ''}
            valueAr={article.summary_ar || ''}
            onChangeEn={(value) => onChange({ summary_en: value })}
            onChangeAr={(value) => onChange({ summary_ar: value })}
            placeholderEn="A brief 2-line summary for the hero section..."
            placeholderAr="ملخص موجز للقسم الرئيسي..."
            multiline
            context="article summary/description for a product comparison website"
          />
          
          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {article.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
          </div>
          
          {/* Publish status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-base font-medium">Published</Label>
              <p className="text-sm text-muted-foreground">Make this article visible to the public</p>
            </div>
            <Switch
              checked={article.is_published || false}
              onCheckedChange={(checked) => onChange({ 
                is_published: checked,
                published_at: checked ? new Date().toISOString() : undefined,
              })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Hero Configuration */}
      <Collapsible open={heroOpen} onOpenChange={setHeroOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Hero Configuration
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${heroOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Use Background Image</Label>
                  <p className="text-sm text-muted-foreground">Enable hero background image</p>
                </div>
                <Switch
                  checked={article.hero_use_image || false}
                  onCheckedChange={(checked) => onChange({ hero_use_image: checked })}
                />
              </div>
              
              {article.hero_use_image && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="hero_bg_image">Background Image URL</Label>
                    <Input
                      id="hero_bg_image"
                      value={article.hero_bg_image_url || ''}
                      onChange={(e) => onChange({ hero_bg_image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Image Opacity: {article.hero_bg_opacity || 15}%</Label>
                    <Slider
                      value={[article.hero_bg_opacity || 15]}
                      onValueChange={([value]) => onChange({ hero_bg_opacity: value })}
                      min={5}
                      max={100}
                      step={5}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Background Color
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={article.hero_bg_color || '#000000'}
                    onChange={(e) => onChange({ hero_bg_color: e.target.value })}
                    className="w-12 h-10 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={article.hero_bg_color || '#000000'}
                    onChange={(e) => onChange({ hero_bg_color: e.target.value })}
                    className="w-32"
                  />
                </div>
              </div>
              
              {/* Hero Preview */}
              <div 
                className="relative h-32 rounded-lg overflow-hidden"
                style={{ backgroundColor: article.hero_bg_color || '#000000' }}
              >
                {article.hero_use_image && article.hero_bg_image_url && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${article.hero_bg_image_url})`,
                      opacity: (article.hero_bg_opacity || 15) / 100,
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-xs text-muted-foreground mb-1">Preview</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {article.title_en || 'Article Title'}
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* SEO Meta */}
      <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  SEO & Meta Tags
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Bilingual Meta Title with Auto-Translate */}
              <BilingualInput
                labelEn="Meta Title (English)"
                labelAr="Meta Title (Arabic)"
                valueEn={article.meta_title_en || ''}
                valueAr={article.meta_title_ar || ''}
                onChangeEn={(value) => onChange({ meta_title_en: value })}
                onChangeAr={(value) => onChange({ meta_title_ar: value })}
                placeholderEn="SEO optimized title (60 chars max)"
                placeholderAr="عنوان محسن لمحركات البحث"
                maxLength={60}
                context="SEO meta title for search engines"
              />
              
              {/* Bilingual Meta Description with Auto-Translate */}
              <BilingualInput
                labelEn="Meta Description (English)"
                labelAr="Meta Description (Arabic)"
                valueEn={article.meta_description_en || ''}
                valueAr={article.meta_description_ar || ''}
                onChangeEn={(value) => onChange({ meta_description_en: value })}
                onChangeAr={(value) => onChange({ meta_description_ar: value })}
                placeholderEn="SEO description (160 chars max)"
                placeholderAr="وصف محسن لمحركات البحث"
                multiline
                maxLength={160}
                context="SEO meta description for search engines"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="canonical">Canonical URL</Label>
                  <Input
                    id="canonical"
                    value={article.canonical_url || ''}
                    onChange={(e) => onChange({ canonical_url: e.target.value })}
                    placeholder="https://krolist.com/articles/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_image">OG Image URL</Label>
                  <Input
                    id="og_image"
                    value={article.og_image_url || ''}
                    onChange={(e) => onChange({ og_image_url: e.target.value })}
                    placeholder="https://... (1200x630 recommended)"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
