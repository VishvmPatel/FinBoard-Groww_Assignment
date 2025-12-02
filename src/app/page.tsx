'use client';

import { useState, useEffect } from 'react';
import { Plus, BarChart3 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { addWidget, removeWidget, updateWidget, updateWidgetLayout } from '@/store/slices/widgetsSlice';
import { WidgetConfig } from '@/types';
import { useLocalStoragePersistence } from '@/hooks/useLocalStorage';
import { generateWidgetId } from '@/utils/helpers';
import { loadLayoutFromStorage } from '@/utils/persistence';
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
  
  // Initialize localStorage persistence
  useLocalStoragePersistence();

  // Load and restore layout on mount
  useEffect(() => {
    const savedLayout = loadLayoutFromStorage();
    if (Object.keys(savedLayout).length > 0) {
      // Restore layout for each widget
      Object.entries(savedLayout).forEach(([id, layout]) => {
        const widget = widgets.find((w) => w.id === id);
        if (widget) {
          dispatch(updateWidgetLayout({ id, layout }));
        }
      });
    }
  }, [dispatch]); // Only run once on mount

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

  const handleLayoutChange = (layout: any[]) => {
    const layoutMap: Record<string, { x: number; y: number; w: number; h: number }> = {};
    
    layout.forEach((item) => {
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
    
    // Save layout to localStorage
    import('@/utils/persistence').then(({ saveLayoutToStorage }) => {
      saveLayoutToStorage(layoutMap);
    });
  };

  const layouts = {
    lg: widgets.map((widget) => ({
      i: widget.id,
      x: widget.layout?.x || 0,
      y: widget.layout?.y || 0,
      w: widget.layout?.w || 6,
      h: widget.layout?.h || 4,
    })),
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-dark-text">Finance Dashboard</h1>
            </div>
            <p className="text-sm text-dark-muted mt-1">
              {widgets.length} active widget{widgets.length !== 1 ? 's' : ''} • Real-time data
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Widget
          </button>
        </div>
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
  const { loading, error, lastUpdated, refresh } = useWidgetData(widget);

  return (
    <WidgetContainer
      widget={widget}
      onRemove={onRemove}
      onRefresh={refresh}
      onSettings={onEdit}
      loading={loading}
      lastUpdated={lastUpdated}
    >
      <WidgetRenderer widget={widget} />
    </WidgetContainer>
  );
}

