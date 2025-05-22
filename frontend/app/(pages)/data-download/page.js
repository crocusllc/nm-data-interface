"use client"
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import getConfigData from "@/app/utils/getConfigs";
import FormBuilder from "@/app/(pages)/student-records/[slug]/FormBuilder";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import {GlobalValuesProvider} from "@/app/utils/contexts/GobalValues";
import {useEffect, useState} from "react";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import Skeleton from '@mui/material/Skeleton';

export default function DownloadDataPage() {
  const { userSession } = useAuth();
  const handleApiRequest = useHandleApiRequest();
  const [formFields, setFormFields] = useState()

  const studentRecordFormFields = getConfigData()?.fields
    ?.find( el => el?.form?.Name === "Student Records")?.form;

  const studentRecordKeys = Object.keys(studentRecordFormFields);

  useEffect(()=> {
    if(userSession && !formFields) {
      handleApiRequest({
        action: "download_opts",
        session: userSession,
        bodyObject: null
      }).then( res => {
        if(res) {
          const dropdownFields = Object.keys(res);
          let downLoadFormFields = [];
          // Getting form fields and updated type to render dropdowns.
          studentRecordKeys.forEach( el => {
            if(studentRecordFormFields[el]['Use as filter on Download page?']) {
              studentRecordFormFields[el]['Required field'] = studentRecordFormFields[el]['Required field on Download page'] ?? false;

              if(dropdownFields.includes(studentRecordFormFields[el]['CSV column name'])) {
                const dropdownValues =  res[studentRecordFormFields[el]['CSV column name']].filter(element => element !== null);
                studentRecordFormFields[el]["Type"] = "select";
                //studentRecordFormFields[el]["multi-select"] = true;
                studentRecordFormFields[el]["Dropdown or validation values"] = (dropdownValues.toString()).replaceAll(',', ';')
              }

              downLoadFormFields.push(studentRecordFormFields[el])
            }
          });
          setFormFields(downLoadFormFields)
        }
      });
    }
  },[userSession])



  // Handle download actions
  const handleDownload = async (fieldsSelected) => {
    const allRecords = Array.isArray(fieldsSelected);
    let fieldsToDownLoad = allRecords
      ? ["*"]
      : fieldsSelected;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/file_download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userSession.user.accessToken}`
        },
        body: JSON.stringify({"file_name": `${ allRecords ? 'all_records.csv' : 'selected_records.csv'}`, fields: fieldsToDownLoad}),
      });

      if (!response.ok) {
        console.error("HTTP Error:", response.status);
      }

      // Get the file content
      // Ensure the file content is read as text with UTF-8 encoding
      const text = await response.text();
      // Convert text to a Blob with proper encoding
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });

      // Create a download link
      const urlObject = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = urlObject;
      link.download = `${ allRecords ? 'all_records.csv' : 'selected_records.csv'}`;
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlObject);
    } catch (error) {
      console.error("Error fetching student record info:", error);
    }
  };

  return (
    <GlobalValuesProvider>
      <Box sx={{ maxWidth: "600px"}}>
        <Box sx={{ marginBottom: "16px", padding: "16px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <Typography variant="h6">Download All Records:</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={()=>handleDownload([])}
            sx={{ marginTop: "8px" }}
          >
            Download
          </Button>
        </Box>

        <Box sx={{ marginBottom: "16px", padding: "16px", border: "1px solid #ccc", borderRadius: "4px" }}>
          <Typography variant="h6" gutterBottom>
            Download Selected Records:
          </Typography>

          {
            formFields ? (
              <FormBuilder formFields={formFields} submitBtnTxt={"Download"} onSubmit={handleDownload} enableLock={true}/>
            ) : (
              <Box sx={{ width: "80%", margin: "auto", display: "flex", flexDirection: "column" }}>
                <Skeleton variant="rectangular"  height={40} sx={{marginBottom: "8px"}} />
                <Skeleton variant="rectangular"  height={40} sx={{marginBottom: "8px"}} />
                <Skeleton variant="rectangular" height={40} sx={{marginBottom: "8px"}} />
                <Skeleton variant="rounded" width={120} height={40} sx={{marginBottom: "8px", alignSelf: "flex-end"}} />
              </Box>
            )
          }
        </Box>
      </Box>

    </GlobalValuesProvider>
  );
};
