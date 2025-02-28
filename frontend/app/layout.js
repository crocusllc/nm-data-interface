"use client"

import { Geist, Geist_Mono } from "next/font/google";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import "./globals.css";
import Header from "@/app/components/Header/Header";
import MainMenu from "@/app/components/MainMenu/MainMenu";
import Box from "@mui/material/Box";
import {usePathname} from 'next/navigation'
import {Container} from "@mui/material";
import {SessionProvider} from "next-auth/react";
import {AuthProvider} from "@/app/utils/contexts/AuthProvider";
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const noSidebarPages = ['/login', '/forgot-password'].includes(pathname)

  return (
    <html lang="en">
    <PrimeReactProvider>
      <AppRouterCacheProvider>
        <SessionProvider>
          <AuthProvider>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
              <Box sx={{
                display: "grid",
                gap: "20px",
                gridTemplateColumns: "80px 1fr"
              }}>
                <Box component={"header"} sx={{gridColumn: "1 / 3"}}>
                  <Header/>
                </Box>
                {
                  !noSidebarPages && (
                    <Box component={"aside"} sx={{gridColumn: "1 / 2"}}>
                      <MainMenu/>
                    </Box>
                  )
                }
                <Container  maxWidth="xl" component={"main"} sx={{gridColumn: noSidebarPages ? "1 / 3" : "2 / 3", paddingBottom: "20px", paddingRight: "20px", minHeight: "calc(100vh - 140px)"}}>
                    {children}
                </Container>
              </Box>
            </body>
          </AuthProvider>
        </SessionProvider>
      </AppRouterCacheProvider>
    </PrimeReactProvider>
    </html>
  );
}
