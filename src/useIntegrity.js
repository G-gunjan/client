/**
 * Integrity Monitoring Hook
 * Monitors assessment activity for potential integrity violations, including
 * tab switching, loss of focus, inactivity, copy-paste, and fullscreen exits.
 * Queues detected events, sends them to the backend, displays alerts, and
 * cleans up event listeners when monitoring stops.
 */

import { useEffect, useRef, useCallback } from 'react';
import { api } from './api';

const INACTIVITY_MS = 5 * 60 * 1000;

export function useIntegrity(sessionType, sessionId, { active = true, fullscreen = false, onAlert } = {}) {
  const queue = useRef([]);
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;
  const sid = sessionId != null ? String(sessionId) : null;

  const log = useCallback(
    (event, meta) => {
      if (!sid) return;
      queue.current.push({
        sessionType,
        sessionId: sid,
        event,
        meta: meta || undefined,
        timestamp: new Date().toISOString()
      });

      const messages = {
        FOCUS_LOST: 'Focus lost — stay on the assessment window.',
        TAB_HIDDEN: 'Tab switch detected — do not leave this tab during the test.',
        FULLSCREEN_EXIT: 'Fullscreen exited — the test must stay in fullscreen.',
        INACTIVITY: 'Inactivity detected — please stay engaged with the assessment.',
        COPY_PASTE: 'Copy/paste is not allowed during the assessment.',
        RIGHT_CLICK: 'Right-click is disabled during the assessment.',
        NO_FACE: 'Face not visible — please look at the camera.',
        MULTIPLE_FACES: 'Multiple people detected — only the candidate should be in frame.',
        CAMERA_DISCONNECTED: 'Camera disconnected — please re-enable your camera.',
        PHONE_DETECTED: 'Possible mobile device detected in frame — put phones away.',
        SECONDARY_DISPLAY: 'Multiple displays may be in use — use a single screen only.'
      };
      if (onAlertRef.current && messages[event]) {
        onAlertRef.current(event, messages[event]);
      }
    },
    [sessionType, sid]
  );

  useEffect(() => {
    if (!active || !sid) return;

    const flush = async () => {
      if (!queue.current.length) return;
      const events = queue.current.splice(0);
      try {
        await api.post('/integrity', { events });
      } catch {
        queue.current.unshift(...events);
      }
    };

    const timer = setInterval(flush, 3000);
    let idle;
    const resetIdle = () => {
      clearTimeout(idle);
      idle = setTimeout(() => log('INACTIVITY', { afterMs: INACTIVITY_MS }), INACTIVITY_MS);
    };

    const onVisibility = () => {
      if (document.hidden) log('TAB_HIDDEN');
    };
    const onBlur = () => log('FOCUS_LOST');
    const onFs = () => {
      if (fullscreen && !document.fullscreenElement) {
        log('FULLSCREEN_EXIT');
        document.documentElement.requestFullscreen?.().catch(() => {});
      }
    };
    const onCopyPaste = (e) => {
      e.preventDefault();
      log('COPY_PASTE', { type: e.type });
    };
    const onCtx = (e) => {
      e.preventDefault();
      log('RIGHT_CLICK');
    };

    try {
      if (window.screen?.isExtended) log('SECONDARY_DISPLAY');
    } catch {}

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('copy', onCopyPaste);
    document.addEventListener('paste', onCopyPaste);
    document.addEventListener('cut', onCopyPaste);
    document.addEventListener('contextmenu', onCtx);
    ['mousemove', 'keydown', 'click'].forEach((ev) => window.addEventListener(ev, resetIdle));
    resetIdle();

    if (fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }

    return () => {
      clearInterval(timer);
      clearTimeout(idle);
      flush();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('copy', onCopyPaste);
      document.removeEventListener('paste', onCopyPaste);
      document.removeEventListener('cut', onCopyPaste);
      document.removeEventListener('contextmenu', onCtx);
      ['mousemove', 'keydown', 'click'].forEach((ev) => window.removeEventListener(ev, resetIdle));
    };
  }, [active, sid, fullscreen, log]);

  return log;
}