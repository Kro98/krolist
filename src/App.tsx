import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GuestAuthProvider } from "@/contexts/GuestAuthContext";
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
import { AdminLayout } from "@/components/admin/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <GuestAuthProvider>
              <TooltipProvider>
                <Toaster />
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

                    {/* Admin - protected with role check */}
                    <Route path="/admin" element={<AdminLayout><Admin /></AdminLayout>} />
                    <Route path="/admin/articles" element={<AdminLayout><ArticlesManager /></AdminLayout>} />
                    <Route path="/admin/articles/:id" element={<AdminLayout><ArticleEditor /></AdminLayout>} />


                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </GuestAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
