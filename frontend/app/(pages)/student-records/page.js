"use client"

import Box from '@mui/material/Box';
import getConfigData from "@/app/utils/getConfigs"
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";

import "primereact/resources/themes/lara-light-cyan/theme.css";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const getFullRecordLink = (rowData) => {
  return <Box component={"a"} sx={{color: "primary.dark"}} href={`/student-records/${rowData.student_id}`} title="View student full record">View Full Record</Box>;
};

export default function StudentRecordsPage() {
  // Getting user session data.
  const [studentRecords, setStudentRecords] = useState();
  const [selectedRows, setSelectedRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [uploadResponse, setUploadResponse] = useState()

  let gridFields = [];
  let orderedGridColumn = []
  const { userSession } = useAuth();

  async function fetchStudentRecordInfo() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student_record_info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userSession.user.accessToken}`
        }
      });

      if (!response.ok) {
        console.error("HTTP Error:", response.status);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching student record info:", error);
    }
  }

  useEffect( ()=> {
    if (userSession && !studentRecords){
      fetchStudentRecordInfo().then(data=> {
        setStudentRecords(data)
      });
    }
  },[userSession])

  // Get Student record fields from config file.
  const studentRecordFormFields = getConfigData()?.fields
    ?.find( el => el?.form?.Name === "Student Records")?.form;
  const studentRecordKeys = Object.keys(studentRecordFormFields);

  // Using the key to filter field displayed in the student record page.
  studentRecordKeys.forEach( el => {
    if(studentRecordFormFields[el]['Use as filter in View/Edit search page?'] === true){
      gridFields.push(studentRecordFormFields[el])
    }
  });

  // Categories defined in config.yaml file.
  const categories = getConfigData()?.categories;
  // Grouped and sorted by categories
  Object.keys(categories)?.forEach( cat => {
    const sortedData = gridFields.filter(item => item.Category === cat)
      .sort((a, b) => a["Order within category"] - b["Order within category"]);
    orderedGridColumn = [
      ...orderedGridColumn,
      ...sortedData,
    ]
  })

  const tableColumns = [
    ...orderedGridColumn.map( field => ({
      field: field['CSV column name'],
      header: field['Data element label'],
      filterEnabled: true,
      renderCell: null,
      sortable: true
    })),
    {
      field: 'editUrl',
      header: '',
      sortable: false,
      renderCell: getFullRecordLink,
    }
  ]

  const deleteStudentRecord = async () => {
    const studentIds = selectedRows.map( student => student.student_id)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/delete_student`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userSession.user.accessToken}`
        },
        body: JSON.stringify({student_id: studentIds}),
      });

      if (!response.ok) {
        console.error("HTTP Error:", response.status);
      } else {
        fetchStudentRecordInfo().then(data=> {
          setStudentRecords(data)
        });
      }

      const result = await response.json();
      setUploadResponse(result);
      setOpen(true);

    } catch (error) {
      console.error("Error fetching student record info:", error.message);
    }
  }

  const numberRows = 15;

  return (
    <>
      <h1>Student Records</h1>
      {
        studentRecords && (
          <>
            {
              userSession.user.role !== 'viewer' && (
                <Box sx={{textAlign: "right", marginBottom: "10px"}}>
                  <IconButton
                    aria-label="delete records"
                    title={"Delete records"}
                    size="large"
                    sx={{color:"secondary.dark", "&:hover": {backgroundColor:"secondary.dark", color: "#fff"}}}
                    disabled={!selectedRows.length > 0}
                    onClick={deleteStudentRecord}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
            <Box>
              <DataTable
                value={studentRecords}
                showGridlines
                paginator
                rows={20}
                rowsPerPageOptions={[5, 10, 20, 50]}
                currentPageReportTemplate="{first} to {last} of {totalRecords}"
                removableSort
                selection={selectedRows}
                onSelectionChange={(e) => setSelectedRows(e.value)}
                selectionMode={'checkbox'}
              >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
                { tableColumns.map((col, i) => (
                  <Column style={{fontSize: "14px"}} key={col.field} field={col.field} header={col.header} sortable={col.sortable} filter={col.filterEnabled} body={col.renderCell}/>
                ))}
              </DataTable>
            </Box>
            <Dialog
              open={open}
              onClose={()=> setOpen(false)}
              aria-labelledby="alert-dialog-title"
              aria-describedby="alert-dialog-description"
              sx={{
                "& .MuiDialog-container": {
                  "& .MuiPaper-root": {
                    width: "100%",
                    maxWidth: "460px",
                    minHeight: "200px"
                  },
                },
              }}
            >
              <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
                Upload response:
              </DialogTitle>
              <IconButton
                aria-label="close"
                onClick={()=> setOpen(false)}
                sx={(theme) => ({
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: theme.palette.grey[500],
                })}
              >
                <CloseIcon />
              </IconButton>
              <DialogContent dividers>
                <DialogContentText id="alert-dialog-description">
                  {
                    uploadResponse?.message
                  }
                </DialogContentText>
              </DialogContent>
            </Dialog>
          </>
        )
      }
    </>
  );
}

