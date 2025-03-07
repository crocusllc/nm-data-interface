import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Button from "@mui/material/Button";
import {signOut} from "next-auth/react";
import {useSystemMessage} from "@/app/utils/contexts/SystemMessage";
import {handleApiRequest} from "@/app/utils/handleApiRequest";
import React from "react";
export function useHandleApiRequest() {
  const { showSystemMessage } = useSystemMessage();

  const handleError = (errorCode, action, message) => {
    let title, content, actions;

    switch (errorCode) {
      case 401:
        title = <><WarningAmberIcon fontSize="large"/> Session Expired</>;
        content = <p>Your session has expired. <br />You will be redirected to the login page.</p>;
        actions = <Button variant="contained" color="primary" onClick={() => signOut()}>OK</Button>;
        break;
      case 403:
        title = <><WarningAmberIcon fontSize="large"/> Access Denied</>;
        content = <p>You don't have permission to perform this action.</p>;
        break;
      case 500:
        title = <><WarningAmberIcon fontSize="large"/> Server Error</>
        content = <p>Something went wrong on the server. Please try again later.</p>;
        break;
      case "Network error":
        title = <><WarningAmberIcon fontSize="large"/> Network error</>;
        content = <p>{`An unexpected error occurred. ${message}.`}</p>;
        break;
      default:
        title = <><WarningAmberIcon fontSize="large"/> {action.replace("_", " ")} Error</>;
        content = <p>{message || "An unexpected error occurred."}</p>;
    }

    return({ title, content, actions });
  };

  return async ({ action, method, session, bodyObject, contentType }) => {
    const result = await handleApiRequest({ action, method, session, bodyObject, contentType });

    // On error response always be null.
    if (result?.error) {
      showSystemMessage(handleError(result.error, action, result.message));
      return null;
    }

    return result;
  };
}