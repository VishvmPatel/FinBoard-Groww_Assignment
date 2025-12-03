/**
 * Filter types for table columns
 */
export type FilterType = 'text' | 'number' | 'date' | 'select' | 'multiselect';

export interface ColumnFilter {
  fieldPath: string;
  filterType: FilterType;
  value?: any;
  // For number filters
  min?: number;
  max?: number;
  // For date filters
  dateFrom?: string;
  dateTo?: string;
  // For select/multiselect filters
  options?: string[];
  selectedOptions?: string[];
}

export interface FilterState {
  [fieldPath: string]: ColumnFilter;
}

