'use client'
import {useState, useRef} from "react";
import {Box, Button, Typography, TextField, IconButton} from "@mui/material";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import {useSystemMessage} from "@/app/utils/contexts/SystemMessage";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

const FileUpload = ({FormConfig}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const { userSession } = useAuth();
  const { showSystemMessage } = useSystemMessage();
  const handleApiRequest = useHandleApiRequest();
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const readCSVFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target.result;
        const rows = content.split("\n");
        const csvHeaders = rows[0].split(",");

        //console.log("CSV Headers:", csvHeaders);

        const jsonData = {
          file_name: file.name,
          table_name: FormConfig?.tableName,
          fields: csvHeaders,
        };

        resolve(jsonData); // Resolve the Promise with jsonData
      };

      reader.onerror = (e) => reject(e.target.error);
      reader.readAsText(file);
    });
  };

  // Handle file upload
  const handleUpload = async () => {
    const file = selectedFile;
    console.log(file)
    const formData = new FormData();
    // Append file
    formData.append("file", file);
    const jsonData = await readCSVFile(file);
    formData.append("data", new Blob([JSON.stringify(jsonData)], { type: "application/json" }));

    // Executing change password action
    return await handleApiRequest({
      action: "file_upload",
      method: "POST",
      session: userSession,
      bodyObject: formData,
      contentType: null,
    }).then( data => {
      if(data) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        showSystemMessage({
          title:<><TaskAltIcon fontSize="large" /> Upload response</>,
          content: <p>{data.message}</p>,
        });
      }
    });
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ marginBottom: "8px" }}>
        {FormConfig.title}
      </Typography>
      <TextField
        type="file"
        inputRef={fileInputRef}
        slotProps={{
          input: {
            inputProps: {
              accept: ".csv"
            },
          },
        }}
        variant="outlined"
        size="small"
        fullWidth
        onChange={handleFileChange}
        sx={{ marginBottom: "16px" }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!selectedFile}
      >
        Upload
      </Button>
    </Box>
  );
};

export default FileUpload;
