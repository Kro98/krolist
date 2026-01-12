import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.krolist.app',
  appName: 'Krolist',
  webDir: 'dist',
  
  // For development with hot-reload (comment out for production build)
  server: {
    url: 'https://15cbd782-509c-4ee1-ac76-12505f3f2668.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  
  // Android-specific configuration
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to false for production
  },
  
  // Plugins configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
