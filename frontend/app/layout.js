"use client"
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Header from "@/app/components/Header/Header";
import MainMenu from "@/app/components/MainMenu/MainMenu";
import Box from "@mui/material/Box";
import {usePathname, useRouter} from 'next/navigation'
import {Container} from "@mui/material";
import {SessionProvider} from "next-auth/react";
import {AuthProvider} from "@/app/utils/contexts/AuthProvider";
import Link from '@mui/material/Link';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Button from '@mui/material/Button';

import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "@/app/utils/theme";

import { Inter, Rubik } from "next/font/google";
import {SystemMessageProvider} from "@/app/utils/contexts/SystemMessage";
const inter = Inter({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const rubik = Rubik({
  weight: ['500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-rubik',
});

export default function RootLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter();
  const noSidebarPages = ['/login', '/forgot-password'].includes(pathname)
  const pathElements = pathname.split('/').filter(segment => segment !== '');
  const backUrl = pathElements[pathElements.length - 2] ?? '';
  const noBackBtn = ['/'].includes(pathname)
  
  return (
    <html lang="en">
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SessionProvider>
            <AuthProvider>
              <SystemMessageProvider>
                <body className={`${inter.variable} ${rubik.variable}`}>
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
                          {
                            (!noBackBtn) && (
                              <Link href={`/${backUrl}`} underline="none" sx={{display: "flex", alignItems: "center", margin: "0 10px 20px"}}>
                                <ArrowBackIosIcon fontSize={"small"}/>
                                <Box component={"span"} sx={{marginLeft: "-2px"}}>Back</Box>
                              </Link>
                            )
                          }
                          <MainMenu/>
                        </Box>
                      )
                    }
                    <Container  maxWidth="xl" component={"main"} sx={{gridColumn: noSidebarPages ? "1 / 3" : "2 / 3", paddingBottom: "20px", paddingRight: "20px", minHeight: "calc(100vh - 140px)"}}>
                      {children}
                    </Container>
                  </Box>
                </body>
              </SystemMessageProvider>
            </AuthProvider>
          </SessionProvider>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </html>
  );
}
