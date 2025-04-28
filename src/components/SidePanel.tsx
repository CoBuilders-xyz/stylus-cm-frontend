'use client';

import React, { createContext, useContext } from 'react';

// Create a context to pass the onClose function to children
export const SidePanelContext = createContext<{ onClose: () => void }>({
  onClose: () => {},
});

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  width?: string; // Allow customizable width
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  children,
  width = '400px', // Default width of 400px
}) => {
  return (
    <SidePanelContext.Provider value={{ onClose }}>
      <div
        className={`fixed right-0 top-0 h-full bg-[#1A1919] shadow-xl z-40 transition-all duration-300 ease-in-out overflow-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width,
          // Start below header, which has padding of 4 (p-4)
          marginTop: 'var(--header-height, 64px)',
          height: 'calc(100vh - var(--header-height, 64px))',
        }}
      >
        {/* No header with title and close button anymore */}
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
