'use client';

import { useState, useMemo } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { FieldMapping, WidgetField, DisplayMode } from '@/types';

interface JSONFieldSelectorProps {
  fields: FieldMapping[];
  selectedFields: WidgetField[];
  onFieldsChange: (fields: WidgetField[]) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  showArraysOnly: boolean;
  onShowArraysOnlyChange: (show: boolean) => void;
}

export default function JSONFieldSelector({
  fields,
  selectedFields,
  onFieldsChange,
  displayMode,
  onDisplayModeChange,
  showArraysOnly,
  onShowArraysOnlyChange,
}: JSONFieldSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFields = useMemo(() => {
    if (!searchQuery) return fields;
    
    const query = searchQuery.toLowerCase();
    const filterFields = (fieldList: FieldMapping[]): FieldMapping[] => {
      return fieldList
        .map((field) => {
          const matches = field.path.toLowerCase().includes(query);
          const filteredChildren = field.children ? filterFields(field.children) : undefined;
          
          if (matches || (filteredChildren && filteredChildren.length > 0)) {
            return {
              ...field,
              children: filteredChildren,
            };
          }
          return null;
        })
        .filter((f): f is FieldMapping => f !== null);
    };
    
    return filterFields(fields);
  }, [fields, searchQuery]);

  const addField = (field: FieldMapping) => {
    if (selectedFields.some((f) => f.path === field.path)) return;
    
    const newField: WidgetField = {
      path: field.path,
      displayName: field.path.split('.').pop() || field.path,
      type: field.type as any,
    };
    
    onFieldsChange([...selectedFields, newField]);
  };

  const removeField = (path: string) => {
    onFieldsChange(selectedFields.filter((f) => f.path !== path));
  };

  const renderField = (field: FieldMapping, level = 0) => (
    <div key={field.path} className="mb-1">
      <div className="flex items-center justify-between p-2 hover:bg-dark-bg rounded group">
        <div className="flex-1 min-w-0">
          <div className="text-sm text-dark-text font-mono truncate" style={{ paddingLeft: `${level * 12}px` }}>
            {field.path}
          </div>
          <div className="text-xs text-dark-muted mt-0.5">
            {field.type} {field.value && `| ${String(field.value).substring(0, 50)}`}
          </div>
        </div>
        {!selectedFields.some((f) => f.path === field.path) && (
          <button
            onClick={() => addField(field)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/20 rounded transition-opacity"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        )}
      </div>
      {field.children && field.children.length > 0 && (
        <div className="ml-4">
          {field.children.map((child) => renderField(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Display Mode */}
      <div>
        <label className="block text-sm font-medium text-dark-text mb-2">Display Mode</label>
        <div className="flex gap-2">
          {(['card', 'table', 'chart'] as DisplayMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onDisplayModeChange(mode)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                displayMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-dark-bg text-dark-muted hover:text-dark-text'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-dark-text mb-2">Search Fields</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for fields..."
            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded text-dark-text placeholder-dark-muted focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Show Arrays Only */}
      {displayMode === 'table' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showArraysOnly"
            checked={showArraysOnly}
            onChange={(e) => onShowArraysOnlyChange(e.target.checked)}
            className="w-4 h-4 text-primary bg-dark-bg border-dark-border rounded focus:ring-primary"
          />
          <label htmlFor="showArraysOnly" className="text-sm text-dark-text">
            Show arrays only (for table view)
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Available Fields */}
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">Available Fields</label>
          <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-96 overflow-y-auto">
            {filteredFields.length === 0 ? (
              <p className="text-sm text-dark-muted text-center py-4">No fields found</p>
            ) : (
              filteredFields.map((field) => renderField(field))
            )}
          </div>
        </div>

        {/* Selected Fields */}
        <div>
          <label className="block text-sm font-medium text-dark-text mb-2">Selected Fields</label>
          <div className="bg-dark-bg border border-dark-border rounded p-3 max-h-96 overflow-y-auto">
            {selectedFields.length === 0 ? (
              <p className="text-sm text-dark-muted text-center py-4">No fields selected</p>
            ) : (
              selectedFields.map((field) => (
                <div
                  key={field.path}
                  className="flex items-center justify-between p-2 hover:bg-dark-card rounded group mb-1"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-dark-text font-mono truncate">{field.path}</div>
                    {field.displayName && field.displayName !== field.path && (
                      <div className="text-xs text-dark-muted">{field.displayName}</div>
                    )}
                  </div>
                  <button
                    onClick={() => removeField(field.path)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


