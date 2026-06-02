'use client';

import React, { createContext, useContext } from 'react';
import { Drawer as VaulDrawer } from 'vaul';
import { useMediaQuery } from '@/hooks/use-media-query';

// Create a context to pass the onClose function to children
export const SidePanelContext = createContext<{ onClose: () => void }>({
  onClose: () => {},
});

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  width?: string; // Allow customizable width (desktop only)
  zIndex?: number; // Allow customizable z-index for stacking panels
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  children,
  width = '400px',
  zIndex = 40,
}) => {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  // On mobile/tablet (<768px) use a bottom-sheet drawer that takes the full
  // viewport. The contract-detail content is too dense for a 53%-width slide
  // out panel on a phone.
  if (!isDesktop) {
    return (
      <SidePanelContext.Provider value={{ onClose }}>
        <VaulDrawer.Root
          open={isOpen}
          onOpenChange={(open) => {
            if (!open) onClose();
          }}
        >
          <VaulDrawer.Portal>
            <VaulDrawer.Overlay
              className='fixed inset-0 bg-black/60 backdrop-blur-sm'
              style={{ zIndex }}
            />
            <VaulDrawer.Content
              className='fixed bottom-0 left-0 right-0 flex flex-col rounded-t-xl border-t border-[#2C2E30] bg-[#1A1919] outline-none'
              style={{
                zIndex: zIndex + 1,
                height: 'calc(100dvh - var(--app-chrome-h, 96px))',
              }}
            >
              <VaulDrawer.Title className='sr-only'>Details</VaulDrawer.Title>
              <div
                aria-hidden
                className='mx-auto mt-2 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-gray-700'
              />
              <div className='flex-1 overflow-y-auto'>
                {children || (
                  <div className='flex flex-col items-center justify-center h-80 text-gray-400 p-6'>
                    <p>Select a contract to view details</p>
                  </div>
                )}
              </div>
            </VaulDrawer.Content>
          </VaulDrawer.Portal>
        </VaulDrawer.Root>
      </SidePanelContext.Provider>
    );
  }

  return (
    <SidePanelContext.Provider value={{ onClose }}>
      <div
        className={`fixed right-0 top-0 h-full bg-[#1A1919] shadow-xl transition-all duration-300 ease-in-out overflow-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width,
          zIndex,
          marginTop: 'var(--app-chrome-h, 96px)',
          height: 'calc(100vh - var(--app-chrome-h, 96px))',
        }}
      >
        <div className='overflow-y-auto h-full'>
          {children || (
            <div className='flex flex-col items-center justify-center h-80 text-gray-400 p-6'>
              <p>Select a contract to view details</p>
            </div>
          )}
        </div>
      </div>
    </SidePanelContext.Provider>
  );
};

// Helper hook to use the SidePanel context
export const useSidePanel = () => useContext(SidePanelContext);

export default SidePanel;
