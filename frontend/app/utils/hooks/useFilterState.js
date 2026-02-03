'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

// List of URL params that should NOT be treated as filters
const NON_FILTER_PARAMS = ['returnFilters'];

export function useFilterState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL (excluding special params)
  const filters = useMemo(() => {
    const filterObj = {};
    searchParams.forEach((value, key) => {
      // Only treat params as filters if they're not in the exclusion list
      if (!NON_FILTER_PARAMS.includes(key) && value) {
        filterObj[key] = { value, matchMode: 'contains' };
      }
    });
    return filterObj;
  }, [searchParams]);

  // Update URL with new filters (preserving non-filter params)
  const setFilters = useCallback((newFilters) => {
    const params = new URLSearchParams();
    
    // Preserve non-filter params from current URL
    searchParams.forEach((value, key) => {
      if (NON_FILTER_PARAMS.includes(key)) {
        params.set(key, value);
      }
    });
    
    // Add filter params - safely handle undefined/null filters
    if (newFilters && typeof newFilters === 'object') {
      Object.entries(newFilters).forEach(([key, filter]) => {
        // Handle both object format { value, matchMode } and direct value
        if (filter && typeof filter === 'object' && filter.value !== undefined && filter.value !== null) {
          const filterValue = String(filter.value).trim();
          if (filterValue !== '') {
            params.set(key, filterValue);
          }
        } else if (filter !== undefined && filter !== null) {
          // Handle direct value assignment
          const filterValue = String(filter).trim();
          if (filterValue !== '') {
            params.set(key, filterValue);
          }
        }
      });
    }
    
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    // Preserve non-filter params
    searchParams.forEach((value, key) => {
      if (NON_FILTER_PARAMS.includes(key)) {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [router, pathname, searchParams]);

  return { filters, setFilters, clearFilters };
}
