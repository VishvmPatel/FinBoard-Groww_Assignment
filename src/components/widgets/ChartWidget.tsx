'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WidgetConfig, WidgetField } from '@/types';
import { useWidgetData } from '@/hooks/useWidgetData';
import { getNestedValue } from '@/utils/api';

interface ChartWidgetProps {
  widget: WidgetConfig;
}

export default function ChartWidget({ widget }: ChartWidgetProps) {
  const { data, loading, error, getFieldValue } = useWidgetData(widget);

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

    // Transform array data for chart
    return arrayData.slice(0, 50).map((item, index) => {
      const chartPoint: Record<string, any> = { index };
      
      widget.selectedFields.forEach((field) => {
        const value = getNestedValue(item, field.path);
        const displayName = field.displayName || field.path.split('.').pop() || field.path;
        
        // Try to convert to number for chart
        const numValue = Number(value);
        chartPoint[displayName] = isNaN(numValue) ? value : numValue;
      });
      
      return chartPoint;
    });
  }, [data, widget.selectedFields, getFieldValue]);

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

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-muted text-sm">No data available for chart</p>
      </div>
    );
  }

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="index" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#f1f5f9',
            }}
          />
          <Legend
            wrapperStyle={{ color: '#f1f5f9' }}
          />
          {widget.selectedFields.map((field, index) => {
            const displayName = field.displayName || field.path.split('.').pop() || field.path;
            return (
              <Line
                key={field.path}
                type="monotone"
                dataKey={displayName}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


