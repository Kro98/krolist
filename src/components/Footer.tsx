import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Twitter } from 'lucide-react';

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

export function Footer() {
  const { t } = useLanguage();
  
  const footerLinks = [
    { to: '/privacy-policy', label: t('privacyPolicy') },
    { to: '/terms-of-service', label: t('termsOfService') },
    { to: '/contact-us', label: t('contactUs') }
  ];

  const socialLinks = [
    { href: 'https://whatsapp.com/channel/0029VbBpXPrAO7RImVlY0v3t', icon: WhatsAppIcon, label: 'WhatsApp' },
    { href: 'https://x.com/Krolist_help', icon: Twitter, label: 'Twitter' },
    { href: 'https://www.tiktok.com/@krolist', icon: TikTokIcon, label: 'TikTok' }
  ];

  return (
    <footer className="w-full border-t border-border bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container my-0 mx-[5px] px-[5px] py-[5px]">
        <div className="items-center gap-4 sm:items-center sm:justify-center sm:gap-[5px] mx-0 sm:flex sm:flex-row flex flex-row">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-0 mx-[5px] text-center"
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        {/* Copyright and Social Icons */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} Krolist. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}