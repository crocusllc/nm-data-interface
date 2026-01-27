import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import React from "react";
import "primereact/resources/themes/lara-light-cyan/theme.css";

export default function DatasetTable({rowsData, columnsData, selectionHook = null, selectionFn = null, selectionMode = null, configs = {}, filters = null, onFilterChange = null }) {

  return(
    <DataTable
      value={rowsData}
      showGridlines
      paginator
      rows={20}
      rowsPerPageOptions={[5, 10, 20, 50]}
      currentPageReportTemplate="{first} to {last} of {totalRecords}"
      removableSort
      selection={selectionHook}
      onSelectionChange={selectionFn}
      filters={filters}
      onFilter={(e) => onFilterChange && onFilterChange(e.filters)}
      {...configs}
    >
      {
        selectionHook && (
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        )
      }
      { columnsData.map(col => (
        <Column style={{fontSize: "14px"}} key={col.field} field={col.field} header={col.header} sortable={col.sortable} filter={col.filterEnabled} body={col.renderCell}/>
      ))}
    </DataTable>
  )
}