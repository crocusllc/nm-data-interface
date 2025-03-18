"use client"
import Box from '@mui/material/Box';
import {notFound, useParams, useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import CategoryManager from "@/app/(pages)/student-records/[slug]/CategoryManager";
import Stack from '@mui/material/Stack';
import getConfigData from "@/app/utils/getConfigs"
import {useAuth} from "@/app/utils/contexts/AuthProvider";
import {useHandleApiRequest} from "@/app/utils/hooks/useHandleApiRequest";

export default function StudentRecordPage() {
  const { userSession } = useAuth();
  const params = useParams();
  const handleApiRequest = useHandleApiRequest();
  const slug = params.slug;
  const router = useRouter();

  const [studentRecordData, setStudentRecordData] = useState();
  const [loadData, setLoadData] = useState(true);
  const categories = getConfigData()?.categories;

  useEffect(()=> {
    if(userSession && loadData) {
      setLoadData(false);

      handleApiRequest({
        action: "student_record_info",
        method: "POST",
        session: userSession,
        bodyObject: JSON.stringify({student_id: slug})
      }).then(data => {
        if(data.student_info && data.clinical_placements && data.program_info) {
          setStudentRecordData(data);
        } else {
          router.push("/404");
        }
      })
    }
  }, [userSession, loadData])

  // Get the Student Record Config Data.
  const configFormData = getConfigData()?.fields.find( el => el?.form?.Name === "Student Records")?.form;
  const filteredFormData = Object.fromEntries(
    Object.entries(configFormData).filter(
      ([, value]) => value["Display on Student Record page?"] !== false
    )
  );
  const fieldKeys =  Object.keys(filteredFormData)
  let formCategories = {}
  // Grouping fields by category.
  fieldKeys.forEach( el => {
    if(filteredFormData[el]?.Category && filteredFormData[el]?.Category !== "global") {
      if(formCategories[filteredFormData[el].Category]) {
        formCategories[filteredFormData[el].Category].push(filteredFormData[el])
      } else {
        formCategories = {
          ...formCategories,
          [filteredFormData[el].Category]: [
            filteredFormData[el]
          ]
        }
      }
    }
  })

  return (
    <>
      <h1>Student ID #: {slug}</h1>
      <Stack spacing={2} sx={{maxWidth: "768px"}}>
        {
          studentRecordData &&
            Object.keys(categories).filter(cat => cat !== "global").map( catKey => {
              return (
                <Stack spacing={2} key={catKey} sx={{padding: "16px", border: "1px solid #ccc", borderRadius: "4px",  position: "relative"}}>
                  <Box component={"h2"} sx={{marginBottom: "10px"}}>
                    {categories[catKey].label}
                  </Box>
                  {
                    (categories[catKey]?.addable) && (
                      <CategoryManager formData={formCategories[catKey]} config={categories[catKey]} tableKey={catKey} studentId={slug} addable={categories[catKey]?.addable} onFetch={()=>setLoadData(true)} />
                    )
                  }
                  {
                    studentRecordData[catKey === "additional_student_info" ? "program_info" : catKey]?.map( (item, i) => {
                      const isMultiple = studentRecordData[catKey === "additional_student_info" ? "program_info" : catKey].length > 1;
                      return (
                        <Stack key={i} sx={{ border: `${ isMultiple ? "1px solid #ccc" : "none" }`, borderRadius: "4px", position:"relative", padding:`${ isMultiple ? "10px" : 0 }` }}>
                          <CategoryManager displayData={item} formData={formCategories[catKey]} config={categories[catKey]} tableKey={catKey} studentId={slug} onFetch={()=>setLoadData(true)}/>
                        </Stack>
                      )
                    })

                  }
                </Stack>
              )
            })
        }
      </Stack>
    </>
  );
}
