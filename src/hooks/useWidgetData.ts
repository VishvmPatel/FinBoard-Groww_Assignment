import { useEffect, useState, useCallback } from 'react';
import { fetchApiData, getNestedValue } from '@/utils/api';
import { WidgetConfig, ApiResponse, WidgetField } from '@/types';
import { addTimeIntervalToUrl } from '@/utils/apiUrlBuilder';

export function useWidgetData(widget: WidgetConfig) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const fetchData = useCallback(async (bypassCache = false) => {
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
    setFromCache(false);
    setCacheAge(null);
    
    // Build the API URL with time interval if chart mode is selected
    let apiUrl = widget.apiUrl;
    if (widget.displayMode === 'chart' && widget.timeInterval) {
      apiUrl = addTimeIntervalToUrl(widget.apiUrl, widget.timeInterval);
    }
    
    // Check if URL already has authentication in query params (like token=, apikey=, etc.)
    // If so, don't use header-based auth to avoid CORS issues
    const urlHasAuth = apiUrl.includes('token=') || 
                      apiUrl.includes('apikey=') || 
                      apiUrl.includes('api_key=') || 
                      apiUrl.includes('key=');
    
    // Only use header-based auth if:
    // 1. Both apiKey and apiKeyHeader are provided AND non-empty
    // 2. URL doesn't already have auth in query params
    const keyToUse = !urlHasAuth && widget.apiKey?.trim() && widget.apiKeyHeader?.trim() 
      ? widget.apiKey.trim() 
      : undefined;
    const headerToUse = !urlHasAuth && widget.apiKey?.trim() && widget.apiKeyHeader?.trim() 
      ? widget.apiKeyHeader.trim() 
      : undefined;
    
    // Get cache TTL from widget config (default: 30 seconds)
    const cacheTTL = widget.cacheTTL ?? 30;
    
    // Try direct request first (many APIs work fine with browser requests)
    // fetchApiData will automatically fall back to proxy if CORS fails
    const response = await fetchApiData(
      apiUrl,
      keyToUse,
      headerToUse,
      0, // retryCount
      3, // maxRetries
      false, // Don't force proxy - try direct first, fallback to proxy on CORS
      cacheTTL, // Cache TTL
      bypassCache // Bypass cache for manual refresh
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
      setFromCache(response.fromCache || false);
      setCacheAge(response.cacheAge || null);
      console.log(`[Widget ${widget.id}] Data fetched${response.fromCache ? ' (from cache)' : ''}:`, response.data);
    }
    
    setLoading(false);
  }, [widget.apiUrl, widget.apiKey, widget.apiKeyHeader, widget.id, widget.displayMode, widget.timeInterval, widget.cacheTTL, isRateLimited, rateLimitResetTime]);

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
    refresh: () => fetchData(true), // Manual refresh bypasses cache
    getFieldValue,
    fromCache,
    cacheAge,
  };
}

