import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLanguage } from '@/contexts/LanguageContext';

interface BreadcrumbMapping {
  [key: string]: string;
}

export function PageBreadcrumbs() {
  const location = useLocation();
  const { t } = useLanguage();

  const breadcrumbMapping: BreadcrumbMapping = {
    products: t('nav.products') || 'Products',
    'search-products': t('nav.searchProducts') || 'Search Products',
    'add-product': t('nav.addProduct') || 'Add Product',
    analytics: t('nav.analytics') || 'Analytics',
    categories: t('nav.categories') || 'Categories',
    'promo-codes': t('nav.promoCodes') || 'Promo Codes',
    news: t('nav.news') || 'News & Updates',
    events: t('nav.events') || 'Events',
    donation: t('nav.donation') || 'Donation',
    settings: t('nav.settings') || 'Settings',
    admin: 'Admin',
    category: 'Category',
    'how-to-use-search': 'How to Use Search',
  };

  // Don't show breadcrumbs on home page or auth pages
  if (location.pathname === '/' || location.pathname.startsWith('/auth')) {
    return null;
  }

  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Don't show breadcrumbs if only one segment and it's the products page
  if (pathSegments.length === 1 && pathSegments[0] === 'products') {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/products">{t('nav.products') || 'Products'}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          
          // For category pages, use the title from location.state if available
          let label = breadcrumbMapping[segment] || segment;
          if (segment === 'category' && pathSegments[index + 1]) {
            // This is the "category" segment, skip it and use the next segment (the ID)
            return null;
          }
          if (pathSegments[index - 1] === 'category' && location.state?.categoryTitle) {
            // This is the category ID segment, replace with the title from state
            label = location.state.categoryTitle;
          }

          return (
            <span key={path} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
