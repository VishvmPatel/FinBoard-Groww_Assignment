# FINBOARD

A customizable finance dashboard builder that lets you connect to any financial API and create real-time data widgets.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

- **Custom Widgets** - Create widgets from any finance API (stocks, crypto, forex, etc.)
- **Multiple Display Modes** - Cards, tables, line charts, and candlestick charts
- **Real-time Updates** - Auto-refresh with configurable intervals
- **Responsive Layout** - Drag-and-drop grid that adapts to all screen sizes
- **Data Caching** - Smart caching to reduce API calls
- **Theme Support** - Light and dark mode
- **Export/Import** - Save and restore your dashboard configuration
- **Field Explorer** - Automatically discover and select data fields from API responses

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding a Widget

1. Click **"+ Add Widget"** or **"+ Add Your First Widget"**
2. Enter your API URL
3. (Optional) Add API key and header name if required
4. Click **"Test API"** to verify the connection
5. Select fields from the JSON explorer
6. Choose display mode (Card, Table, or Chart)
7. Set refresh interval and cache duration
8. Click **"Add Widget"**

### Widget Types

**Card Widget** - Display key metrics in a card format
- Best for: Single values, price displays, key indicators

**Table Widget** - Show data in a sortable, filterable table
- Best for: Lists of stocks, market data, multiple records
- Features: Search, sorting, pagination, column filters

**Chart Widget** - Visualize time-series data
- Line Chart: Track trends over time
- Candlestick Chart: OHLC data visualization

### Managing Widgets

- **Drag & Drop** - Rearrange widgets by dragging
- **Resize** - Click and drag corners to resize
- **Edit** - Click the settings icon to modify widget configuration
- **Refresh** - Click the refresh icon for manual data update
- **Remove** - Click the X icon to delete a widget

### Export/Import

**Export** - Download your dashboard configuration as JSON
- Includes all widgets and their layouts
- Preserves responsive layouts for all screen sizes

**Import** - Restore a saved dashboard
- Upload a previously exported JSON file
- Validates data before importing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit
- **Charts**: Recharts
- **Layout**: react-grid-layout
- **Storage**: LocalStorage

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   └── widgets/     # Widget components
├── hooks/           # Custom React hooks
├── store/           # Redux store and slices
├── utils/           # Utility functions
└── types/           # TypeScript type definitions
```

## API Integration

FINBOARD works with any REST API that returns JSON. Common use cases:

- **Stock APIs**: Finnhub, Alpha Vantage, Yahoo Finance
- **Crypto APIs**: Coinbase, Binance, CoinGecko
- **Forex APIs**: ExchangeRate-API, Fixer.io
- **Economic Data**: FRED, World Bank API

### Authentication

Two methods supported:
1. **Query Parameters** - Add API key directly in URL (`?token=YOUR_KEY`)
2. **Header-based** - Use API Key field with custom header name

### CORS Handling

If an API blocks browser requests, FINBOARD automatically uses a Next.js proxy route to fetch data server-side.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Deploy (automatic builds on push)

### Other Platforms

```bash
npm run build
npm start
```

The app will run on port 3000 by default.

## Configuration

### Environment Variables

No environment variables required. All configuration is done through the UI.

### Cache Settings

- **Cache TTL**: How long to cache API responses (default: 30s)
- **Refresh Interval**: How often to fetch new data (0 = disabled)

## Tips

- Use shorter cache TTL for frequently changing data
- Set refresh interval based on API rate limits
- Test your API connection before adding fields
- Use the JSON explorer to find the correct field paths
- Export your dashboard regularly to backup configurations


---

Built with ❤️ for finance enthusiasts
