'use client';

import { useState, useEffect } from 'react';
import { X, TestTube, Sparkles } from 'lucide-react';
import { WidgetConfig, WidgetField, DisplayMode, FieldMapping, ChartType, TimeInterval } from '@/types';
import { fetchApiData, extractFieldsFromJson } from '@/utils/api';
import JSONFieldSelector from './JSONFieldSelector';
import { WIDGET_TEMPLATES, WidgetTemplate, getTemplatesByCategory, getTemplateCategories } from '@/types/templates';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (widget: Omit<WidgetConfig, 'id' | 'createdAt' | 'lastUpdated'>) => void;
}

export default function AddWidgetModal({ isOpen, onClose, onAdd }: AddWidgetModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [widgetName, setWidgetName] = useState('');
  const [widgetDescription, setWidgetDescription] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('x-api-key');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [cacheTTL, setCacheTTL] = useState(30);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('card');
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('daily');
  const [selectedFields, setSelectedFields] = useState<WidgetField[]>([]);
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  
  const [fields, setFields] = useState<FieldMapping[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== 'custom') {
      const template = WIDGET_TEMPLATES.find((t) => t.id === selectedTemplate);
      if (template) {
        setWidgetName(template.name);
        setWidgetDescription(template.description || '');
        setDisplayMode(template.displayMode);
        if (template.chartType) setChartType(template.chartType);
        if (template.timeInterval) setTimeInterval(template.timeInterval);
        if (template.defaultFields.length > 0) {
          setSelectedFields([...template.defaultFields]);
        }
        if (template.defaultApiUrl) {
          setApiUrl(template.defaultApiUrl);
        }
        if (template.defaultApiKeyHeader) {
          setApiKeyHeader(template.defaultApiKeyHeader);
        }
        if (template.refreshInterval) {
          setRefreshInterval(template.refreshInterval);
        }
      }
      } else if (selectedTemplate === 'custom') {
        // Reset to defaults for custom template
        setWidgetName('');
        setWidgetDescription('');
        setApiUrl('');
      setDisplayMode('card');
      setChartType('line');
      setTimeInterval('daily');
      setSelectedFields([]);
      setRefreshInterval(30);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setSelectedTemplate('custom');
      setShowTemplateSelector(true);
      setWidgetName('');
      setWidgetDescription('');
      setApiUrl('');
      setApiKey('');
      setApiKeyHeader('x-api-key');
      setRefreshInterval(30);
      setCacheTTL(30);
      setDisplayMode('card');
      setChartType('line');
      setTimeInterval('daily');
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
      // For APIs that use query parameters for auth (like Finnhub with 'token' param),
      // don't extract or add as header. Only use header-based auth if explicitly provided.
      let keyToUse: string | undefined = undefined;
      let headerToUse: string | undefined = undefined;
      
      // Only use header-based auth if both apiKey and apiKeyHeader are explicitly provided
      // Don't extract from URL for APIs that use query params (like Finnhub)
      if (apiKey.trim() && apiKeyHeader.trim()) {
        keyToUse = apiKey.trim();
        headerToUse = apiKeyHeader.trim();
      }
      // If only apiKey is provided but no header, don't use header auth
      // (the API might use query params or the key might already be in the URL)
      
      // Try direct request first (many APIs work fine with browser requests)
      // fetchApiData will automatically fall back to proxy if CORS fails
      const response = await fetchApiData(
        apiUrl,
        keyToUse,
        headerToUse,
        0, // retryCount
        3, // maxRetries
        false // Don't force proxy - try direct first, fallback to proxy on CORS
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

    // Only use header-based auth if both apiKey and apiKeyHeader are explicitly provided
    // Don't extract from URL - many APIs (like Finnhub) use query params for auth
    const keyToUse = apiKey.trim() && apiKeyHeader.trim() ? apiKey.trim() : undefined;
    const headerToUse = apiKey.trim() && apiKeyHeader.trim() ? apiKeyHeader.trim() : undefined;

    onAdd({
      name: widgetName,
      description: widgetDescription.trim() || undefined,
      apiUrl,
      apiKey: keyToUse || undefined,
      apiKeyHeader: keyToUse ? headerToUse : undefined,
      refreshInterval,
      cacheTTL,
      displayMode,
      chartType: displayMode === 'chart' ? chartType : undefined,
      timeInterval: displayMode === 'chart' ? timeInterval : undefined,
      selectedFields,
    });

    onClose();
  };

  if (!isOpen) return null;

  const currentTemplate = WIDGET_TEMPLATES.find((t) => t.id === selectedTemplate);
  const templateCategories = getTemplateCategories();

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
          {/* Template Selector */}
          {showTemplateSelector && (
            <div className="p-4 bg-dark-bg border border-dark-border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-medium text-dark-text">Choose a Template</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="ml-auto text-xs text-dark-muted hover:text-dark-text"
                >
                  Skip
                </button>
              </div>
              <p className="text-sm text-dark-muted mb-4">
                Start with a pre-configured template or create a custom widget from scratch.
              </p>
              
              {/* Category Tabs */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-dark-border pb-3">
                <button
                  onClick={() => setSelectedTemplate('custom')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    selectedTemplate === 'custom'
                      ? 'bg-primary text-white'
                      : 'bg-dark-card text-dark-muted hover:text-dark-text'
                  }`}
                >
                  Custom
                </button>
                {templateCategories.map((category) => {
                  const categoryTemplates = getTemplatesByCategory(category);
                  if (categoryTemplates.length === 0) return null;
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        // Select first template of this category
                        setSelectedTemplate(categoryTemplates[0].id);
                      }}
                      className={`px-3 py-1.5 text-sm rounded transition-colors capitalize ${
                        categoryTemplates.some((t) => t.id === selectedTemplate)
                          ? 'bg-primary text-white'
                          : 'bg-dark-card text-dark-muted hover:text-dark-text'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {WIDGET_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 text-left border rounded-lg transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/10'
                        : 'border-dark-border bg-dark-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-dark-text text-sm">{template.name}</h4>
                      {selectedTemplate === template.id && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-dark-muted line-clamp-2">{template.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-dark-muted">
                      <span className="capitalize">{template.displayMode}</span>
                      {template.chartType && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{template.chartType}</span>
                        </>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Template Instructions */}
              {currentTemplate && currentTemplate.instructions && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                  <p className="text-xs text-yellow-400 font-medium mb-2">📝 Setup Instructions</p>
                  <div className="text-xs text-dark-muted whitespace-pre-line space-y-1">
                    {currentTemplate.instructions.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                  {currentTemplate.apiProvider && (
                    <p className="text-xs text-dark-muted mt-2 pt-2 border-t border-yellow-500/20">
                      <span className="font-medium">Example API:</span> {currentTemplate.apiProvider}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Show Template Info if template is selected */}
          {!showTemplateSelector && selectedTemplate !== 'custom' && currentTemplate && (
            <div className="p-3 bg-dark-bg border border-dark-border rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-dark-text">
                  Using template: <span className="font-medium">{currentTemplate.name}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  setShowTemplateSelector(true);
                  setSelectedTemplate('custom');
                }}
                className="text-xs text-dark-muted hover:text-dark-text"
              >
                Change Template
              </button>
            </div>
          )}
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

          {/* Widget Description */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Description (Optional)
            </label>
            <textarea
              value={widgetDescription}
              onChange={(e) => setWidgetDescription(e.target.value)}
              placeholder="e.g., Tracks real-time Bitcoin price from CoinGecko API"
              rows={3}
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary resize-none"
            />
            <p className="mt-1 text-xs text-dark-muted">
              Add a description to help identify this widget's purpose
            </p>
          </div>

          {/* API URL */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              API URL
              {selectedTemplate !== 'custom' && currentTemplate?.defaultApiUrl && (
                <span className="ml-2 text-xs text-yellow-400 font-normal">
                  (Example URL - customize with your own API)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="e.g., https://api.example.com/endpoint?param=value"
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
            {selectedTemplate !== 'custom' && currentTemplate?.defaultApiUrl && (
              <p className="mt-1 text-xs text-yellow-400">
                ⚠️ The URL above is an example. You must replace it with your own API endpoint and credentials.
              </p>
            )}
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
              Leave empty if API key is in URL. For APIs requiring header-based auth (e.g., x-api-key), enter your API key here
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
            <p className="mt-1 text-xs text-dark-muted">
              How often to automatically refresh data (0 = disabled)
            </p>
          </div>

          {/* Cache TTL */}
          <div>
            <label className="block text-sm font-medium text-dark-text mb-2">
              Cache Duration (seconds)
            </label>
            <input
              type="number"
              value={cacheTTL}
              onChange={(e) => setCacheTTL(Math.max(0, parseInt(e.target.value) || 30))}
              min="0"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text focus:outline-none focus:border-primary"
            />
            <p className="mt-1 text-xs text-dark-muted">
              How long to cache API responses (0 = disabled, default: 30s). Reduces redundant API calls.
            </p>
          </div>

          {/* Chart Type Selector (only for chart mode) */}
          {displayMode === 'chart' && (
            <>
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Chart Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      chartType === 'line'
                        ? 'bg-primary text-white'
                        : 'bg-dark-bg text-dark-muted hover:text-dark-text'
                    }`}
                  >
                    Line Chart
                  </button>
                  <button
                    onClick={() => setChartType('candlestick')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      chartType === 'candlestick'
                        ? 'bg-primary text-white'
                        : 'bg-dark-bg text-dark-muted hover:text-dark-text'
                    }`}
                  >
                    Candlestick Chart
                  </button>
                </div>
                {chartType === 'candlestick' && (
                  <p className="mt-2 text-xs text-dark-muted">
                    Note: Candlestick charts require Open, High, Low, and Close fields. Select fields with these names.
                  </p>
                )}
              </div>

              {/* Time Interval Selector */}
              <div>
                <label className="block text-sm font-medium text-dark-text mb-2">
                  Time Interval
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['daily', 'weekly', 'monthly'] as TimeInterval[]).map((interval) => (
                    <button
                      key={interval}
                      onClick={() => setTimeInterval(interval)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        timeInterval === interval
                          ? 'bg-primary text-white'
                          : 'bg-dark-bg text-dark-muted hover:text-dark-text'
                      }`}
                    >
                      {interval.charAt(0).toUpperCase() + interval.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-dark-muted">
                  Note: The time interval is stored for reference. You may need to adjust your API URL parameters to match the selected interval.
                </p>
              </div>
            </>
          )}

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

