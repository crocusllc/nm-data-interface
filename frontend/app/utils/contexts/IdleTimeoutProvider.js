'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import IdleWarningDialog from '@/app/components/IdleWarningDialog/IdleWarningDialog';

export function IdleTimeoutProvider({ children }) {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const { showWarning, remainingTime, stayLoggedIn, logout } = useIdleTimeout({
    enabled: isAuthenticated
  });

  return (
    <>
      {children}
      <IdleWarningDialog
        open={showWarning}
        remainingTime={remainingTime}
        onStayLoggedIn={stayLoggedIn}
        onLogout={logout}
      />
    </>
  );
}
