'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { WidgetConfig } from '@/types';
import { useWidgetData } from '@/hooks/useWidgetData';
import { getNestedValue } from '@/utils/api';

interface CandlestickChartWidgetProps {
  widget: WidgetConfig;
}

interface CandlestickData {
  name: string;
  open: number;
  high: number;
  low: number;
  close: number;
  date?: string;
}

export default function CandlestickChartWidget({ widget }: CandlestickChartWidgetProps) {
  const { data, loading, error } = useWidgetData(widget);
  
  // Get time interval for display purposes
  const timeInterval = widget.timeInterval || 'daily';

  const chartData = useMemo(() => {
    if (!data || widget.selectedFields.length === 0) return [];

    // Try to extract array data
    const firstField = widget.selectedFields[0];
    const fieldValue = getNestedValue(data, firstField.path);
    
    let arrayData: any[] = [];
    
    if (Array.isArray(fieldValue)) {
      arrayData = fieldValue;
    } else if (Array.isArray(data)) {
      arrayData = data;
    } else {
      // Try to find array in nested structure
      const findArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) return obj;
        if (typeof obj === 'object' && obj !== null) {
          for (const value of Object.values(obj)) {
            const found = findArray(value);
            if (found) return found;
          }
        }
        return null;
      };
      
      const foundArray = findArray(data);
      if (foundArray) arrayData = foundArray;
    }

    // Map fields to OHLC (Open, High, Low, Close)
    const ohlcFields = {
      open: widget.selectedFields.find((f) => 
        f.path.toLowerCase().includes('open') || 
        f.displayName?.toLowerCase().includes('open')
      ),
      high: widget.selectedFields.find((f) => 
        f.path.toLowerCase().includes('high') || 
        f.displayName?.toLowerCase().includes('high')
      ),
      low: widget.selectedFields.find((f) => 
        f.path.toLowerCase().includes('low') || 
        f.displayName?.toLowerCase().includes('low')
      ),
      close: widget.selectedFields.find((f) => 
        f.path.toLowerCase().includes('close') || 
        f.path.toLowerCase().includes('price') ||
        f.displayName?.toLowerCase().includes('close') ||
        f.displayName?.toLowerCase().includes('price')
      ),
      date: widget.selectedFields.find((f) => 
        f.path.toLowerCase().includes('date') || 
        f.path.toLowerCase().includes('time') ||
        f.displayName?.toLowerCase().includes('date')
      ),
    };

    // Transform array data for candlestick chart
    return arrayData.slice(0, 50).map((item, index) => {
      const open = ohlcFields.open ? Number(getNestedValue(item, ohlcFields.open.path)) : 0;
      const high = ohlcFields.high ? Number(getNestedValue(item, ohlcFields.high.path)) : 0;
      const low = ohlcFields.low ? Number(getNestedValue(item, ohlcFields.low.path)) : 0;
      const close = ohlcFields.close ? Number(getNestedValue(item, ohlcFields.close.path)) : 0;
      const date = ohlcFields.date ? String(getNestedValue(item, ohlcFields.date.path)) : `Item ${index + 1}`;

      return {
        name: date,
        open: isNaN(open) ? 0 : open,
        high: isNaN(high) ? 0 : high,
        low: isNaN(low) ? 0 : low,
        close: isNaN(close) ? 0 : close,
        date,
      } as CandlestickData;
    }).filter((item) => item.open > 0 || item.high > 0 || item.low > 0 || item.close > 0);
  }, [data, widget.selectedFields]);

  // Calculate range for wick (high-low)
  const candlestickData = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      range: item.high - item.low,
      bodyTop: Math.max(item.open, item.close),
      bodyBottom: Math.min(item.open, item.close),
      bodyHeight: Math.abs(item.close - item.open),
      isPositive: item.close >= item.open,
    }));
  }, [chartData]);

  if (loading) {
    return (
      <div className="h-64 bg-dark-bg rounded animate-pulse flex items-center justify-center">
        <p className="text-dark-muted text-sm">Loading chart data...</p>
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

  if (candlestickData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-muted text-sm mb-2">No data available for candlestick chart</p>
        <p className="text-dark-muted text-xs">
          Candlestick charts require Open, High, Low, and Close fields. Make sure you've selected fields with these names.
        </p>
      </div>
    );
  }

  // Custom candlestick cell renderer
  const renderCandlestick = (entry: any, index: number) => {
    const isPositive = entry.isPositive;
    return (
      <Cell key={`cell-${index}`} fill={isPositive ? '#10b981' : '#ef4444'} />
    );
  };

  // Format X-axis labels based on time interval
  const formatXAxisLabel = (value: any, index: number): string => {
    // If data has a date/timestamp field, use it
    if (candlestickData[index] && candlestickData[index].date) {
      const date = new Date(candlestickData[index].date);
      if (timeInterval === 'daily') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeInterval === 'weekly') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (timeInterval === 'monthly') {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
    }
    // Fallback to name or index
    return value || String(index + 1);
  };

  return (
    <div className="h-64 w-full">
      <div className="mb-2 text-xs text-dark-muted text-center">
        {timeInterval.charAt(0).toUpperCase() + timeInterval.slice(1)} Interval - Candlestick
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={candlestickData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="name" 
            stroke="#94a3b8"
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
            tickFormatter={formatXAxisLabel}
          />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f1f5f9',
            }}
            formatter={(value: any, name: string) => {
              if (name === 'open' || name === 'high' || name === 'low' || name === 'close') {
                return [value.toFixed(2), name.toUpperCase()];
              }
              return [value, name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          {/* High-Low range bar (represents the wick) */}
          <Bar 
            dataKey="range" 
            fill="transparent"
            stroke="#94a3b8"
            strokeWidth={1}
          />
          {/* Body (open-close difference) */}
          <Bar 
            dataKey="bodyHeight" 
            fill="#10b981"
          >
            {candlestickData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isPositive ? '#10b981' : '#ef4444'} 
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-dark-muted">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded"></div>
          <span>Bullish (Close ≥ Open)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Bearish (Close &lt; Open)</span>
        </div>
      </div>
    </div>
  );
}

