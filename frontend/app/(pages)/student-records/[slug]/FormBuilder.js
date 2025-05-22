import React, {useState} from "react";
import dayjs from 'dayjs';
import Box from "@mui/material/Box";
import {Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {useSystemMessage} from "@/app/utils/contexts/SystemMessage";
import DynamicSelect from "@/app/components/DynamicSelect/DynamicSelect";
import {useGlobalValues} from "@/app/utils/contexts/GobalValues";
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import {ClearIcon} from "@mui/x-date-pickers";

export default function FormBuilder({formFields, onCancel, defaultData, onSubmit, submitBtnTxt = 'save', onDelete, enableLock = false }) {
  const [formData, setFormData] = useState(
    Object.fromEntries(formFields.map(field => [field["CSV column name"], defaultData?.[field["CSV column name"]] ?? '']))
  );

  const { showSystemMessage, closeSystemMessage } = useSystemMessage();
  const { setGlobalValue } = useGlobalValues();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  const handleChange = (field, value) => {
    const filteredValue = Array.isArray(value) ? value.filter(v => v !== '') : value;
    setFormData((prev) => ({ ...prev, [field]: filteredValue }));
    setGlobalValue(prev => ({...prev, [field]: filteredValue}));
  };

  const handleDelete = (e) => {
    e.preventDefault()
    onDelete(formData);
    closeSystemMessage();
  }

  return (
    <Stack spacing={1} component="form" sx={{ p: 4 }} onSubmit={handleSubmit}>
      {
        formFields.map( (field, i)=> {
          if (field?.Type === "select") {
            if(field['Dropdown or validation values']) {
              let multi;
              if(field["multi-select"]) {
                const value = formData?.[field['CSV column name']];
                // This variable is an array when set by the form.
                // The database store it as a string with values separated by ";".
                multi = Array.isArray(value) ? value : value?.split(';') || [];
              }

              return (
                <FormControl variant="filled" fullWidth key={i} required={field["Required field"]}>
                  <InputLabel id={`${[field['CSV column name']]}-label`}>
                    {field['Data element label']}
                  </InputLabel>
                  <Select
                    labelId={`${[field['CSV column name']]}-label`}
                    id={field['CSV column name']}
                    value={ field["multi-select"]
                      ? multi
                      : formData?.[field['CSV column name']]}
                    label={field['Data element label']}
                    onChange={(e) => handleChange(field['CSV column name'], e.target.value)}
                    multiple={field["multi-select"]}
                    endAdornment={
                      <InputAdornment sx={{ marginRight: "10px" }} position="end">
                        <IconButton
                          onClick={() =>  handleChange(field['CSV column name'], "")}
                        >
                          <ClearIcon fontSize="small"></ClearIcon>
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    {
                      field['Dropdown or validation values']?.split(";").map( (opt, i) => <MenuItem key={i} value={opt}>{opt}</MenuItem>)
                    }
                  </Select>
                </FormControl>
              )
            }

            if(field['Validation values from API']) {
              const apiData = field['Validation values from API'];
              return (
                <FormControl variant="filled" fullWidth key={i} required={field["Required field"]}>
                  <DynamicSelect
                    field={field}
                    actionPath={apiData?.path}
                    method={apiData?.method}
                    formData={formData}
                    changeFn={handleChange}
                  />
                </FormControl>
              )
            }

          } else if( field?.Type === "text") {
            return (
              <TextField key={i}
                 id={field['CSV column name']}
                 required={field["Required field"]}
                 value={formData?.[field['CSV column name']] ?? undefined}
                 label={field['Data element label']}
                 variant="filled"
                 onChange={(e) => handleChange(field['CSV column name'], e.target.value)}
              />
            )
          } else if( field?.Type === "date") {
            return (
              <LocalizationProvider dateAdapter={AdapterDayjs} key={i}>
                <DatePicker
                  label={field['Data element label']}
                  value={formData?.[field['CSV column name']] === '' ? null : dayjs(formData?.[field['CSV column name']]) }
                  onChange={(date) => handleChange(field['CSV column name'], dayjs(date).format('YYYY-MM-DD'))}
                  format="MM/DD/YYYY"
                  slotProps={{ textField: { required: field["Required field"]}}}
                />
              </LocalizationProvider>
            )
          } else {
            return <div key={i}>The field type not match: {field?.Type}</div>
          }
        })
      }
      {/** Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        {
          onDelete &&  (
            <Button
              variant="contained"
              color={"error"}
              onClick={()=>showSystemMessage({
                title: <><WarningAmberIcon fontSize="large"/> Warning</>,
                content: <p>Are you sure you want to delete this record? This action can not be undone.</p>,
                actions: (
                  <>
                    <Button variant="outlined" color="primary" onClick={closeSystemMessage}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
                  </>
                )
              })}>
              Delete
            </Button>
          )
        }
        {
          onCancel && (
            <Button variant="outlined" onClick={()=>onCancel()}>
              Cancel
            </Button>
          )
        }
        <Button variant="contained" type="submit" disabled={enableLock ? !Object.keys(formData).some( key => formData[key]) : false}>
          { submitBtnTxt }
        </Button>
      </Box>
      {
        (enableLock && !Object.keys(formData).some( key => formData[key])) && (
          <Box sx={{display: "block", fontSize: "12px", textAlign:"right"}}>Please fill in at least one field to continue.</Box>
        )
      }
    </Stack>
  )
}