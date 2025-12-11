import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">{t('privacy.title')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('privacy.lastUpdated')}
          </p>
        </div>
      </div>

      {/* Privacy Policy Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.intro.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.intro.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.infoCollect.title')}</h2>
            <Separator className="my-4" />
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t('privacy.infoCollect.account.title')}</h3>
                <p className="leading-relaxed">
                  {t('privacy.infoCollect.account.content')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t('privacy.infoCollect.usage.title')}</h3>
                <p className="leading-relaxed">
                  {t('privacy.infoCollect.usage.content')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">{t('privacy.infoCollect.device.title')}</h3>
                <p className="leading-relaxed">
                  {t('privacy.infoCollect.device.content')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.howWeUse.title')}</h2>
            <Separator className="my-4" />
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.howWeUse.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.howWeUse.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.howWeUse.item3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.howWeUse.item4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.howWeUse.item5')}</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.dataSharing.title')}</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.dataSharing.content')}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.dataSharing.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.dataSharing.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.dataSharing.item3')}</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.security.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.security.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.rights.title')}</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.rights.content')}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.rights.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.rights.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.rights.item3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{t('privacy.rights.item4')}</span>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.cookies.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.cookies.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.changes.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.changes.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('privacy.contact.title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.contact.content')}
            </p>
            <a 
              href={`mailto:${t('privacy.contact.email')}`}
              className="text-primary hover:underline text-lg"
            >
              {t('privacy.contact.email')}
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
