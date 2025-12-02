import { useEffect, useState, useCallback } from 'react';
import { fetchApiData, getNestedValue } from '@/utils/api';
import { WidgetConfig, ApiResponse, WidgetField } from '@/types';

export function useWidgetData(widget: WidgetConfig) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const response = await fetchApiData(
      widget.apiUrl,
      widget.apiKey,
      widget.apiKeyHeader
    );
    
    if (response.error) {
      setError(response.error);
      setData(null);
      console.error(`[Widget ${widget.id}] API Error:`, response.error);
    } else {
      setData(response);
      console.log(`[Widget ${widget.id}] Data fetched:`, response.data);
    }
    
    setLoading(false);
  }, [widget.apiUrl, widget.apiKey, widget.apiKeyHeader, widget.id]);

  useEffect(() => {
    fetchData();
    
    if (widget.refreshInterval > 0) {
      const interval = setInterval(fetchData, widget.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchData, widget.refreshInterval]);

  const getFieldValue = useCallback(
    (field: WidgetField) => {
      if (!data?.data) return null;
      return getNestedValue(data.data, field.path);
    },
    [data]
  );

  return {
    data: data?.data,
    loading,
    error,
    lastUpdated: data?.timestamp,
    refresh: fetchData,
    getFieldValue,
  };
}

