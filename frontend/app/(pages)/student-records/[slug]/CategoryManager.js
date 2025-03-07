import {IconButton, Stack} from "@mui/material";
import Box from "@mui/material/Box";
import React, {useState} from "react";
import EditIcon from "@mui/icons-material/Edit";
import FormBuilder from "@/app/(pages)/student-records/[slug]/FormBuilder";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";

export default function CategoryManager({displayData, formData, config, tableKey, studentId, onFetch, addable}) {
  const { userSession } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [addMode, setAddMonde] = useState(false)
  const handleApiRequest = useHandleApiRequest();

  const source_to_table = {
    "additional_student_info": "additional_student_data",
    "student_info": "student",
    "program_info": "additional_program_data",
    "clinical_placements": "clinical"
  }

  const handleSubmit = async (data) => {
    const postData = {
      student_id: studentId,
      source: source_to_table[tableKey], // This determines which table is updated
      ...data,
    }

    if(displayData?.id) {
      postData['id'] = displayData.id;
    }

    // Executing Create/Update record.
    return await handleApiRequest({
      action: "update_data",
      method: "POST",
      session: userSession,
      bodyObject: JSON.stringify(postData)
    }).then( response => {
      if(response) {
        setEditMode(false);
        setAddMonde(false);
        onFetch && onFetch();
      }
    });
  };

  async function deleteData() {
    // Executing Create/Update record.
    return await handleApiRequest({
      action: "delete_data",
      method: "POST",
      session: userSession,
      bodyObject: JSON.stringify({
        table_name: tableKey,
        id: displayData.id
      })
    }).then( response => {
      if(response) {
        setEditMode(false);
        setAddMonde(false);
        onFetch && onFetch();
      }
    });
  }

  return (
    (editMode || addMode)
      ? <FormBuilder
          formFields={formData}
          onCancel={()=>{setEditMode(false); setAddMonde(false)}}
          defaultData={displayData}
          onSubmit={handleSubmit}
          onDelete={(tableKey === "clinical_placements" && displayData) ? deleteData :null}
          submitBtnTxt={displayData ? "Update" : "Save"}
        />
      : (
          <>
            {
              (addable && userSession && userSession.user.role !== 'viewer') && (
                <Stack direction="row" sx={{position: "absolute", right:"6px", top:"10px", marginTop: "0 !important"}}>
                  <IconButton aria-label="add" onClick={()=>setAddMonde(true)}>
                    <AddCircleIcon />
                  </IconButton>
                </Stack>
              )
            }
            {
              displayData && (
                (formData)?.map( (el, i) => {
                  const fieldDef = Object.keys(displayData).filter( field => el['CSV column name'] === field)[0];
                  if(fieldDef) {
                    return(
                      <Stack spacing={1} key={i}>

                        <Stack direction="row" spacing={1} sx={{position: "absolute", right:"6px", top:"4px"}}>
                          {
                            (config?.editable && userSession && userSession.user.role !== 'viewer') && (
                              <IconButton aria-label="edit" onClick={()=> setEditMode(true)}>
                                <EditIcon />
                              </IconButton>
                            )
                          }
                        </Stack>
                        <Stack spacing={2} key={i} direction={"row"} >
                          <Box className={"label"}>{ el['Data element label'] }: </Box>
                          <Box className={"value"}>{displayData[el['CSV column name']]}</Box>
                        </Stack>
                      </Stack>
                    )
                  }
                })
              )
            }
          </>
      )
  )
}