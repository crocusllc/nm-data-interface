"use client"
import Box from '@mui/material/Box';
import {FormControl, FormLabel, TextField, Typography} from "@mui/material";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function ForgotPass() {

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: "center", justifyContent: "center"}}>
      <Card sx={{ maxWidth: 480, width: "80%" }}>
        <CardContent>
          <Typography gutterBottom component="h2" sx={{fontSize: "22px", marginBottom: "18px"}}>
            Forgot Password?
          </Typography>
          <Box
            component="div"
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            Please contact your administrator.
          </Box>
        </CardContent>
      </Card>
    </Box>

  );
}
