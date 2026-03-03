import React, { createContext, useState, useContext } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

// Create the context
const SystemMessageContext = createContext();

export const SystemMessageProvider = ({ children }) => {
  const [message, setMessage] = useState(null);
  const [open, setOpen] = useState(false);

  // Function to trigger the dialog
  const showSystemMessage = (msg) => {
    setMessage(msg);
    setOpen(true);
  };

  // Function to close the dialog
  const closeSystemMessage = () => {
    setOpen(false);
    setMessage(null);
  };

  return (
    <SystemMessageContext.Provider value={{ showSystemMessage, closeSystemMessage }}>
      {children}
      <Dialog
        open={open}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{
          "& .MuiDialog-container": {
            "& .MuiPaper-root": {
              width: "100%",
              maxWidth: "460px",
              minHeight: "200px"
            },
          },
        }}
      >
        <DialogTitle  sx={{ m: 0, p: 2, display:"flex", alignItems: "end" }} id={"alert-dialog-title"}>{ message?.title }</DialogTitle>
        {
          !message?.actions && (
            <IconButton
              aria-label="close"
              onClick={closeSystemMessage}
              sx={(theme) => ({
                position: 'absolute',
                right: 8,
                top: 8,
                color: theme.palette.grey[500],
              })}
            >
              <CloseIcon />
            </IconButton>
          )
        }
        <DialogContent id={"alert-dialog-description"} dividers>{ message?.content }</DialogContent>
        {
          message?.actions && (
            <DialogActions>
              { message?.actions }
            </DialogActions>
          )
        }
      </Dialog>
    </SystemMessageContext.Provider>
  );
};

// Hook to use the system message context
export const useSystemMessage = () => useContext(SystemMessageContext);
