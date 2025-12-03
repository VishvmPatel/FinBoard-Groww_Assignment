'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { WidgetConfig, WidgetField } from '@/types';
import { useWidgetData } from '@/hooks/useWidgetData';
import { getNestedValue } from '@/utils/api';
import { formatFieldValue } from '@/utils/formatting';

interface TableWidgetProps {
  widget: WidgetConfig;
}

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
};

export default function TableWidget({ widget }: TableWidgetProps) {
  const { data, loading, error, getFieldValue } = useWidgetData(widget);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract array data from the first selected field
  const tableData = useMemo(() => {
    if (!data || widget.selectedFields.length === 0) return [];

    // Try to find array data
    const firstField = widget.selectedFields[0];
    const fieldValue = getNestedValue(data, firstField.path);
    
    if (Array.isArray(fieldValue)) {
      return fieldValue;
    }

    // If data itself is an array
    if (Array.isArray(data)) {
      return data;
    }

    // Try to find any array in the data (including nested objects)
    const findArray = (obj: any, path = ''): { array: any[]; path: string } | null => {
      if (Array.isArray(obj)) return { array: obj, path };
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;
          if (Array.isArray(value) && value.length > 0) {
            return { array: value, path: currentPath };
          }
          const found = findArray(value, currentPath);
          if (found) return found;
        }
      }
      return null;
    };

    const found = findArray(data);
    if (found) {
      // If we found an array, we need to adjust the field paths
      // Remove the array path prefix from selected fields
      return found.array;
    }
    
    return [];
  }, [data, widget.selectedFields, getFieldValue]);

  const filteredAndSortedData = useMemo(() => {
    let result = [...tableData];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((row) => {
        return widget.selectedFields.some((field) => {
          const value = getNestedValue(row, field.path);
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.field);
        const bValue = getNestedValue(b, sortConfig.field);
        
        const aNum = Number(aValue);
        const bNum = Number(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [tableData, searchQuery, sortConfig, widget.selectedFields]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (fieldPath: string) => {
    if (sortConfig?.field === fieldPath) {
      if (sortConfig.direction === 'asc') {
        setSortConfig({ field: fieldPath, direction: 'desc' });
      } else {
        setSortConfig(null);
      }
    } else {
      setSortConfig({ field: fieldPath, direction: 'asc' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-10 bg-dark-bg rounded animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-dark-bg rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (tableData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-muted text-sm mb-2">No data available</p>
        <p className="text-dark-muted text-xs mb-4">
          The API response doesn't contain array data. Check the API response structure.
        </p>
        <details className="mt-4 text-left max-w-full">
          <summary className="text-xs text-dark-muted cursor-pointer">Debug: API Response</summary>
          <pre className="mt-2 text-xs text-dark-muted bg-dark-bg p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Check if all values are N/A (field paths don't match)
  const sampleRow = tableData[0];
  const allFieldsNA = widget.selectedFields.every((field) => {
    const value = getNestedValue(sampleRow, field.path);
    return value === null || value === undefined;
  });

  return (
    <div className="space-y-4">
      {/* Debug warning if all fields show N/A */}
      {allFieldsNA && tableData.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded p-3">
          <p className="text-yellow-400 text-sm mb-2">
            ⚠️ All fields show "N/A" - Field paths don't match the data structure
          </p>
          <p className="text-dark-muted text-xs mb-2">
            The selected field paths don't match the actual API response. Check the debug section below to see the actual data structure.
          </p>
          <details className="mt-2">
            <summary className="text-xs text-yellow-400 cursor-pointer">Show API Response Structure</summary>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-dark-muted">Sample row data:</p>
              <pre className="text-xs text-dark-muted bg-dark-bg p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(sampleRow, null, 2)}
              </pre>
              <p className="text-xs text-dark-muted mt-2">Full API response:</p>
              <pre className="text-xs text-dark-muted bg-dark-bg p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Q Search table..."
          className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-border">
              {widget.selectedFields.map((field) => {
                const displayName = field.displayName || field.path.split('.').pop() || field.path;
                const isSorted = sortConfig?.field === field.path;
                
                return (
                  <th
                    key={field.path}
                    className="text-left p-3 text-sm font-medium text-dark-muted cursor-pointer hover:text-dark-text transition-colors"
                    onClick={() => handleSort(field.path)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{displayName}</span>
                      {isSorted && (
                        <span>
                          {sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className="border-b border-dark-border hover:bg-dark-bg transition-colors"
              >
                {widget.selectedFields.map((field) => {
                  // Extract the field name from the path
                  // If path is like "trending_stocks.top_gainers[0].ticker_id", extract "ticker_id"
                  // If path is like "ticker_id", use it directly
                  let fieldPath = field.path;
                  
                  // Handle array notation: "path[0].field" -> "field"
                  if (fieldPath.includes('[') && fieldPath.includes(']')) {
                    const afterBracket = fieldPath.split(']')[1];
                    if (afterBracket) {
                      fieldPath = afterBracket.replace(/^\./, ''); // Remove leading dot
                    }
                  }
                  
                  // If still a nested path, try to get the last part
                  // But first check if the row has the field directly
                  if (row && typeof row === 'object') {
                    // Try direct access first (most common case)
                    if (fieldPath in row) {
                      const value = row[fieldPath];
                      return (
                        <td key={field.path} className="p-3 text-sm text-dark-text">
                          {value !== null && value !== undefined ? String(value) : 'N/A'}
                        </td>
                      );
                    }
                    
                    // Try with just the last part of the path
                    const pathParts = fieldPath.split('.');
                    const lastPart = pathParts[pathParts.length - 1];
                    if (lastPart in row && lastPart !== fieldPath) {
                      const value = row[lastPart];
                      return (
                        <td key={field.path} className="p-3 text-sm text-dark-text">
                          {value !== null && value !== undefined ? String(value) : 'N/A'}
                        </td>
                      );
                    }
                  }
                  
                  // Fallback to nested value extraction
                  const value = getNestedValue(row, fieldPath);
                  
                  // Apply formatting if specified
                  const formattedValue = field.format
                    ? formatFieldValue(value, field)
                    : (value !== null && value !== undefined ? String(value) : 'N/A');
                  
                  return (
                    <td key={field.path} className="p-3 text-sm text-dark-text">
                      {formattedValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-border">
        {/* Page size selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-muted">Show:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 bg-dark-bg border border-dark-border rounded text-dark-text text-sm focus:outline-none focus:border-primary"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-dark-muted">items per page</span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-muted">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-dark-bg rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4 text-dark-muted" />
            </button>
            <span className="text-sm text-dark-text px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 hover:bg-dark-bg rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4 text-dark-muted" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

