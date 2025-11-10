import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { CartProvider } from './contexts/CartContext'
import { Toaster } from './components/ui/toaster'
import { Toaster as SonnerToaster } from './components/ui/sonner'

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <LanguageProvider>
      <ThemeProvider>
        <CartProvider>
          <App />
          <Toaster />
          <SonnerToaster />
        </CartProvider>
      </ThemeProvider>
    </LanguageProvider>
  </AuthProvider>
)