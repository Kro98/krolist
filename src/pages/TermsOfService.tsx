import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function TermsOfService() {
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
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">{t('terms.title')}</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            {t('terms.lastUpdated')}
          </p>
        </div>
      </div>

      {/* Terms of Service Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.acceptance.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.acceptance.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.service.title')}</h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.service.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.accounts.title')}</h2>
            <Separator className="my-4" />
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                {t('terms.accounts.content')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.accounts.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.accounts.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.accounts.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.accounts.item4')}</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.acceptable.title')}</h2>
            <Separator className="my-4" />
            <div className="space-y-4 text-muted-foreground">
              <p className="leading-relaxed">
                {t('terms.acceptable.content')}
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.acceptable.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.acceptable.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.acceptable.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.acceptable.item4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.acceptable.item5')}</span>
                </li>
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.affiliate.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.affiliate.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.pricing.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.pricing.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.intellectual.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.intellectual.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.limitation.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.limitation.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.termination.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.termination.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.changes.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.changes.content')}
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">{t('terms.contact.title')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('terms.contact.content')}
            </p>
            <a 
              href={`mailto:${t('terms.contact.email')}`}
              className="text-primary hover:underline text-lg"
            >
              {t('terms.contact.email')}
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
