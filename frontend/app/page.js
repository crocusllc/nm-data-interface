"use client"

import Box from '@mui/material/Box';
import Link from "next/link";
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import {Stack} from "@mui/material";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import {useEffect, useState} from "react";
import { redirect } from 'next/navigation'

const HomeMenuItem = ({ href, label, ariaLabel, show }) => {
  if (!show) return null;

  return (
    <Box sx={{
      width: "320px",
      backgroundColor: "primary.light",
      "&:hover": { backgroundColor: "primary.main"},
      "&:hover a": { color: "#fff"},
      "& a": { color: "primary.dark", textDecoration: "none", fontWeight: "bold"}
      }}>
      <Link href={href} aria-label={ariaLabel}>
        <Stack spacing={2} direction="row" sx={{ alignItems: 'center', justifyContent: "space-between", boxShadow: 2, padding: "14px" }}>
          {label}
          <ArrowForwardIosRoundedIcon />
        </Stack>
      </Link>
    </Box>
  );
};
export default function Home() {
  const { userSession } = useAuth();
  const allowed = userSession && userSession.user?.role === 'administrator';
  const [requestPass, setRequestPass] = useState(true);
  useEffect(()=> {
    if(userSession?.user?.require_pass) {
      redirect(`/change-password`)
    }
    if (userSession?.user?.require_pass === false) {
      setRequestPass(false);
    }
  },[userSession]);

  return (
    <Box sx={{minHeight: "100vh"}}>
      {
        (userSession && !requestPass ) && (
          <Stack spacing={2}>
            <HomeMenuItem href="/data-upload" label="Upload Student Data" ariaLabel="Upload file" show={allowed} />
            <HomeMenuItem href="/student-records" label={`View${allowed ?"/Edit" : ""} Student Data`} ariaLabel="Search" show={true} />
            <HomeMenuItem href="/data-download" label="Download Data" ariaLabel="Download file" show={allowed} />
          </Stack>
        )
      }
    </Box>
  );
}
