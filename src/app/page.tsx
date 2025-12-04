'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart3, Download, Upload } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addWidget, removeWidget, updateWidget, updateWidgetLayout, setWidgets } from '@/store/slices/widgetsSlice';
import { WidgetConfig } from '@/types';
import { useLocalStoragePersistence } from '@/hooks/useLocalStorage';
import { generateWidgetId } from '@/utils/helpers';
import {
  loadLayoutFromStorage,
  loadResponsiveLayoutsFromStorage,
  saveResponsiveLayoutsToStorage,
  convertLayoutsToStorageFormat,
  convertStorageFormatToLayouts,
  exportDashboardConfig,
  importDashboardConfig,
  type BreakpointLayouts,
  type ImportValidationResult,
} from '@/utils/persistence';
import AddWidgetModal from '@/components/AddWidgetModal';
import EditWidgetModal from '@/components/EditWidgetModal';
import WidgetContainer from '@/components/WidgetContainer';
import WidgetRenderer from '@/components/widgets';
import { useWidgetData } from '@/hooks/useWidgetData';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Initialize localStorage persistence
  useLocalStoragePersistence();

  // Load and restore responsive layouts on mount
  useEffect(() => {
    const savedResponsiveLayouts = loadResponsiveLayoutsFromStorage();
    
    if (Object.keys(savedResponsiveLayouts).length > 0) {
      // We have responsive layouts saved - they will be used when generating layouts
      console.log('[Dashboard] Loaded responsive layouts for breakpoints:', Object.keys(savedResponsiveLayouts));
    } else {
      // Fallback to legacy single layout format for backward compatibility
      const savedLayout = loadLayoutFromStorage();
      if (Object.keys(savedLayout).length > 0) {
        // Migrate legacy layout to responsive format (apply to lg breakpoint)
        const migratedLayouts: BreakpointLayouts = {
          lg: savedLayout,
        };
        saveResponsiveLayoutsToStorage(migratedLayouts);
        console.log('[Dashboard] Migrated legacy layout to responsive format');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleAddWidget = (widgetConfig: Omit<WidgetConfig, 'id' | 'createdAt' | 'lastUpdated'>) => {
    const newWidget: WidgetConfig = {
      ...widgetConfig,
      id: generateWidgetId(),
      createdAt: Date.now(),
      layout: {
        x: (widgets.length * 2) % 12,
        y: Math.floor((widgets.length * 2) / 12) * 4,
        w: 6,
        h: 4,
      },
    };
    dispatch(addWidget(newWidget));
  };

  const handleRemoveWidget = (id: string) => {
    console.log('Removing widget:', id);
    console.log('Current widgets:', widgets.map(w => w.id));
    dispatch(removeWidget(id));
  };

  const handleEditWidget = (id: string) => {
    const widget = widgets.find((w) => w.id === id);
    if (widget) {
      setEditingWidget(widget);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveWidget = (id: string, updates: Partial<WidgetConfig>) => {
    dispatch(updateWidget({ id, config: updates }));
    setIsEditModalOpen(false);
    setEditingWidget(null);
  };

  const handleExport = () => {
    const configJson = exportDashboardConfig(widgets);
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finboard-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          const importResult: ImportValidationResult = importDashboardConfig(jsonString);
          
          if (!importResult.valid || !importResult.widgets || importResult.widgets.length === 0) {
            // Build detailed error message
            const errorMessages = importResult.errors.length > 0
              ? importResult.errors.join('\n')
              : 'Invalid dashboard configuration file. No valid widgets found.';
            setImportError(errorMessages);
            setImportSuccess(false);
            return;
          }

          // Replace current widgets with imported ones
          dispatch(setWidgets(importResult.widgets));
          
          // Restore layouts if present and valid
          if (importResult.layouts && Object.keys(importResult.layouts).length > 0) {
            // Filter out invalid layouts (widgets that don't exist)
            const widgetIds = importResult.widgets.map((w) => w.id);
            const validLayouts: BreakpointLayouts = {};
            
            const breakpoints: Array<keyof BreakpointLayouts> = ['lg', 'md', 'sm', 'xs', 'xxs'];
            for (const breakpoint of breakpoints) {
              if (importResult.layouts[breakpoint]) {
                const layout = importResult.layouts[breakpoint]!;
                const validLayout: Record<string, { x: number; y: number; w: number; h: number }> = {};
                
                for (const [widgetId, layoutData] of Object.entries(layout)) {
                  if (widgetIds.includes(widgetId)) {
                    // Validate coordinates one more time
                    const { x, y, w, h } = layoutData;
                    if (
                      typeof x === 'number' && x >= 0 &&
                      typeof y === 'number' && y >= 0 &&
                      typeof w === 'number' && w > 0 &&
                      typeof h === 'number' && h > 0
                    ) {
                      validLayout[widgetId] = layoutData;
                    }
                  }
                }
                
                if (Object.keys(validLayout).length > 0) {
                  validLayouts[breakpoint] = validLayout;
                }
              }
            }
            
            // Save valid layouts to storage
            if (Object.keys(validLayouts).length > 0) {
              saveResponsiveLayoutsToStorage(validLayouts);
              console.log('[Dashboard] Restored responsive layouts from import:', Object.keys(validLayouts));
            }
          }
          
          // Build success/warning message
          const messages: string[] = [];
          if (importResult.warnings.length > 0) {
            messages.push(...importResult.warnings);
          }
          messages.push(`Successfully imported ${importResult.widgets.length} widget(s).`);
          
          // Show warnings if any
          if (importResult.warnings.length > 0) {
            console.warn('[Dashboard] Import warnings:', importResult.warnings);
          }
          
          setImportSuccess(true);
          setImportError(null);
          
          // Clear success message after 5 seconds (longer if there are warnings)
          setTimeout(() => setImportSuccess(false), importResult.warnings.length > 0 ? 5000 : 3000);
        } catch (error) {
          setImportError('Error reading file: ' + (error instanceof Error ? error.message : 'Unknown error'));
          setImportSuccess(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLayoutChange =       (
        currentLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>,
        allLayouts: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>
      ) => {
    // Update Redux state with current breakpoint layout (for backward compatibility)
    // We'll use the 'lg' layout as the primary one stored in widget config
    const lgLayout = allLayouts.lg || currentLayout;
    const layoutMap: Record<string, { x: number; y: number; w: number; h: number }> = {};
    
    lgLayout.forEach((item) => {
      const layoutData = {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      };
      
      layoutMap[item.i] = layoutData;
      
      dispatch(
        updateWidgetLayout({
          id: item.i,
          layout: layoutData,
        })
      );
    });
    
    // Save all breakpoint layouts to localStorage
    const storageFormat = convertLayoutsToStorageFormat(allLayouts);
    saveResponsiveLayoutsToStorage(storageFormat);
    console.log('[Dashboard] Saved responsive layouts for breakpoints:', Object.keys(allLayouts));
  };

  // Generate layouts for all breakpoints (client-side only)
  const [layouts, setLayouts] = useState<Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>>(() => {
    // Initial empty layout for SSR
    return {
      lg: [],
      md: [],
      sm: [],
      xs: [],
      xxs: [],
    };
  });

  // Generate layouts on client side after mount
  useEffect(() => {
    const generateLayouts = (): Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>> => {
      const savedResponsiveLayouts = loadResponsiveLayoutsFromStorage();
      const widgetIds = widgets.map((w) => w.id);
      
      // If we have saved responsive layouts, use them (with fallback for new widgets)
      if (Object.keys(savedResponsiveLayouts).length > 0) {
        return convertStorageFormatToLayouts(savedResponsiveLayouts, widgetIds);
      }
      
      // Otherwise, generate default layouts for all breakpoints
      const breakpoints: Array<'lg' | 'md' | 'sm' | 'xs' | 'xxs'> = ['lg', 'md', 'sm', 'xs', 'xxs'];
      const generatedLayouts: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>> = {};
      
      breakpoints.forEach((breakpoint) => {
        generatedLayouts[breakpoint] = widgets.map((widget, index) => {
          // Use saved layout if available (from widget.config.layout - legacy format)
          if (widget.layout && breakpoint === 'lg') {
            return {
              i: widget.id,
              x: widget.layout.x,
              y: widget.layout.y,
              w: widget.layout.w,
              h: widget.layout.h,
            };
          }
          
          // Calculate default layout based on breakpoint
          const cols: Record<string, number> = {
            lg: 12,
            md: 10,
            sm: 6,
            xs: 4,
            xxs: 2,
          };
          
          const defaultWidths: Record<string, number> = {
            lg: 6,
            md: 5,
            sm: 6,
            xs: 4,
            xxs: 2,
          };
          
          const colsForBreakpoint = cols[breakpoint] || 12;
          const defaultWidth = defaultWidths[breakpoint] || 6;
          const defaultHeight = 4;
          
          const widgetsPerRow = Math.floor(colsForBreakpoint / defaultWidth);
          const x = (index % widgetsPerRow) * defaultWidth;
          const y = Math.floor(index / widgetsPerRow) * defaultHeight;
          
          return {
            i: widget.id,
            x: Math.min(x, colsForBreakpoint - defaultWidth),
            y,
            w: defaultWidth,
            h: defaultHeight,
          };
        });
      });
      
      return generatedLayouts;
    };

    const generatedLayouts = generateLayouts();
    setLayouts(generatedLayouts);
  }, [widgets]);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-dark-text">FINBOARD</h1>
            </div>
            <p className="text-sm text-dark-muted mt-1">
              {widgets.length} active widget{widgets.length !== 1 ? 's' : ''} • Real-time data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-theme-bg hover:bg-theme-border text-theme-text rounded-lg font-medium transition-colors flex items-center gap-2 border border-theme-border"
              title="Export Dashboard"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-theme-bg hover:bg-theme-border text-theme-text rounded-lg font-medium transition-colors flex items-center gap-2 border border-theme-border"
              title="Import Dashboard"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Widget
            </button>
          </div>
        </div>
        {/* Import Success/Error Messages */}
        {(importSuccess || importError) && (
          <div className={`mt-2 px-4 py-2 rounded text-sm ${
            importSuccess 
              ? 'bg-primary/20 text-primary border border-primary/50' 
              : 'bg-red-500/20 text-red-400 border border-red-500/50'
          }`}>
            {importSuccess ? '✓ Dashboard imported successfully!' : importError}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-6">
              <BarChart3 className="w-24 h-24 text-dark-muted mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-dark-text mb-2">
                Build Your Finance Dashboard
              </h2>
              <p className="text-dark-muted max-w-md">
                Create custom widgets by connecting to any finance API. Track stocks, crypto, forex,
                or economic indicators – all in real-time.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Widget
            </button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetWrapper 
                  widget={widget} 
                  onRemove={handleRemoveWidget}
                  onEdit={handleEditWidget}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}

        {/* Add Widget Placeholder */}
        {widgets.length > 0 && (
          <div
            onClick={() => setIsModalOpen(true)}
            className="mt-8 border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-text mb-2">Add Widget</h3>
            <p className="text-sm text-dark-muted">
              Connect to a finance API and create a custom widget
            </p>
          </div>
        )}
      </main>

      {/* Add Widget Modal */}
      <AddWidgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddWidget}
      />

      {/* Edit Widget Modal */}
      <EditWidgetModal
        isOpen={isEditModalOpen}
        widget={editingWidget}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveWidget}
      />
    </div>
  );
}

// Wrapper component to handle widget data fetching
function WidgetWrapper({
  widget,
  onRemove,
  onEdit,
}: {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const { loading, error, lastUpdated, refresh, fromCache, cacheAge } = useWidgetData(widget);

  return (
    <WidgetContainer
      widget={widget}
      onRemove={onRemove}
      onRefresh={refresh}
      onSettings={onEdit}
      loading={loading}
      lastUpdated={lastUpdated}
      fromCache={fromCache}
      cacheAge={cacheAge}
    >
      <WidgetRenderer widget={widget} />
    </WidgetContainer>
  );
}

