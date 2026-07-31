'use client';

import React, { createContext, useContext, useEffect } from 'react';

// Create a context to pass the onClose function to children
export const SidePanelContext = createContext<{ onClose: () => void }>({
  onClose: () => {},
});

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  width?: string; // Allow customizable width
  zIndex?: number; // Allow customizable z-index for stacking panels
  lockBodyScrollOnMobile?: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  children,
  width = '400px', // Default width of 400px
  zIndex = 40, // Default z-index
  lockBodyScrollOnMobile = false,
}) => {
  useEffect(() => {
    if (
      !isOpen ||
      !lockBodyScrollOnMobile ||
      window.matchMedia('(min-width: 768px)').matches
    ) {
      return;
    }

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
  }, [isOpen, lockBodyScrollOnMobile]);

  return (
    <SidePanelContext.Provider value={{ onClose }}>
      <div
        className={`@container/panel fixed right-0 top-0 h-full bg-surface-1 border-s border-hairline-strong shadow-xl transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto overscroll-contain ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width,
          zIndex,
          marginTop:
            'var(--header-height, var(--app-chrome-h, 56px))',
          height:
            'calc(100vh - var(--header-height, var(--app-chrome-h, 56px)))',
        }}
      >
        {/* No header with title and close button anymore */}
        <div className='overflow-y-auto h-full'>
          {children || (
            <div className='flex flex-col items-center justify-center h-80 text-ink-3 p-6'>
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
