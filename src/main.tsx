import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPWAPromptListener } from './lib/pwaInstall'

// Initialize PWA prompt listener early
initPWAPromptListener();

createRoot(document.getElementById("root")!).render(<App />)
