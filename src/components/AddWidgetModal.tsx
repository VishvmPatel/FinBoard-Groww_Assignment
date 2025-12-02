'use client';

import { useState, useEffect } from 'react';
import { X, TestTube } from 'lucide-react';
import { WidgetConfig, WidgetField, DisplayMode, FieldMapping } from '@/types';
import { fetchApiData, extractFieldsFromJson } from '@/utils/api';
import JSONFieldSelector from './JSONFieldSelector';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (widget: Omit<WidgetConfig, 'id' | 'createdAt' | 'lastUpdated'>) => void;
}

export default function AddWidgetModal({ isOpen, onClose, onAdd }: AddWidgetModalProps) {
  const [widgetName, setWidgetName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('x-api-key');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [selectedFields, setSelectedFields] = useState<WidgetField[]>([]);
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setWidgetName('');
      setApiUrl('');
      setApiKey('');
      setApiKeyHeader('x-api-key');
      setRefreshInterval(30);
      setDisplayMode('card');
      setSelectedFields([]);
      setFields([]);
      setTestResult(null);
      setShowArraysOnly(false);
    }
  }, [isOpen]);

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      setTestResult({ success: false, message: 'Please enter an API URL' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Use API key from input field, or extract from URL if not provided
      const keyToUse = apiKey.trim() || extractApiKeyFromUrl(apiUrl);
      const headerToUse = apiKeyHeader.trim() || 'x-api-key';
      
      const response = await fetchApiData(
        apiUrl,
        keyToUse || undefined,
        headerToUse || undefined
      );
      
      if (response.error) {
        setTestResult({ success: false, message: response.error });
        setFields([]);
      } else {
        const extractedFields = extractFieldsFromJson(response.data, '', showArraysOnly);
        setTestResult({
          success: true,
          message: `API connection successful! ${extractedFields.length} top-level fields found.`,
        });
        setFields(extractedFields);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
      setFields([]);
    } finally {
      setTesting(false);
    }
  };

  // Helper function to extract API key from URL if present
  const extractApiKeyFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      // Try common API key parameter names
      return params.get('apikey') || params.get('api_key') || params.get('token') || params.get('key') || null;
    } catch {
      return null;
    }
  };

  const handleAdd = () => {
    if (!widgetName.trim() || !apiUrl.trim()) {
      setTestResult({ success: false, message: 'Please fill in all required fields' });
      return;
    }

    if (selectedFields.length === 0) {
      setTestResult({ success: false, message: 'Please select at least one field to display' });
      return;
    }

    // Extract API key from URL if not provided in field
    const keyToUse = apiKey.trim() || extractApiKeyFromUrl(apiUrl);
    const headerToUse = apiKeyHeader.trim() || 'x-api-key';

    onAdd({
      name: widgetName,
      apiUrl,
      apiKey: keyToUse || undefined,
      apiKeyHeader: keyToUse ? headerToUse : undefined,
      refreshInterval,
      displayMode,
      selectedFields,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg border border-dark-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-border">
          <h2 className="text-xl font-semibold text-dark-text">Add New Widget</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-bg rounded transition-colors"
          >
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Widget Name */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Widget Name
            </label>
            <input
              type="text"
              value={widgetName}
              onChange={(e) => setWidgetName(e.target.value)}
              placeholder="e.g., Bitcoin Price Tracker"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary"
            />
          </div>

          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              API URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="e.g., https://stock.indianapi.in/stock?name=RELIANCE"
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleTest}
                disabled={testing || !apiUrl.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                Test
              </button>
            </div>
            {testResult && (
              <p
                className={`mt-2 text-sm ${
                  testResult.success ? 'text-primary' : 'text-red-400'
                }`}
              >
                {testResult.message}
              </p>
            )}
          </div>

          {/* API Key (for header-based authentication) */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              API Key (Optional - for header-based auth)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g., sk-live-..."
                className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                value={apiKeyHeader}
                onChange={(e) => setApiKeyHeader(e.target.value)}
                placeholder="Header name (default: x-api-key)"
                className="w-40 px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary"
              />
            </div>
            <p className="mt-1 text-xs text-dark-muted">
              Leave empty if API key is in URL. For Indian Stock API, enter your API key here and use header name "x-api-key"
            </p>
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Math.max(0, parseInt(e.target.value) || 0))}
              min="0"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text focus:outline-none focus:border-primary"
            />
          </div>

          {/* Field Selector */}
          {fields.length > 0 && (
            <JSONFieldSelector
              fields={fields}
              selectedFields={selectedFields}
              onFieldsChange={setSelectedFields}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
              showArraysOnly={showArraysOnly}
              onShowArraysOnlyChange={setShowArraysOnly}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-bg hover:bg-dark-border text-dark-text rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!widgetName.trim() || !apiUrl.trim() || selectedFields.length === 0}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Widget
          </button>
        </div>
      </div>
    </div>
  );
}

