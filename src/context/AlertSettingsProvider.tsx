'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import SidePanel from '@/components/SidePanel';
import UserAlertSettings from '@/components/UserAlertSettings';
import { useMediaQuery } from '@/hooks/use-media-query';

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
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const panelWidth = isDesktop ? '53%' : '100%';

  useEffect(() => {
    if (!isOpen || isDesktop) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const previousStyles = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';

    return () => {
      body.style.position = previousStyles.position;
      body.style.top = previousStyles.top;
      body.style.width = previousStyles.width;
      body.style.overflow = previousStyles.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, isDesktop]);

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
        width={panelWidth}
      >
        <UserAlertSettings onSuccess={handleChannelConfigSuccess} />
      </SidePanel>
    </AlertSettingsContext.Provider>
  );
};
