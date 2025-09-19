"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import { List } from "react-window";
import { TableLoader } from "./loading-spinner";

interface VirtualTableProps<T> {
  data: T[];
  itemHeight: number;
  height: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

type VirtualRowProps<T> = {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
};

type VirtualRowComponentProps<T> = VirtualRowProps<T> & {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: React.CSSProperties;
};

export function VirtualTable<T>({
  data,
  itemHeight,
  height,
  renderRow,
  loading = false,
  emptyMessage = "No data available",
  className = "",
  onScroll,
}: VirtualTableProps<T>) {
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    onScroll?.(scrollTop);
  }, [onScroll]);

  const rowProps = useMemo<VirtualRowProps<T>>(() => ({
    data,
    renderRow,
  }), [data, renderRow]);

  const RowComponent = useCallback(({
    ariaAttributes,
    data: rowData,
    index,
    renderRow: rowRenderer,
    style,
  }: VirtualRowComponentProps<T>) => {
    const item = rowData[index];
    return (
      <div style={style} {...ariaAttributes}>
        {item !== undefined ? rowRenderer(item, index) : null}
      </div>
    );
  }, []);

  if (loading) {
    return (
      <div style={{ height }} className={className}>
        <TableLoader text="Loading data..." />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center text-gray-500 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        defaultHeight={height}
        onScroll={handleScroll}
        rowComponent={RowComponent}
        rowCount={data.length}
        rowHeight={itemHeight}
        rowProps={rowProps}
        style={{ height }}
      />
    </div>
  );
}

// Hook for managing virtual table state
export function useVirtualTable<T>(
  data: T[],
  {
    pageSize = 20,
    searchFilter,
    sortConfig,
  }: {
    pageSize?: number;
    searchFilter?: (item: T) => boolean;
    sortConfig?: {
      key: keyof T;
      direction: 'asc' | 'desc';
    };
  } = {}
) {
  const [currentPage, setCurrentPage] = useState(0);

  const filteredData = useMemo(() => {
    let filtered = data;
    
    if (searchFilter) {
      filtered = filtered.filter(searchFilter);
    }
    
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [data, searchFilter, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  useEffect(() => {
    // Reset to first page when data changes
    setCurrentPage(0);
  }, [filteredData.length]);

  return {
    data: paginatedData,
    filteredData,
    currentPage,
    totalPages,
    totalItems: filteredData.length,
    hasNextPage: currentPage < totalPages - 1,
    hasPrevPage: currentPage > 0,
    goToPage,
    goToNextPage,
    goToPrevPage,
  };
}
