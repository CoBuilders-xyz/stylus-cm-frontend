import { useEffect } from 'react';

interface SavedBodyState {
  scrollY: number;
  position: string;
  top: string;
  width: string;
  overflow: string;
}

let lockOwners = 0;
let savedBodyState: SavedBodyState | null = null;

const acquireBodyScrollLock = () => {
  if (lockOwners === 0) {
    const body = document.body;
    savedBodyState = {
      scrollY: window.scrollY,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };

    body.style.position = 'fixed';
    body.style.top = `-${savedBodyState.scrollY}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  lockOwners += 1;

  return () => {
    lockOwners = Math.max(0, lockOwners - 1);
    if (lockOwners !== 0 || !savedBodyState) return;

    const body = document.body;
    const previousState = savedBodyState;
    savedBodyState = null;
    body.style.position = previousState.position;
    body.style.top = previousState.top;
    body.style.width = previousState.width;
    body.style.overflow = previousState.overflow;
    window.scrollTo(0, previousState.scrollY);
  };
};

export function useMobileBodyScrollLock(active: boolean) {
  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    let releaseLock: (() => void) | undefined;

    const syncLock = () => {
      const shouldLock = active && mobileQuery.matches;
      if (shouldLock && !releaseLock) {
        releaseLock = acquireBodyScrollLock();
      } else if (!shouldLock && releaseLock) {
        releaseLock();
        releaseLock = undefined;
      }
    };

    syncLock();
    mobileQuery.addEventListener('change', syncLock);

    return () => {
      mobileQuery.removeEventListener('change', syncLock);
      releaseLock?.();
    };
  }, [active]);
}
