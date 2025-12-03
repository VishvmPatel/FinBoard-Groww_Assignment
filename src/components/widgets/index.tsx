'use client';

import { WidgetConfig } from '@/types';
import CardWidget from './CardWidget';
import TableWidget from './TableWidget';
import ChartWidget from './ChartWidget';
import CandlestickChartWidget from './CandlestickChartWidget';

interface WidgetRendererProps {
  widget: WidgetConfig;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  switch (widget.displayMode) {
    case 'card':
      return <CardWidget widget={widget} />;
    case 'table':
      return <TableWidget widget={widget} />;
    case 'chart':
      // Check if chart type is candlestick
      if (widget.chartType === 'candlestick') {
        return <CandlestickChartWidget widget={widget} />;
      }
      return <ChartWidget widget={widget} />;
    default:
      return <CardWidget widget={widget} />;
  }
}

export { CardWidget, TableWidget, ChartWidget, CandlestickChartWidget };


