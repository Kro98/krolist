import { Card } from "@/components/ui/card";
import { Mail, Facebook, Twitter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

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
          <div className="grid md:grid-cols-2 gap-6">
            {/* Twitter Card */}
            <Card className="p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center">
                  <Twitter className="h-8 w-8 text-sky-500" />
                </div>
                <h2 className="text-xl font-semibold">{t('contact.twitter.title')}</h2>
                <p className="text-muted-foreground text-sm">{t('contact.twitter.content')}</p>
                <Button 
                  variant="default" 
                  className="w-full bg-sky-500 hover:bg-sky-600"
                  onClick={() => window.open('https://x.com/Krolist_help?t=FORGVQQEW-wvycDY09pzKg&s=03', '_blank')}
                >
                  @KROLIST_HELP
                </Button>
              </div>
            </Card>

            {/* Facebook Card */}
            <Card className="p-8 opacity-60">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Facebook className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">{t('contact.facebook.title')}</h2>
                <Button 
                  variant="secondary" 
                  disabled
                  className="w-full"
                >
                  {t('contact.comingSoon')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
