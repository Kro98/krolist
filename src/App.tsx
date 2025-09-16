import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import Settings from "./pages/Settings";
import PromoCodes from "./pages/PromoCodes";
import Donation from "./pages/Donation";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Products />} />
              <Route path="/products" element={<Products />} />
              <Route path="/add-product" element={<AddProduct />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/promo-codes" element={<PromoCodes />} />
              <Route path="/donation" element={<Donation />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
