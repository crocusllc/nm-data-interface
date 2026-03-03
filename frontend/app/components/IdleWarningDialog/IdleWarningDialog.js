'use client';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function IdleWarningDialog({ open, remainingTime, onStayLoggedIn, onLogout }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Session Timeout Warning
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session is about to expire due to inactivity.
        </Typography>
        <Box sx={{ textAlign: 'center', my: 2 }}>
          <Typography variant="h4" color="error">
            {formatTime(remainingTime || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Time remaining
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="inherit">Logout Now</Button>
        <Button onClick={onStayLoggedIn} variant="contained" autoFocus>Stay Logged In</Button>
      </DialogActions>
    </Dialog>
  );
}
