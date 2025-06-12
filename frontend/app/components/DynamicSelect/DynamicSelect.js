import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import React, {useEffect, useState} from "react";
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";
import CircularProgress from '@mui/material/CircularProgress';
import {useGlobalValues} from "@/app/utils/contexts/GobalValues";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export default function DynamicSelect({actionPath, field, formData, changeFn, method, required}) {
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
          // Cleaning field value if new options are set.
          changeFn(field['CSV column name'], "")
          // Set school options.
          setOptions(res?.split(";"));
        }
      });
    }
  },[globalValues?.[field['Depends on']]])

  return (
    <Autocomplete
      multiple={field["multi-select"]}
      id={field['CSV column name']}
      disabled={!options}
      options={options?.map(option => option)}
      onChange={ (e, newValue) => changeFn(field['CSV column name'], newValue)}
      getOptionLabel={option => option}
      value={ formData?.[field['CSV column name']] ?? (field["multi-select"] ? [] : '')}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="filled"
          label={field['Data element label']}
          required={required}
        />
      )}
    />
  )
}