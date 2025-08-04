'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import SidePanel from '@/components/SidePanel';
import UserAlertSettings from '@/components/UserAlertSettings';

interface AlertSettingsContextProps {
  isOpen: boolean;
  openAlertSettings: () => void;
  closeAlertSettings: () => void;
  // Notification channel validation state
  notificationChannelsUpdatedAt: number;
  notifyChannelsUpdated: () => void;
}

// Create the context with default values
const AlertSettingsContext = createContext<AlertSettingsContextProps>({
  isOpen: false,
  openAlertSettings: () => {},
  closeAlertSettings: () => {},
  notificationChannelsUpdatedAt: 0,
  notifyChannelsUpdated: () => {},
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
  const [notificationChannelsUpdatedAt, setNotificationChannelsUpdatedAt] =
    useState(0);

  const openAlertSettings = () => setIsOpen(true);
  const closeAlertSettings = () => setIsOpen(false);

  // Function to notify that notification channels have been updated
  const notifyChannelsUpdated = () => {
    setNotificationChannelsUpdatedAt(Date.now());
  };

  // Handle successful channel configuration
  const handleChannelConfigSuccess = () => {
    notifyChannelsUpdated();
    closeAlertSettings();
  };

  return (
    <AlertSettingsContext.Provider
      value={{
        isOpen,
        openAlertSettings,
        closeAlertSettings,
        notificationChannelsUpdatedAt,
        notifyChannelsUpdated,
      }}
    >
      {children}

      {/* Alert Settings Panel */}
      <SidePanel
        isOpen={isOpen}
        onClose={closeAlertSettings}
        zIndex={50} // Higher z-index to ensure it displays above other content
        width='53%' // Set width to 53% of the screen
      >
        <UserAlertSettings onSuccess={handleChannelConfigSuccess} />
      </SidePanel>
    </AlertSettingsContext.Provider>
  );
};
