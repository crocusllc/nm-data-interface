'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useFilterState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse filters from URL
  const filters = useMemo(() => {
    const filterObj = {};
    searchParams.forEach((value, key) => {
      filterObj[key] = { value, matchMode: 'contains' };
    });
    return filterObj;
  }, [searchParams]);

  // Update URL with new filters
  const setFilters = useCallback((newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, filter]) => {
      if (filter?.value) {
        params.set(key, filter.value);
      }
    });
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [router, pathname]);

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  return { filters, setFilters, clearFilters };
}
