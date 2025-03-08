import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import CircularProgress from '@mui/material/CircularProgress';
import {useGlobalValues} from "@/app/utils/contexts/GobalValues";

export default function DynamicSelect({actionPath, field, formData, changeFn, method}) {
  const { userSession } = useAuth();
  const handleApiRequest = useHandleApiRequest();
  const [options, setOptions] = useState();
  const {globalValues, setGlobalValue} = useGlobalValues();

  useEffect(()=> {
    if(!options && !field['Depends on'] && userSession) {
      handleApiRequest({
        action: actionPath,
        method: method,
        session: userSession,
        bodyObject: null
      }).then( res => {
        if(res) {
          setOptions(res?.split(";"));
        }
      });
    }
    if(formData?.[field['CSV column name']] && field['Global value']) {
      setGlobalValue(prev => ({...prev, [field['CSV column name']]: formData?.[field['CSV column name']]}));
    }
  },[userSession])

  useEffect(()=>{
    if(field['Depends on'] && globalValues?.[field['Depends on']]) {
      const param = globalValues[field['Depends on']];
      handleApiRequest({
        action: actionPath,
        method: method,
        session: userSession,
        bodyObject: JSON.stringify({district_name: param})
      }).then( res => {
        if(res) {
          setOptions(res?.split(";"));
        }
      });
    }
  },[globalValues?.[field['Depends on']]])

  return (
    <>
      <InputLabel id={`${[field['CSV column name']]}-label`}>
        {field['Data element label']}
      </InputLabel>
      <Select
        labelId={`${[field['CSV column name']]}-label`}
        id={field['CSV column name']}
        value={ options
          ? formData?.[field['CSV column name']] ?? (field["multi-select"] ? [] : '')
          : (field["multi-select"] ? [] : '')
        }
        label={field['Data element label']}
        onChange={(e) => changeFn(field['CSV column name'], e.target.value)}
        multiple={field["multi-select"]}
      >
        { !options ? (
          <MenuItem disabled>
            <CircularProgress size={24} />
            &nbsp; Loading options...
          </MenuItem>
        ) : (
          options?.map((option, i) => (
            <MenuItem key={i} value={option}>
              {option}
            </MenuItem>
          ))
        )}
      </Select>
    </>
  )
}