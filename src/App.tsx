import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Products from "./pages/Products";
import SearchProducts from "./pages/SearchProducts";
import AddProduct from "./pages/AddProduct";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import PromoCodes from "./pages/PromoCodes";
import Donation from "./pages/Donation";
import Events from "./pages/Events";
import NewsUpdates from "./pages/NewsUpdates";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();
// Search products page for affiliate link system

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/" element={<Products />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/add-product" element={<AddProduct />} />
                  <Route path="/search-products" element={<SearchProducts />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/news" element={<NewsUpdates />} />
                  <Route path="/events" element={<Events />} />
                  <Route path="/promo-codes" element={<PromoCodes />} />
                  <Route path="/donation" element={<Donation />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
