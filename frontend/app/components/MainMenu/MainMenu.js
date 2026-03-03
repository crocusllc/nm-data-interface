"use client"
import { Box, Stack } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchIcon from "@mui/icons-material/Search";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import Link from "next/link";
import { usePathname } from 'next/navigation'
import {useAuth} from "@/app/utils/contexts/AuthProvider";

export default function MainMenu() {
  const pathname = usePathname();
  const { userSession } = useAuth();
  const allowed = userSession && userSession.user?.role === 'administrator'

  const menuItems = [
    { href: "/", icon: <HomeIcon />, label: "Home" },
    { href: "/data-upload", icon: <FileUploadIcon />, label: "Upload file", protected: true },
    { href: "/student-records", icon: <SearchIcon />, label: "Search" },
    { href: "/data-download", icon: <FileDownloadIcon />, label: "Download file", protected: true }
  ]

  return (
    <Box
      sx={{
        width: "80px",
        backgroundColor: "primary.light",
      }}
    >
      {
        <Stack component={"nav"} alignItems="center" sx={{
          '& a': { color: "primary.dark", padding: "24px"},
          '& a:hover': { color: "#fff"},
          '& a.active': { borderLeft: "12px solid", borderColor: "primary.dark", color: "#fff", backgroundColor: "primary.main"}
        }}>
          {menuItems.filter(item => !item.protected || allowed).map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className={`link ${pathname === href ? "active" : ""}`}
              aria-label={label}
            >
              {icon}
            </Link>
          ))}
        </Stack>
      }

    </Box>
  );
}