# FinBoard - Finance Dashboard Builder

A customizable finance dashboard where users can add, remove, configure, and rearrange widgets. Each widget connects to a financial API and displays real-time data.

## Features

### Core Features
- **Widget Management System**
  - Add widgets with custom API endpoints
  - Remove widgets
  - Drag-and-drop widget rearranging
  - Responsive grid layout

- **API Integration**
  - Fetch and cache API responses
  - Handle rate limits, errors, loading states
  - Auto-refresh widgets using selected interval
  - JSON explorer component to map fields

- **Widget Types**
  - **Finance Cards:** Display selected fields in card format
  - **Table Widgets:** Paginated and searchable table view
  - **Charts:** Line chart visualization support

- **Data Persistence**
  - Persist widget configurations
  - Persist layout positions
  - Restore dashboard on refresh
  - Export/import configuration JSON (structure ready)

### UI/UX
- Dark themed dashboard UI
- Empty states, error states, loading skeletons
- Responsive design

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit
- **Charting:** Recharts
- **Layout:** react-grid-layout
- **Storage:** LocalStorage persistence
- **Fetching:** Custom polling with intervals

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # Root layout with Redux provider
│   ├── page.tsx        # Main dashboard page
│   └── globals.css     # Global styles
├── components/         # React components
│   ├── widgets/        # Widget type components
│   │   ├── CardWidget.tsx
│   │   ├── TableWidget.tsx
│   │   └── ChartWidget.tsx
│   ├── WidgetContainer.tsx
│   ├── AddWidgetModal.tsx
│   └── JSONFieldSelector.tsx
├── store/              # Redux store
│   ├── slices/         # Redux slices
│   │   └── widgetsSlice.ts
│   ├── store.ts
│   ├── hooks.ts
│   └── Provider.tsx
├── hooks/              # Custom React hooks
│   ├── useWidgetData.ts
│   └── useLocalStorage.ts
├── utils/              # Utility functions
│   ├── api.ts          # API fetching utilities
│   └── persistence.ts  # LocalStorage utilities
└── types/              # TypeScript types
    └── widget.ts
```

## Usage

### Adding a Widget

1. Click the "+ Add Widget" button
2. Enter a widget name (e.g., "Bitcoin Price Tracker")
3. Enter an API URL (e.g., `https://api.coinbase.com/v2/exchange-rates?currency=BTC`)
4. Click "Test" to verify the API connection
5. Select fields to display from the JSON explorer
6. Choose a display mode (Card, Table, or Chart)
7. Set the refresh interval in seconds
8. Click "Add Widget"

### Example APIs

- **Coinbase API:** `https://api.coinbase.com/v2/exchange-rates?currency=BTC`
- **CoinGecko API:** `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- **Alpha Vantage:** `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=YOUR_API_KEY`

### Widget Operations

- **Drag & Drop:** Click and drag widgets to rearrange
- **Resize:** Drag the bottom-right corner to resize widgets
- **Refresh:** Click the refresh icon to manually update data
- **Remove:** Click the X icon to remove a widget

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Future Enhancements

- Theme toggle (dark/light)
- WebSocket support for live updates
- Dashboard templates system
- Export/import dashboard configurations
- More chart types (candlestick, bar, pie)
- Widget settings modal
- API authentication support

## License

MIT
