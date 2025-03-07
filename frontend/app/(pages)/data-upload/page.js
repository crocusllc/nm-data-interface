"use client"
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import FileUploadForm from "@/app/(pages)/data-upload/FileUploadForm";
import Stack from "@mui/material/Stack";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Link from "next/link";
import HelpBox from "@/app/components/HelpBox/HelpBox";
import Box from "@mui/material/Box";
import SaveAltRoundedIcon from '@mui/icons-material/SaveAltRounded';
import {ListItemButton} from "@mui/material";

const templatePaths = [
  {
    name: "IHE Data Template",
    path: "/docs/additional_program_student_data.csv"
  },
  {
    name: "Clinical Placement Data Template",
    path: "/docs/clinical_placement_data.csv"
  },
  {
    name: "Program and Student Data Template",
    path: "/docs/student_data.csv"
  },
  {
    name: "Reference Guide",
    path: "#"
  }
]

const uploadForms = [
  {
    title: "Upload/Update Student IHE Data",
    tableName: "student_info"
  },
  {
    title: "Upload new clinical placement data",
    tableName: "clinical_placements"
  },
  {
    title: "Upload new program and student data",
    tableName: "program_info"
  },
]

export default function UploadForm() {
  return (
    <Stack spacing={2} maxWidth={"md"} margin={"auto"}>
      <Box sx={{marginLeft: "auto !important", width:"40px"}}>
        <HelpBox>
          <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper'}}>
            {
              templatePaths.map((template, i)=> {
                return (
                  <ListItem key={i} disablePadding>
                    <ListItemButton component="a" href={template.path} download >
                      <ListItemAvatar >
                        <Avatar sx={{ width: 32, height: 32, backgroundColor: "secondary.main" }}>
                          <SaveAltRoundedIcon fontSize={"small"}/>
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={ template.name } />
                    </ListItemButton>
                  </ListItem>
                )
              })
            }
          </List>
        </HelpBox>
      </Box>
      {
        uploadForms.map( (form, i)=> {
          return(
            <Card key={i} sx={{ width: "90%", margin: "auto"}}>
              <CardContent>
                <FileUploadForm FormConfig={form} />
              </CardContent>
            </Card>
          )
        })
      }
      <Box sx={{"& a": {color: "secondary.dark", marginTop: "10px"}}}>
        <Link href={"/upload-log"} aria-label={"Upload Log"}>View Upload Log</Link>
      </Box>
    </Stack>
  );
}
