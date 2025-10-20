// hooks/useInactivityLogout.ts
import { useEffect, useRef } from 'react';

const useInactivityLogout = (onLogout: () => void, timeout = 900000) => { // 15 minutes default
  const timeoutId = useRef<number | null>(null);

  const resetTimer = () => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }
    timeoutId.current = window.setTimeout(onLogout, timeout);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

    const eventListener = () => {
      resetTimer();
    };

    events.forEach(event => window.addEventListener(event, eventListener));
    resetTimer(); // Start the timer on mount

    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
      events.forEach(event => window.removeEventListener(event, eventListener));
    };
  }, [onLogout, timeout]);
};

export default useInactivityLogout;
