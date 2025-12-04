import { WidgetConfig } from '@/types';

const STORAGE_KEY = 'finboard-widgets';
const LAYOUT_KEY = 'finboard-layout';
const RESPONSIVE_LAYOUT_KEY = 'finboard-responsive-layouts';

// Type for per-breakpoint layouts
export type BreakpointLayouts = {
  lg?: Record<string, { x: number; y: number; w: number; h: number }>;
  md?: Record<string, { x: number; y: number; w: number; h: number }>;
  sm?: Record<string, { x: number; y: number; w: number; h: number }>;
  xs?: Record<string, { x: number; y: number; w: number; h: number }>;
  xxs?: Record<string, { x: number; y: number; w: number; h: number }>;
};

export function saveWidgetsToStorage(widgets: WidgetConfig[]): void {
  try {
    // Always save, even if empty array (to clear storage when all widgets removed)
    const serializable = widgets.map((w) => ({
      ...w,
      createdAt: w.createdAt,
      lastUpdated: w.lastUpdated,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    console.log(`[Persistence] Saved ${widgets.length} widget(s) to localStorage`);
  } catch (error) {
    console.error('Failed to save widgets to storage:', error);
  }
}

export function loadWidgetsFromStorage(): WidgetConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load widgets from storage:', error);
  }
  return [];
}

// Legacy function - kept for backward compatibility
export function saveLayoutToStorage(layout: Record<string, { x: number; y: number; w: number; h: number }>): void {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch (error) {
    console.error('Failed to save layout to storage:', error);
  }
}

// Legacy function - kept for backward compatibility
export function loadLayoutFromStorage(): Record<string, { x: number; y: number; w: number; h: number }> {
  try {
    const stored = localStorage.getItem(LAYOUT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load layout from storage:', error);
  }
  return {};
}

/**
 * Save responsive layouts for all breakpoints
 */
export function saveResponsiveLayoutsToStorage(layouts: BreakpointLayouts): void {
  if (typeof window === 'undefined') {
    return; // Don't try to save during SSR
  }
  
  try {
    localStorage.setItem(RESPONSIVE_LAYOUT_KEY, JSON.stringify(layouts));
    console.log('[Persistence] Saved responsive layouts to storage:', Object.keys(layouts));
  } catch (error) {
    console.error('Failed to save responsive layouts to storage:', error);
  }
}

/**
 * Load responsive layouts for all breakpoints
 */
export function loadResponsiveLayoutsFromStorage(): BreakpointLayouts {
  if (typeof window === 'undefined') {
    return {}; // Return empty object during SSR
  }
  
  try {
    const stored = localStorage.getItem(RESPONSIVE_LAYOUT_KEY);
    if (stored) {
      const layouts = JSON.parse(stored);
      console.log('[Persistence] Loaded responsive layouts from storage:', Object.keys(layouts));
      return layouts;
    }
  } catch (error) {
    console.error('Failed to load responsive layouts from storage:', error);
  }
  return {};
}

/**
 * Convert react-grid-layout layouts format to our storage format
 * Input: { lg: [{i: 'id', x, y, w, h}], md: [...] }
 * Output: { lg: { 'id': {x, y, w, h} }, md: { 'id': {x, y, w, h} } }
 */
export function convertLayoutsToStorageFormat(
  layouts: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>
): BreakpointLayouts {
  const result: BreakpointLayouts = {};
  
  for (const [breakpoint, layoutArray] of Object.entries(layouts)) {
    const layoutMap: Record<string, { x: number; y: number; w: number; h: number }> = {};
    layoutArray.forEach((item) => {
      layoutMap[item.i] = {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      };
    });
    result[breakpoint as keyof BreakpointLayouts] = layoutMap;
  }
  
  return result;
}

/**
 * Convert storage format to react-grid-layout layouts format
 * Input: { lg: { 'id': {x, y, w, h} }, md: { 'id': {x, y, w, h} } }
 * Output: { lg: [{i: 'id', x, y, w, h}], md: [...] }
 */
export function convertStorageFormatToLayouts(
  storedLayouts: BreakpointLayouts,
  widgetIds: string[]
): Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>> {
  const result: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>> = {};
  
  const breakpoints: Array<keyof BreakpointLayouts> = ['lg', 'md', 'sm', 'xs', 'xxs'];
  
  for (const breakpoint of breakpoints) {
    const layoutArray: Array<{ i: string; x: number; y: number; w: number; h: number }> = [];
    const storedLayout = storedLayouts[breakpoint];
    
    if (storedLayout) {
      // Use stored layouts
      for (const [widgetId, layout] of Object.entries(storedLayout)) {
        if (widgetIds.includes(widgetId)) {
          layoutArray.push({
            i: widgetId,
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h,
          });
        }
      }
    }
    
    // Add any widgets that don't have stored layouts (new widgets)
    for (const widgetId of widgetIds) {
      if (!layoutArray.find((item) => item.i === widgetId)) {
        // Calculate default position based on breakpoint
        const defaultLayout = calculateDefaultLayout(widgetId, widgetIds, breakpoint);
        layoutArray.push(defaultLayout);
      }
    }
    
    result[breakpoint] = layoutArray;
  }
  
  return result;
}

/**
 * Calculate default layout for a widget based on breakpoint
 */
function calculateDefaultLayout(
  widgetId: string,
  allWidgetIds: string[],
  breakpoint: keyof BreakpointLayouts
): { i: string; x: number; y: number; w: number; h: number } {
  const index = allWidgetIds.indexOf(widgetId);
  
  // Default column counts per breakpoint
  const cols: Record<string, number> = {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2,
  };
  
  // Default widget widths per breakpoint
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
  
  // Calculate position: place widgets in a grid
  const widgetsPerRow = Math.floor(colsForBreakpoint / defaultWidth);
  const x = (index % widgetsPerRow) * defaultWidth;
  const y = Math.floor(index / widgetsPerRow) * defaultHeight;
  
  return {
    i: widgetId,
    x: Math.min(x, colsForBreakpoint - defaultWidth),
    y,
    w: defaultWidth,
    h: defaultHeight,
  };
}

export function exportDashboardConfig(widgets: WidgetConfig[]): string {
  return JSON.stringify(widgets, null, 2);
}

export function importDashboardConfig(jsonString: string): WidgetConfig[] | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('Failed to import dashboard config:', error);
    return null;
  }
}