import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import React, {useState, useEffect} from "react";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import "primereact/resources/primereact.min.css";

export default function DatasetTable({rowsData, columnsData, selectionHook = null, selectionFn = null, selectionMode = null, configs = {}, filters = null, onFilterChange = null }) {
  // Build initial filters object with entries for ALL filterable columns
  const buildFiltersObject = (externalFilters) => {
    const filterObj = {};
    
    // Initialize filter entry for each filterable column
    columnsData.forEach(col => {
      if (col.filterEnabled && col.field) {
        // Check if we have an external filter value for this column
        const externalValue = externalFilters?.[col.field];
        if (externalValue && typeof externalValue === 'object' && externalValue.value) {
          filterObj[col.field] = { 
            value: externalValue.value, 
            matchMode: externalValue.matchMode || 'contains' 
          };
        } else {
          // Initialize with null value
          filterObj[col.field] = { value: null, matchMode: 'contains' };
        }
      }
    });
    
    return filterObj;
  };

  const [internalFilters, setInternalFilters] = useState(() => buildFiltersObject(filters));

  // Sync external filters prop with internal state when columns or filters change
  useEffect(() => {
    setInternalFilters(buildFiltersObject(filters));
  }, [filters, columnsData]);

  const handleFilterChange = (e) => {
    if (!e || !e.filters) {
      return;
    }
    
    // Update internal filters - keep full structure
    setInternalFilters(e.filters);
    
    // For external callback, only send filters with actual values
    if (onFilterChange) {
      const filtersWithValues = {};
      Object.entries(e.filters).forEach(([key, filter]) => {
        if (filter && filter.value !== null && filter.value !== undefined && String(filter.value).trim() !== '') {
          filtersWithValues[key] = { 
            value: String(filter.value).trim(), 
            matchMode: filter.matchMode || 'contains' 
          };
        }
      });
      onFilterChange(filtersWithValues);
    }
  };

  // Inject CSS for filter inputs
  useEffect(() => {
    const styleId = 'datatable-filter-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Filter row styling */
        .p-datatable .p-datatable-thead > tr > th {
          padding: 0.75rem 1rem !important;
          background-color: #f8f9fa !important;
          border-bottom: 2px solid #dee2e6 !important;
        }
        
        .p-datatable-filter-row td {
          padding: 0.75rem 0.5rem !important;
          background-color: #f8f9fa !important;
          border-bottom: 1px solid #dee2e6 !important;
        }
        
        /* Filter input styling */
        .p-datatable-filter-row input.p-inputtext {
          color: #333333 !important;
          background-color: #ffffff !important;
          border: 1px solid #ced4da !important;
          border-radius: 6px !important;
          padding: 0.625rem 0.875rem !important;
          font-size: 13px !important;
          width: 100% !important;
          min-width: 120px !important;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out !important;
        }
        
        .p-datatable-filter-row input.p-inputtext::placeholder {
          color: #9ca3af !important;
          opacity: 1 !important;
          font-size: 12px !important;
        }
        
        .p-datatable-filter-row input.p-inputtext:hover {
          border-color: #adb5bd !important;
        }
        
        .p-datatable-filter-row input.p-inputtext:focus {
          border-color: #6366f1 !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15) !important;
        }
        
        /* Column minimum widths for better spacing */
        .p-datatable .p-datatable-tbody > tr > td {
          padding: 0.75rem 1rem !important;
        }
        
        /* Table overall styling */
        .p-datatable {
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }
        
        .p-datatable .p-datatable-wrapper {
          border-radius: 8px !important;
        }
        
        /* Sortable header styling */
        .p-datatable .p-sortable-column:hover {
          background-color: #e9ecef !important;
        }
        
        /* Paginator styling */
        .p-paginator {
          padding: 0.75rem 1rem !important;
          background-color: #f8f9fa !important;
          border-top: 1px solid #dee2e6 !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

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
      filters={internalFilters}
      onFilter={handleFilterChange}
      filterDisplay="row"
      {...configs}
    >
      {
        selectionHook && (
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }}></Column>
        )
      }
      { columnsData.map(col => (
        <Column 
          style={{fontSize: "14px", minWidth: col.filterEnabled ? "150px" : "auto"}} 
          key={col.field} 
          field={col.field} 
          header={col.header} 
          sortable={col.sortable} 
          filter={col.filterEnabled} 
          filterPlaceholder={col.filterEnabled ? `Search...` : undefined}
          filterMatchMode="contains"
          showFilterMenu={false}
          body={col.renderCell}
        />
      ))}
    </DataTable>
  )
}