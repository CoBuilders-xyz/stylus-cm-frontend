'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import SidePanel from '@/components/SidePanel';
import UserAlertSettings from '@/components/UserAlertSettings';

interface AlertSettingsContextProps {
  isOpen: boolean;
  openAlertSettings: () => void;
  closeAlertSettings: () => void;
}

// Create the context with default values
const AlertSettingsContext = createContext<AlertSettingsContextProps>({
  isOpen: false,
  openAlertSettings: () => {},
  closeAlertSettings: () => {},
});

// Custom hook for accessing the alert settings context
export const useAlertSettings = () => useContext(AlertSettingsContext);

interface AlertSettingsProviderProps {
  children: ReactNode;
}

export const AlertSettingsProvider = ({
  children,
}: AlertSettingsProviderProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const openAlertSettings = () => setIsOpen(true);
  const closeAlertSettings = () => setIsOpen(false);

  return (
    <AlertSettingsContext.Provider
      value={{ isOpen, openAlertSettings, closeAlertSettings }}
    >
      {children}

      {/* Alert Settings Panel */}
      <SidePanel
        isOpen={isOpen}
        onClose={closeAlertSettings}
        zIndex={50} // Higher z-index to ensure it displays above other content
        width='53%' // Set width to 53% of the screen
      >
        <UserAlertSettings onSuccess={closeAlertSettings} />
      </SidePanel>
    </AlertSettingsContext.Provider>
  );
};
