"use client"
import Box from '@mui/material/Box';
import getConfigData from "@/app/utils/getConfigs"
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {useSystemMessage} from "@/app/utils/contexts/SystemMessage";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import DatasetTable from "@/app/components/DatasetTable/DatasetTable";

const getFullRecordLink = (rowData) => {
  return <Box component={"a"} sx={{color: "primary.dark"}} href={`/student-records/${rowData.student_id}`} title="View student full record">View Full Record</Box>;
};

export default function StudentRecordsPage() {
  // Getting user session data.
  const [studentRecords, setStudentRecords] = useState();
  const [selectedRows, setSelectedRows] = useState([]);

  let gridFields = [];
  let orderedGridColumn = []
  const { userSession } = useAuth();
  const { showSystemMessage, closeSystemMessage } = useSystemMessage();
  const handleApiRequest = useHandleApiRequest();

  async function fetchStudentRecordInfo() {
    return await handleApiRequest({
      action: "student_record_info",
      method: "GET",
      session: userSession,
      bodyObject: null
    });
  }

  useEffect(() => {
    if (userSession && !studentRecords) {
      fetchStudentRecordInfo().then(data => {
        if (data) {
          setStudentRecords(data);
        }
      });
    }
  }, [userSession]);

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

    return await handleApiRequest({
      action: "delete_student",
      method: "POST",
      session: userSession,
      bodyObject: JSON.stringify({student_id: studentIds})
    }).then(data => {
      if (data) {
        fetchStudentRecordInfo().then(data=> {
          setStudentRecords(data)
        });
        setSelectedRows([]);
        closeSystemMessage();
      }
    });
  }

  const deleteConfirmation = () => showSystemMessage({
    title: <><WarningAmberIcon fontSize="large"/> Warning</>,
    content: (
      <>
        <p>{`Are you sure you want to delete ${selectedRows.length > 1 ? "these records" : "this record"}:`}</p>
        <ul>
          {
            selectedRows?.map( el => <li key={el.student_id}><span>{el.student_id}</span> {el.first_name} {el.last_name}</li>)
          }
        </ul>
        <p>This action can be undone.</p>
      </>
    ),
    actions: (
      <>
        <Button variant="outlined" onClick={closeSystemMessage}>Cancel</Button>
        <Button variant="contained" color="error" onClick={deleteStudentRecord}>Delete</Button>
      </>
    )
  });

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
                    sx={{color:"#fff", backgroundColor:"secondary.main", "&: hover": {backgroundColor:"secondary.dark"}}}
                    disabled={!selectedRows.length}
                    onClick={deleteConfirmation}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )
            }
            <Box>
              <DatasetTable
                rowsData={studentRecords}
                columnsData={tableColumns}
                selectionFn={(e) => setSelectedRows(e.value)}
                selectionHook={selectedRows}
                configs={{sortField: "first_name", sortOrder: 1, selectionMode:'checkbox'}}
              />
            </Box>
          </>
        )
      }
    </>
  );
}

