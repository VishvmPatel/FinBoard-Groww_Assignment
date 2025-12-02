export type DisplayMode = 'card' | 'table' | 'chart';

export type ChartType = 'line' | 'candlestick';

export interface WidgetField {
  path: string;
  displayName?: string;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
}

export interface WidgetConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey?: string; // API key for header-based authentication
  apiKeyHeader?: string; // Header name for API key (e.g., 'x-api-key')
  refreshInterval: number; // in seconds
  displayMode: DisplayMode;
  selectedFields: WidgetField[];
  chartType?: ChartType;
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

