'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'next-auth/react';

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
const IDLE_TIMEOUT = 60 * 60 * 1000;      // 60 minutes
const WARNING_TIMEOUT = 5 * 60 * 1000;    // 5 minute warning

export function useIdleTimeout({ enabled = true }) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    clearTimers();
    signOut({ callbackUrl: '/login' });
  }, [clearTimers]);

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setRemainingTime(Math.floor(WARNING_TIMEOUT / 1000));

    countdownRef.current = setInterval(() => {
      setRemainingTime(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    warningTimerRef.current = setTimeout(handleLogout, WARNING_TIMEOUT);
  }, [handleLogout]);

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    clearTimers();
    setShowWarning(false);
    setRemainingTime(null);
    lastActivityRef.current = Date.now();

    idleTimerRef.current = setTimeout(startWarningCountdown, IDLE_TIMEOUT - WARNING_TIMEOUT);
  }, [enabled, clearTimers, startWarningCountdown]);

  const handleActivity = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastActivityRef.current < 1000) return; // Throttle
    resetTimers();
  }, [enabled, resetTimers]);

  useEffect(() => {
    if (!enabled) return;

    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    resetTimers();

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, handleActivity, resetTimers, clearTimers]);

  return { showWarning, remainingTime, stayLoggedIn: resetTimers, logout: handleLogout };
}
