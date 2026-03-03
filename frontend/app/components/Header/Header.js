import Image from 'next/image'
import Box from "@mui/material/Box";
import Link from "next/link";
import getConfigData from "@/app/utils/getConfigs"
import UserProfile from "@/app/components/UserProfile/UserProfile";

export default function Header() {
  // Validating the source o app logo.
  const appLogo = (getConfigData()?.theme?.logo) ?? "/ptt_logo.png";

  return(
    <Box sx={{padding: "20px", borderBottom: "1px solid #c6c6c6", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
      <Box  sx={{display: "flex"}}>
        <Link href="/" aria-label="Home">
          <Image
            src={appLogo}
            width={174}
            height={46}
            alt="PTT Logo"
            priority={true}
          />
        </Link>
        <Box sx={{display:"flex", alignItems: "center", marginLeft: "20px"}}>
          Educator Preparation Data Interface
        </Box>
      </Box>
      <Box>
        <UserProfile/>
      </Box>
    </Box>
  )
}