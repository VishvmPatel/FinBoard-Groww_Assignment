import { useEffect, useState, useCallback } from 'react';
import { fetchApiData, getNestedValue } from '@/utils/api';
import { WidgetConfig, ApiResponse, WidgetField } from '@/types';

export function useWidgetData(widget: WidgetConfig) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    // Don't fetch if rate limited
    if (isRateLimited && rateLimitResetTime) {
      const now = Date.now();
      if (now < rateLimitResetTime) {
        const waitSeconds = Math.ceil((rateLimitResetTime - now) / 1000);
        setError(`Rate limit exceeded. Auto-refresh paused. Please wait ${waitSeconds} seconds.`);
        return;
      } else {
        // Rate limit expired, reset
        setIsRateLimited(false);
        setRateLimitResetTime(null);
      }
    }

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
      
      // Check if it's a rate limit error
      if (response.error.includes('Rate limit') || response.error.includes('rate limit')) {
        setIsRateLimited(true);
        // Extract wait time from error message or set default
        const waitMatch = response.error.match(/(\d+)\s*seconds/);
        if (waitMatch) {
          const waitSeconds = parseInt(waitMatch[1]);
          setRateLimitResetTime(Date.now() + (waitSeconds * 1000));
        } else {
          // Default to 60 seconds if not specified
          setRateLimitResetTime(Date.now() + 60000);
        }
      }
    } else {
      setData(response);
      setIsRateLimited(false);
      setRateLimitResetTime(null);
      console.log(`[Widget ${widget.id}] Data fetched:`, response.data);
    }
    
    setLoading(false);
  }, [widget.apiUrl, widget.apiKey, widget.apiKeyHeader, widget.id, isRateLimited, rateLimitResetTime]);

  useEffect(() => {
    fetchData();
    
    // Only set up auto-refresh if not rate limited
    if (widget.refreshInterval > 0 && !isRateLimited) {
      const interval = setInterval(() => {
        // Check if still rate limited before fetching
        if (rateLimitResetTime && Date.now() < rateLimitResetTime) {
          return; // Skip this refresh
        }
        fetchData();
      }, widget.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchData, widget.refreshInterval, isRateLimited, rateLimitResetTime]);

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

