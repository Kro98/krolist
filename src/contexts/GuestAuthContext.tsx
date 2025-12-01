import { createContext, useContext, useState, ReactNode } from 'react';

interface GuestAuthContextType {
  showAuthModal: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openAuthModal = () => setShowAuthModal(true);
  const closeAuthModal = () => setShowAuthModal(false);

  return (
    <GuestAuthContext.Provider value={{ showAuthModal, openAuthModal, closeAuthModal }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const context = useContext(GuestAuthContext);
  if (context === undefined) {
    throw new Error('useGuestAuth must be used within a GuestAuthProvider');
  }
  return context;
}
