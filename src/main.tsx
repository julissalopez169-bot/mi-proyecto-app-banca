// Disable React 19 dev user-timing props traversal in iframes to prevent cross-origin Window.$$typeof SecurityError
try {
  if (typeof console !== 'undefined') {
    Object.defineProperty(console, 'timeStamp', {
      value: undefined,
      configurable: false,
      writable: false,
    });
  }
} catch {
  // ignore
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent mobile viewport zooming on gesture, pinch or double-tap
if (typeof window !== 'undefined') {
  // Prevent iOS Safari gesture zooming
  document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
  });
  document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
  });
  document.addEventListener('gestureend', (e) => {
    e.preventDefault();
  });

  // Prevent multi-touch pinch to zoom
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // Prevent accidental double-tap zoom while keeping button / input interactions smooth
  let lastTouchTime = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchTime <= 300) {
        const target = e.target as HTMLElement | null;
        if (!target || !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName)) {
          e.preventDefault();
        }
      }
      lastTouchTime = now;
    },
    { passive: false }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
