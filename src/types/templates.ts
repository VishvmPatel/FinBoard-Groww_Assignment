import { WidgetField, DisplayMode, ChartType, TimeInterval } from './widget';

/**
 * Pre-built widget templates for common finance use cases
 */
export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'stock' | 'market' | 'custom';
  displayMode: DisplayMode;
  chartType?: ChartType;
  timeInterval?: TimeInterval;
  defaultFields: WidgetField[];
  defaultApiUrl?: string; // Example URL pattern (user must customize with their own API)
  defaultApiKeyHeader?: string; // Suggested header name for API key
  refreshInterval?: number; // Suggested refresh interval in seconds
  instructions?: string; // Instructions for setting up the template
  apiProvider?: string; // Name of the API provider this template is based on (e.g., "Finnhub", "Indian Stock API")
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // Stock Price Templates
  {
    id: 'stock-price',
    name: 'Stock Price',
    description: 'Display current stock price with key metrics',
    category: 'stock',
    displayMode: 'card',
    defaultFields: [
      { path: 'c', displayName: 'Current Price', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 'd', displayName: 'Change', format: 'number', decimalPlaces: 2 },
      { path: 'dp', displayName: 'Change %', format: 'percentage', decimalPlaces: 2 },
      { path: 'h', displayName: 'High', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 'l', displayName: 'Low', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
    ],
    defaultApiUrl: 'https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_TOKEN',
    refreshInterval: 30,
    apiProvider: 'Finnhub',
    instructions: '⚠️ This is an EXAMPLE URL. You need to:\n1. Sign up at finnhub.io and get your API token\n2. Replace YOUR_TOKEN with your actual token\n3. Change symbol=AAPL to your desired stock symbol\n\nOr use any other stock API that returns similar data structure.',
  },
  {
    id: 'stock-price-indian',
    name: 'Indian Stock Price',
    description: 'Display current Indian stock price with key metrics',
    category: 'stock',
    displayMode: 'card',
    defaultApiKeyHeader: 'x-api-key',
    defaultFields: [
      { path: 'price', displayName: 'Current Price', format: 'currency', currencySymbol: '₹', decimalPlaces: 2 },
      { path: 'net_change', displayName: 'Change', format: 'number', decimalPlaces: 2 },
      { path: 'percent_change', displayName: 'Change %', format: 'percentage', decimalPlaces: 2 },
      { path: 'high', displayName: 'High', format: 'currency', currencySymbol: '₹', decimalPlaces: 2 },
      { path: 'low', displayName: 'Low', format: 'currency', currencySymbol: '₹', decimalPlaces: 2 },
      { path: 'volume', displayName: 'Volume', format: 'number', decimalPlaces: 0 },
    ],
    defaultApiUrl: 'https://stock.indianapi.in/stock?name=RELIANCE',
    refreshInterval: 30,
    apiProvider: 'Indian Stock API',
    instructions: '⚠️ This is an EXAMPLE URL. You need to:\n1. Get your API key from stock.indianapi.in\n2. Add your API key in the "API Key" field with header "x-api-key"\n3. Change name=RELIANCE to your desired stock symbol\n\nOr use any other Indian stock API that returns similar data structure.',
  },

  // Stock Chart Templates
  {
    id: 'stock-chart-line',
    name: 'Stock Price Chart (Line)',
    description: 'Line chart showing stock price over time',
    category: 'stock',
    displayMode: 'chart',
    chartType: 'line',
    timeInterval: 'daily',
    defaultFields: [
      { path: 'c', displayName: 'Close Price', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 't', displayName: 'Timestamp', format: 'datetime' },
    ],
    defaultApiUrl: 'https://finnhub.io/api/v1/stock/candle?symbol=AAPL&resolution=D&from=1690000000&to=1700000000&token=YOUR_TOKEN',
    refreshInterval: 300,
    apiProvider: 'Finnhub',
    instructions: '⚠️ This is an EXAMPLE URL. You need to:\n1. Sign up at finnhub.io and get your API token\n2. Replace YOUR_TOKEN with your actual token\n3. Adjust symbol, resolution (D/W/M), and time range as needed\n\nOr use any other stock API that returns time-series price data.',
  },
  {
    id: 'stock-chart-candlestick',
    name: 'Stock Price Chart (Candlestick)',
    description: 'Candlestick chart showing OHLC data',
    category: 'stock',
    displayMode: 'chart',
    chartType: 'candlestick',
    timeInterval: 'daily',
    defaultFields: [
      { path: 'o', displayName: 'Open', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 'h', displayName: 'High', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 'l', displayName: 'Low', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 'c', displayName: 'Close', format: 'currency', currencySymbol: '$', decimalPlaces: 2 },
      { path: 't', displayName: 'Timestamp', format: 'datetime' },
    ],
    defaultApiUrl: 'https://finnhub.io/api/v1/stock/candle?symbol=AAPL&resolution=D&from=1690000000&to=1700000000&token=YOUR_TOKEN',
    refreshInterval: 300,
    apiProvider: 'Finnhub',
    instructions: '⚠️ This is an EXAMPLE URL. You need to:\n1. Sign up at finnhub.io and get your API token\n2. Replace YOUR_TOKEN with your actual token\n3. Adjust symbol, resolution (D/W/M), and time range as needed\n\nOr use any other stock API that returns OHLC/candlestick data.',
  },

  // Market Data Templates
  {
    id: 'market-trending',
    name: 'Trending Stocks',
    description: 'Table showing trending stocks (gainers/losers)',
    category: 'market',
    displayMode: 'table',
    defaultFields: [
      { path: 'ticker_id', displayName: 'Ticker', format: 'none' },
      { path: 'company_name', displayName: 'Company', format: 'none' },
      { path: 'price', displayName: 'Price', format: 'currency', currencySymbol: '₹', decimalPlaces: 2 },
      { path: 'percent_change', displayName: 'Change %', format: 'percentage', decimalPlaces: 2 },
      { path: 'volume', displayName: 'Volume', format: 'number', decimalPlaces: 0 },
    ],
    defaultApiUrl: 'https://stock.indianapi.in/trending_stocks',
    defaultApiKeyHeader: 'x-api-key',
    refreshInterval: 60,
    apiProvider: 'Indian Stock API',
    instructions: '⚠️ This is an EXAMPLE URL. You need to:\n1. Get your API key from stock.indianapi.in\n2. Add your API key in the "API Key" field with header "x-api-key"\n\nOr use any other API that returns trending stocks data in a similar format.',
  },

  // Custom/Blank Template
  {
    id: 'custom',
    name: 'Custom Widget',
    description: 'Start with a blank template and configure manually',
    category: 'custom',
    displayMode: 'card',
    defaultFields: [],
    refreshInterval: 60,
    instructions: 'Configure all fields manually. Use the JSON field selector to explore your API response.',
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WidgetTemplate | undefined {
  return WIDGET_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: WidgetTemplate['category']): WidgetTemplate[] {
  return WIDGET_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all categories
 */
export function getTemplateCategories(): WidgetTemplate['category'][] {
  return Array.from(new Set(WIDGET_TEMPLATES.map((t) => t.category)));
}

