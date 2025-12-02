import { ApiResponse, FieldMapping } from '@/types';

export async function fetchApiData(url: string, apiKey?: string, apiKeyHeader?: string): Promise<ApiResponse> {
  try {
    // Build headers object
    const headers: Record<string, string> = {};
    
    // Add API key to header if provided (for APIs like Indian Stock API that require x-api-key header)
    if (apiKey && apiKeyHeader) {
      headers[apiKeyHeader] = apiKey;
    }
    
    // For GET requests, don't send Content-Type header to avoid CORS issues
    // Many APIs (like Finnhub) don't allow custom headers in CORS preflight
    const response = await fetch(url, {
      method: 'GET',
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      // Removed Content-Type header to fix CORS issues with Finnhub and other APIs
      // GET requests don't need Content-Type header
    });

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        // Extract error message from various possible formats
        errorMessage = 
          errorData.error || 
          errorData.message || 
          errorData['Error Message'] || 
          errorData.error_message ||
          errorData.msg ||
          (typeof errorData === 'string' ? errorData : errorMessage);
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Handle specific error cases
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error('Invalid API key or unauthorized access.');
      }
      if (response.status === 400) {
        throw new Error(`Bad Request: ${errorMessage}. Check your API parameters (symbol format, parameter names, etc.).`);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Check for API-specific error responses
    if (data.error || data['Error Message']) {
      throw new Error(data.error || data['Error Message'] || 'API returned an error');
    }
    
    return {
      data,
      timestamp: Date.now(),
    };
  } catch (error) {
    // Handle CORS errors specifically
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        data: null,
        error: 'CORS error: Unable to fetch data. The API may not allow requests from this origin.',
        timestamp: Date.now(),
      };
    }
    
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: Date.now(),
    };
  }
}

export function extractFieldsFromJson(
  obj: any,
  prefix = '',
  showArraysOnly = false
): FieldMapping[] {
  const fields: FieldMapping[] = [];

  if (obj === null || obj === undefined) {
    return fields;
  }

  if (Array.isArray(obj)) {
    if (!showArraysOnly) {
      fields.push({
        path: prefix || 'root',
        value: `Array(${obj.length} items)`,
        type: 'array',
      });
    }
    
    if (obj.length > 0) {
      const firstItem = obj[0];
      if (typeof firstItem === 'object' && firstItem !== null) {
        const nestedFields = extractFieldsFromJson(firstItem, `${prefix}[0]`, showArraysOnly);
        fields.push(...nestedFields);
      }
    }
    return fields;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (value === null || value === undefined) {
        fields.push({
          path: currentPath,
          value: String(value),
          type: typeof value,
        });
      } else if (Array.isArray(value)) {
        fields.push({
          path: currentPath,
          value: `Array(${value.length} items)`,
          type: 'array',
          children: value.length > 0 && typeof value[0] === 'object'
            ? extractFieldsFromJson(value[0], `${currentPath}[0]`, showArraysOnly)
            : undefined,
        });
      } else if (typeof value === 'object') {
        fields.push({
          path: currentPath,
          value: 'Object',
          type: 'object',
          children: extractFieldsFromJson(value, currentPath, showArraysOnly),
        });
      } else {
        fields.push({
          path: currentPath,
          value: String(value),
          type: typeof value,
        });
      }
    }
  } else {
    fields.push({
      path: prefix || 'root',
      value: String(obj),
      type: typeof obj,
    });
  }

  return fields;
}

export function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (key.includes('[')) {
      const [arrayKey, indexStr] = key.split('[');
      const index = parseInt(indexStr.replace(']', ''), 10);
      if (current && typeof current === 'object' && arrayKey in current) {
        current = current[arrayKey];
        if (Array.isArray(current) && current[index] !== undefined) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    } else {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
  }

  return current;
}

