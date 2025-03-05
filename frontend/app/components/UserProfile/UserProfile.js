"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { Divider, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { signOut, useSession, SessionProvider } from "next-auth/react";

function UserProfileComponent() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { data: session } = useSession();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    signOut(); // Trigger sign out
  };

  return (
    session && (
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", textAlign: "center" }}>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2, color: "primary.dark" }}
              aria-controls={open ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
              <AccountCircleIcon fontSize="large" />
            </IconButton>
          </Tooltip>
        </Box>
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={open}
          onClose={handleClose}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          slotProps={{
            paper: {
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
                '&::before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            },
          }}
        >
          <MenuItem sx={{ cursor: "initial" }}>
            {session?.user?.username}
          </MenuItem>
          <MenuItem sx={{ cursor: "initial", fontSize: "12px" }}>
            {session?.user?.role}
          </MenuItem>
          <Divider />
          {/* Only handle logout on this MenuItem */}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Box>
    )
  );
}

// Wrap with SessionProvider
export default function UserProfileWrapper() {
  return (
    <SessionProvider>
      <UserProfileComponent />
    </SessionProvider>
  );
}
