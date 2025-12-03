import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  const footerLinks = [
    { to: '/privacy-policy', label: t('privacyPolicy') },
    { to: '/terms-of-service', label: t('termsOfService') },
    { to: '/contact-us', label: t('contactUs') },
  ];

  return (
    <footer className="w-full border-t border-border bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-6">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
          {footerLinks.map((link, index) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {/* Copyright */}
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Krolist. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
