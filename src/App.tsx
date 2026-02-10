import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestAuthProvider } from "@/contexts/GuestAuthContext";
import { SeasonalThemeProvider } from "@/contexts/SeasonalThemeContext";
import SeasonalBackground from "@/components/SeasonalBackground";
import AffiliateMode from "./pages/AffiliateMode";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import Stickers from "./pages/Stickers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import ArticlesManager from "./pages/admin/ArticlesManager";
import ArticleEditor from "./pages/admin/ArticleEditor";
import { AffiliateShell } from "@/components/affiliate/AffiliateShell";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

// Initialize settings from localStorage
const initializeSettings = () => {
  const titleScrollSpeed = localStorage.getItem('titleScrollSpeed');
  if (titleScrollSpeed) {
    document.documentElement.style.setProperty('--marquee-speed', `${titleScrollSpeed}s`);
  }
};
initializeSettings();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <GuestAuthProvider>
              <CartProvider>
                <SeasonalThemeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <SeasonalBackground />
                    <BrowserRouter>
                      <Routes>
                        {/* Default: Affiliate Mode */}
                        <Route path="/" element={<AffiliateMode />} />
                        <Route path="/products" element={<Navigate to="/" replace />} />
                        <Route path="/affiliate" element={<Navigate to="/" replace />} />

                        {/* Articles & Stickers in affiliate shell */}
                        <Route path="/articles" element={
                          <AffiliateShell>
                            <Articles />
                          </AffiliateShell>
                        } />
                        <Route path="/articles/:slug" element={
                          <AffiliateShell>
                            <Article />
                          </AffiliateShell>
                        } />
                        <Route path="/stickers" element={
                          <AffiliateShell>
                            <Stickers />
                          </AffiliateShell>
                        } />

                        {/* Legal / Info pages */}
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        <Route path="/contact-us" element={<ContactUs />} />

                        {/* Admin - protected, uses legacy Layout for sidebar */}
                        <Route path="/admin" element={<Layout><Admin /></Layout>} />
                        <Route path="/admin/articles" element={<Layout><ArticlesManager /></Layout>} />
                        <Route path="/admin/articles/:id" element={<Layout><ArticleEditor /></Layout>} />

                        {/* Legacy redirects */}
                        <Route path="/events" element={<Navigate to="/" replace />} />
                        <Route path="/analytics" element={<Navigate to="/" replace />} />
                        <Route path="/search-products" element={<Navigate to="/" replace />} />
                        <Route path="/categories" element={<Navigate to="/" replace />} />
                        <Route path="/category/:categoryId" element={<Navigate to="/" replace />} />
                        <Route path="/my-orders" element={<Navigate to="/" replace />} />
                        <Route path="/donation" element={<Navigate to="/" replace />} />
                        <Route path="/promo-codes" element={<Navigate to="/" replace />} />
                        <Route path="/settings" element={<Navigate to="/" replace />} />
                        <Route path="/how-to-use-search" element={<Navigate to="/" replace />} />

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
                </SeasonalThemeProvider>
              </CartProvider>
            </GuestAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
