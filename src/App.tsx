import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import SearchProducts from "./pages/SearchProducts";
import HowToUseSearch from "./pages/HowToUseSearch";
import AddProduct from "./pages/AddProduct";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PromoCodes from "./pages/PromoCodes";
import Donation from "./pages/Donation";
import Events from "./pages/Events";
import NewsUpdates from "./pages/NewsUpdates";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import AuthPrivacyPolicy from "./pages/auth/AuthPrivacyPolicy";
import AuthTermsOfService from "./pages/auth/AuthTermsOfService";
import AuthContactUs from "./pages/auth/AuthContactUs";
const queryClient = new QueryClient();
// Search products page for affiliate link system

const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/auth/privacy-policy" element={<AuthPrivacyPolicy />} />
                  <Route path="/auth/terms-of-service" element={<AuthTermsOfService />} />
                  <Route path="/auth/contact-us" element={<AuthContactUs />} />
                  <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/search-products" element={<SearchProducts />} />
            <Route path="/how-to-use-search" element={<HowToUseSearch />} />
            <Route path="/analytics" element={<Analytics />} />
                  <Route path="/news" element={<NewsUpdates />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/promo-codes" element={<PromoCodes />} />
                  <Route path="/donation" element={<Donation />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/contact-us" element={<ContactUs />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;