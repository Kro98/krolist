import { Card } from "@/components/ui/card";
import { Mail, Twitter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

export default function ContactUs() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">{t('contact.title')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('contact.subtitle')}
          </p>
        </div>
      </div>

      {/* Contact Options */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-1 max-w-2xl mx-auto">
          {/* Email Card */}
          <Card className="p-8 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">{t('contact.email.title')}</h2>
              <p className="text-muted-foreground">
                {t('contact.email.content')}
              </p>
              <a 
                href="mailto:krolist.help@gmail.com"
                className="text-primary hover:underline text-lg font-medium"
              >
                krolist.help@gmail.com
              </a>
            </div>
          </Card>

          {/* Social Media Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* WhatsApp Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                  <WhatsAppIcon className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold">WhatsApp</h2>
                <p className="text-muted-foreground text-sm">{t('contact.twitter.content')}</p>
                <Button 
                  variant="default" 
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => window.open('https://whatsapp.com/channel/0029VbBpXPrAO7RImVlY0v3t', '_blank')}
                >
                  Join Channel
                </Button>
              </div>
            </Card>

            {/* Twitter Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                  <Twitter className="h-8 w-8 text-sky-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('contact.twitter.title')}</h2>
                <p className="text-muted-foreground text-sm">{t('contact.twitter.content')}</p>
                <Button 
                  variant="default" 
                  className="w-full bg-sky-500 hover:bg-sky-600"
                  onClick={() => window.open('https://x.com/Krolist_help', '_blank')}
                >
                  @KROLIST_HELP
                </Button>
              </div>
            </Card>

            {/* TikTok Card */}
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-pink-100 dark:bg-pink-950 flex items-center justify-center">
                  <TikTokIcon className="h-8 w-8 text-pink-500" />
                </div>
                <h2 className="text-xl font-semibold">TikTok</h2>
                <p className="text-muted-foreground text-sm">{t('contact.twitter.content')}</p>
                <Button 
                  variant="default" 
                  className="w-full bg-pink-500 hover:bg-pink-600"
                  onClick={() => window.open('https://www.tiktok.com/@krolist', '_blank')}
                >
                  @krolist
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
