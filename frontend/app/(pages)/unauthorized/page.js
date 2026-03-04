import Box from "@mui/material/Box";

export default function Page() {
  return (
    <Box sx={{height:"100%", textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <div>
        <Box component={"h1"} sx={{display:"inline-block",margin:"0 20px 0 0",padding:"0 23px 0 0",fontSize:"24px",fontWeight:"500", verticalAlign:"top",lineHeight:"49px", borderRight: "1px solid rgba(0,0,0,.3)"}}>403</Box>
        <Box sx={{display:"inline-block"}}>
          <Box component={"h2"} sx={{fontSize:"14px",fontWeight:"400",lineHeight:"49px",margin:"0"}}>You don't have permission to access this resource.</Box>
        </Box>
      </div>
    </Box>
  )
}