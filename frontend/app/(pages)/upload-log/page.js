"use client"
import Box from "@mui/material/Box";
import {Tab, Tabs} from "@mui/material";
import {useEffect, useState} from "react";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import DatasetTable from "@/app/components/DatasetTable/DatasetTable";

function TabPanel(props) {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-data-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
export default function UploadPage() {
  const [value, setValue] = useState(0);
  const handleApiRequest = useHandleApiRequest();
  const { userSession } = useAuth();

  const [clinicalLogs, setClinicalLogs] = useState();
  const [studentLogs, setStudentLogs] = useState();
  const [programLogs, setProgramLogs] = useState();

  const getLogs = async ({table, hook}) => {
    return await handleApiRequest({
      action: 'log',
      method: 'POST',
      session: userSession,
      bodyObject: JSON.stringify({source: table})
    }).then( res => {
      if(res) {
        // Ordering the elements.
        hook(res.map((item) => ({
          file_name: item.file_name,
          upload_date: item.upload_date,
          record_status: item.record_status,
          error_message: item.error_message,
          student_id: item.student_id,
          first_name: item.first_name,
          last_name: item.last_name,
          birth_date: item.birth_date,
        })))
      }
    });
  }

  // Fetch log by category.
  useEffect(()=>{
    if(userSession) {
      !studentLogs && getLogs({table:"student_info", hook: setStudentLogs})
      !clinicalLogs && getLogs({table:"clinical_placements", hook: setClinicalLogs})
      !programLogs && getLogs({table:"program_info", hook: setProgramLogs})
    }
  },[userSession, studentLogs, clinicalLogs, programLogs])

  const tableColumns = ({tableRow}) => {
    const columnKeys = Object.keys(tableRow);
    return columnKeys.map( key => ({
      field: key,
      header: key?.replace("_", " "),
      filterEnabled: true,
      renderCell: null,
      sortable: true
    }))
  }



  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const tabs= ["Student IHE Data", "Clinical Placement Data", "Program and Student Data"];

  return (
    <Box sx={{"& table th": {textTransform: "capitalize"}}}>
      <h1>Upload Log</h1>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          {
            tabs.map( (tab, i) => <Tab label={tab} key={i}/>)
          }
        </Tabs>
      </Box>
      {
        studentLogs && (
          <TabPanel value={value} index={0}>
            <DatasetTable rowsData={studentLogs} columnsData={tableColumns({tableRow: studentLogs[0]})}/>
          </TabPanel>
        )
      }
      {
        clinicalLogs && (
          <TabPanel value={value} index={1}>
            <DatasetTable rowsData={clinicalLogs} columnsData={tableColumns({tableRow: clinicalLogs[0]})}/>
          </TabPanel>
        )
      }
      {
        programLogs && (
          <TabPanel value={value} index={2}>
            <DatasetTable rowsData={programLogs} columnsData={tableColumns({tableRow: programLogs[0]})}/>
          </TabPanel>
        )
      }
    </Box>
  )
}

