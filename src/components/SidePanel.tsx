'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useMobileBodyScrollLock } from '@/hooks/useMobileBodyScrollLock';

// Create a context to pass the onClose function to children
export const SidePanelContext = createContext<{ onClose: () => void }>({
  onClose: () => {},
});

const openPanelStack: symbol[] = [];
const panelElements = new Map<symbol, HTMLElement>();

function addPanelToStack(panelId: symbol) {
  const existingIndex = openPanelStack.indexOf(panelId);
  if (existingIndex !== -1) openPanelStack.splice(existingIndex, 1);
  openPanelStack.push(panelId);
}

function removePanelFromStack(panelId: symbol) {
  const index = openPanelStack.indexOf(panelId);
  if (index !== -1) openPanelStack.splice(index, 1);
}

function isTopmostPanel(panelId: symbol) {
  return openPanelStack.at(-1) === panelId;
}

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
  const panelIdRef = useRef(Symbol('side-panel'));
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previousFocusIdRef = useRef<string | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const panelId = panelIdRef.current;
    const previousPanelId = openPanelStack.at(-1);
    const previousPanel = previousPanelId
      ? panelElements.get(previousPanelId) ?? null
      : null;
    addPanelToStack(panelId);
    if (panelRef.current) panelElements.set(panelId, panelRef.current);

    const activeElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    previousFocusRef.current =
      previousPanel && !previousPanel.contains(activeElement)
        ? previousPanel
        : activeElement;
    previousFocusIdRef.current =
      previousFocusRef.current?.dataset.focusReturnId ?? null;

    const frame = requestAnimationFrame(() => panelRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopmostPanel(panelId)) return;

      if (event.key === 'Escape') {
        if (!panelRef.current?.contains(document.activeElement)) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      const shouldTrapFocus =
        lockBodyScrollOnMobile ||
        openPanelStack.length > 1 ||
        window.matchMedia('(max-width: 767px)').matches;
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
      if (
        event.shiftKey &&
        (document.activeElement === panelRef.current ||
          document.activeElement === first)
      ) {
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
      removePanelFromStack(panelId);
      panelElements.delete(panelId);
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
