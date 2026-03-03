import {useState} from "react";
import Box from '@mui/material/Box';
import Popper from '@mui/material/Popper';
import Fade from '@mui/material/Fade';
import {IconButton, Paper, Typography} from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';

export default function HelpBox({children, icon}) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen((previousOpen) => !previousOpen);
  };

  const canBeOpen = open && Boolean(anchorEl);
  const id = canBeOpen ? 'transition-popper' : undefined;

  return (
    <Box>
      <IconButton aria-label="open help box" aria-describedby={id} type="button" onClick={handleClick} size="medium">
        {
          icon ?? <HelpIcon />
        }
      </IconButton>
      <Popper id={id} open={open} anchorEl={anchorEl} transition sx={{paddingX: "10px"}}>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={350}>
            <Paper>
              { children }
            </Paper>
          </Fade>
        )}
      </Popper>
    </Box>
  );
}
