"use client"

import Box from '@mui/material/Box';
import {FormControl, FormLabel, TextField, Typography} from "@mui/material";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import {useRef, useState} from "react";
import Link from "next/link";
import {signIn} from "next-auth/react";

export default function LoginPage() {
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [usernameError, setUsernameError] = useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = useState('')
  const [loginError, setLoginError] = useState('')

  const usernameInput = useRef(null);
  const passInput = useRef(null);

  const validateInputs = () => {
    setLoginError('');
    let isValid = true;

    if(usernameInput.current.value.length < 4) {
      setUsernameError(true);
      setUsernameErrorMessage('Username must be at least 4 characters long');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('')
    }

    // if (passInput.current.value.length < 4) {
    //   setPasswordError(true);
    //   setPasswordErrorMessage('Password must be at least 4 characters long.');
    //   isValid = false;
    // } else {
    //   setPasswordError(false);
    //   setPasswordErrorMessage('');
    // }
    return isValid;
  };
  const handleSubmit =  async (e) => {
    e.preventDefault();
    if (usernameError || passwordError) {
      return;
    }

    const response = await signIn("credentials", {
      redirect: false,
      username: usernameInput.current.value,
      password: passInput.current.value,
    });

    if(response?.error) {
      setLoginError('Username or password incorrect')
    } else  {
      // redirect and router.push do not work in prod mode.
      window.location.href = "/";
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: "center", justifyContent: "center"}}>
      <Card sx={{ maxWidth: 480, width: "80%" }}>
        <CardContent>
          <Typography gutterBottom component="h2" sx={{fontSize: "22px", marginBottom: "18px"}}>
            Log In
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="username">User name</FormLabel>
              <TextField
                required
                fullWidth
                id="username"
                placeholder=""
                name="username"
                autoComplete="username"
                variant="outlined"
                error={usernameError}
                helperText={usernameErrorMessage}
                color={usernameError ? 'error' : 'primary'}
                inputRef={usernameInput}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
                inputRef={passInput}
              />
            </FormControl>
            <Box sx={{display: "flex", justifyContent: "space-between"}}>
              <Link href="/forgot-password">Forgot password?</Link>
              <Button
                sx={{maxWidth: "200px"}}
                type="submit"
                fullWidth
                variant="contained"
                onClick={validateInputs}
              >
                Sign in
              </Button>
            </Box>
          </Box>
          {
            loginError && (
              <Box sx={{textAlign: "center", marginTop: "24px", color: "red", fontSize: "14px"}}>
                {
                  loginError
                }
              </Box>
            )
          }
        </CardContent>
      </Card>
    </Box>

  );
}
