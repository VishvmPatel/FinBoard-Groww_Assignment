'use client';

import { ReactNode } from 'react';
import { X, Settings, RefreshCw } from 'lucide-react';
import { WidgetConfig } from '@/types';
import { formatTime } from '@/utils/helpers';

interface WidgetContainerProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onRefresh: () => void;
  onSettings?: (id: string) => void;
  children: ReactNode;
  loading?: boolean;
  lastUpdated?: number;
}

export default function WidgetContainer({
  widget,
  onRemove,
  onRefresh,
  onSettings,
  children,
  loading,
  lastUpdated,
}: WidgetContainerProps) {

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRemove(widget.id);
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRefresh();
  };

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 drag-handle cursor-move flex-1">
          <h3 className="text-dark-text font-semibold text-lg">{widget.name}</h3>
          <span className="text-xs text-dark-muted bg-dark-bg px-2 py-1 rounded">
            {widget.refreshInterval}s
          </span>
        </div>
        <div className="flex items-center gap-2" style={{ zIndex: 10 }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-dark-bg rounded transition-colors disabled:opacity-50"
            title="Refresh"
            type="button"
          >
            <RefreshCw className={`w-4 h-4 text-dark-muted ${loading ? 'animate-spin' : ''}`} />
          </button>
          {onSettings && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettings(widget.id);
              }}
              className="p-1.5 hover:bg-dark-bg rounded transition-colors"
              title="Settings"
              type="button"
            >
              <Settings className="w-4 h-4 text-dark-muted" />
            </button>
          )}
          <button
            onClick={handleRemove}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
            title="Remove"
            type="button"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Footer */}
      {lastUpdated && (
        <div className="mt-4 pt-4 border-t border-dark-border text-xs text-dark-muted text-center">
          Last updated: {formatTime(lastUpdated)}
        </div>
      )}
    </div>
  );
}

