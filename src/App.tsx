import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { GuestAuthProvider } from "@/contexts/GuestAuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Products from "./pages/Products";
import SearchProducts from "./pages/SearchProducts";
import HowToUseSearch from "./pages/HowToUseSearch";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PromoCodes from "./pages/PromoCodes";
import Donation from "./pages/Donation";
import Events from "./pages/Events";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import CategoryTags from "@/pages/CategoryTags";
import CategoryProducts from "@/pages/CategoryProducts";
import MyOrders from "./pages/MyOrders";
const queryClient = new QueryClient();

// Initialize settings from localStorage
const initializeSettings = () => {
  const titleScrollSpeed = localStorage.getItem('titleScrollSpeed');
  if (titleScrollSpeed) {
    document.documentElement.style.setProperty('--marquee-speed', `${titleScrollSpeed}s`);
  }
};
initializeSettings();
const App = () => <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <GuestAuthProvider>
            <CartProvider>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Products />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/search-products" element={<SearchProducts />} />
                      <Route path="/how-to-use-search" element={<HowToUseSearch />} />
                      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/promo-codes" element={<PromoCodes />} />
                      <Route path="/donation" element={<Donation />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/categories" element={<CategoryTags />} className="px-[5px]" />
                      <Route path="/category/:categoryId" element={<CategoryProducts />} className="px-[5px]" />
                      <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-of-service" element={<TermsOfService />} />
                      <Route path="/contact-us" element={<ContactUs />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                </BrowserRouter>
              </TooltipProvider>
            </CartProvider>
          </GuestAuthProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>;
export default App;