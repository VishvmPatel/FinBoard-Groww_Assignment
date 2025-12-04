export type DisplayMode = 'card' | 'table' | 'chart';

export type ChartType = 'line' | 'candlestick';
export type TimeInterval = 'daily' | 'weekly' | 'monthly' | 'custom';

export type FieldFormat = 'none' | 'currency' | 'percentage' | 'number' | 'date' | 'datetime';

export interface WidgetField {
  path: string;
  displayName?: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  format?: FieldFormat;
  currencySymbol?: string; // For currency format (e.g., '$', '₹', '€')
  decimalPlaces?: number; // Number of decimal places
}

export interface WidgetConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string; // API key for header-based authentication
  apiKeyHeader?: string; // Header name for API key (e.g., 'x-api-key')
  refreshInterval: number; // in seconds
  cacheTTL?: number; // Cache time-to-live in seconds (default: 30)
  displayMode: DisplayMode;
  selectedFields: WidgetField[];
  chartType?: ChartType;
  timeInterval?: TimeInterval; // For chart time intervals (Daily, Weekly, Monthly)
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  createdAt: number;
  lastUpdated?: number;
}

export interface ApiResponse {
  data: any;
  error?: string;
  timestamp: number;
}

export interface FieldMapping {
  path: string;
  value: any;
  type: string;
  children?: FieldMapping[];
}

export interface DashboardState {
  widgets: WidgetConfig[];
  layout: Record<string, { x: number; y: number; w: number; h: number }>;
}

// Dashboard export/import configuration
export interface DashboardExport {
  version: string;
  exportDate: string;
  widgets: WidgetConfig[];
  layouts?: {
    lg?: Record<string, { x: number; y: number; w: number; h: number }>;
    md?: Record<string, { x: number; y: number; w: number; h: number }>;
    sm?: Record<string, { x: number; y: number; w: number; h: number }>;
    xs?: Record<string, { x: number; y: number; w: number; h: number }>;
    xxs?: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  metadata?: {
    widgetCount: number;
    layoutBreakpoints?: string[];
  };
}