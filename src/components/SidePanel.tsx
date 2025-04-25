'use client';

import React from 'react';
import { X } from 'lucide-react'; // Using Lucide React for the X icon

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
      <div className='flex items-center justify-between p-4 border-b border-gray-800'>
        <h2 className='text-xl font-semibold text-white'>Contract Details</h2>
        <button
          onClick={onClose}
          className='p-2 rounded-full hover:bg-gray-800 transition-colors'
          aria-label='Close panel'
        >
          <X size={24} className='text-white' />
        </button>
      </div>
      <div className='p-6 overflow-y-auto'>
        {children || (
          <div className='flex flex-col items-center justify-center h-80 text-gray-400'>
            <p>Select a contract to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;
