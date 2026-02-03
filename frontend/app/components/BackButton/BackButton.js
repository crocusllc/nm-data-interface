"use client"
import { Suspense } from 'react';
import Link from '@mui/material/Link';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import Box from "@mui/material/Box";
import { usePathname, useSearchParams } from 'next/navigation';

function BackButtonContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const backUrl = pathname.split('/').filter(Boolean).slice(0, -1).pop() ?? '';
  const noBackBtn = ['/'].includes(pathname);
  const returnFilters = searchParams.get('returnFilters');
  const backHref = returnFilters
    ? `/${backUrl}?${decodeURIComponent(returnFilters)}`
    : `/${backUrl}`;

  if (noBackBtn) {
    return null;
  }

  return (
    <Link href={backHref} underline="none" sx={{display: "flex", alignItems: "center", margin: "0 10px 20px"}}>
      <ArrowBackIosIcon fontSize={"small"}/>
      <Box component={"span"} sx={{marginLeft: "-2px"}}>Back</Box>
    </Link>
  );
}

export default function BackButton() {
  return (
    <Suspense fallback={null}>
      <BackButtonContent />
    </Suspense>
  );
}
