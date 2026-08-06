'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useMobileBodyScrollLock } from '@/hooks/useMobileBodyScrollLock';

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
  ariaLabel?: string;
}

const SidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  children,
  width = '400px', // Default width of 400px
  zIndex = 40, // Default z-index
  lockBodyScrollOnMobile = false,
  ariaLabel = 'Panel',
}) => {
  useMobileBodyScrollLock(isOpen && lockBodyScrollOnMobile);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousFocusIdRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousFocusIdRef.current =
      previousFocusRef.current?.dataset.focusReturnId ?? null;

    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!panelRef.current?.contains(document.activeElement)) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      const shouldTrapFocus =
        lockBodyScrollOnMobile || window.matchMedia('(max-width: 767px)').matches;
      if (event.key !== 'Tab' || !shouldTrapFocus || !panelRef.current) {
        return;
      }

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('hidden'));

      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => {
        const originalTarget = previousFocusRef.current;
        const fallbackTarget = previousFocusIdRef.current
          ? Array.from(
              document.querySelectorAll<HTMLElement>('[data-focus-return-id]')
            ).find(
              (element) =>
                element.dataset.focusReturnId === previousFocusIdRef.current
            )
          : null;
        (originalTarget?.isConnected ? originalTarget : fallbackTarget)?.focus();
      });
    };
  }, [isOpen, lockBodyScrollOnMobile]);

  return (
    <SidePanelContext.Provider value={{ onClose }}>
      <div
        ref={panelRef}
        role='dialog'
        aria-label={ariaLabel}
        aria-hidden={!isOpen}
        tabIndex={-1}
        inert={!isOpen}
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
