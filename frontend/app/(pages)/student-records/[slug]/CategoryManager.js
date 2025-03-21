import {IconButton, Stack} from "@mui/material";
import Box from "@mui/material/Box";
import React, {useState} from "react";
import EditIcon from "@mui/icons-material/Edit";
import FormBuilder from "@/app/(pages)/student-records/[slug]/FormBuilder";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import {GlobalValuesProvider} from "@/app/utils/contexts/GobalValues";
import {dateFormat} from "@/app/utils/globalFunctions";

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
    <GlobalValuesProvider>
      {
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
                (config?.editable && userSession && userSession.user.role !== 'viewer' && !addable) && (
                  <Stack direction="row" spacing={1} sx={{position: "absolute", right:"6px", top:"4px"}}>
                    <IconButton aria-label="edit" onClick={()=> setEditMode(true)}>
                      <EditIcon />
                    </IconButton>
                  </Stack>
                )
              }
              {
                displayData && (
                  (formData)?.map( (el, i) => {
                    const fieldDef = Object.keys(displayData).filter( field => el['CSV column name'] === field)[0];
                    if(fieldDef) {
                      const fieldValue = el["Type"] === "date" ? dateFormat(displayData[el['CSV column name']]) : displayData[el['CSV column name']];
                      return(
                        <Stack spacing={1} key={i}>
                          <Stack spacing={2} key={i} direction={{ xs: 'column', sm: 'row' }}>
                            <Box sx={{fontWeight: "bold", maxWidth:{sm: "48%"}}} className={"label"}>{ el['Data element label'] }: </Box>
                            <Box className={"value"}>{ el["multi-select"]
                              ? fieldValue?.replaceAll(";", ", ")
                              : fieldValue
                            }</Box>
                          </Stack>
                        </Stack>
                      )
                    }
                  })
                )
              }
            </>
          )
      }
    </GlobalValuesProvider>
  )
}