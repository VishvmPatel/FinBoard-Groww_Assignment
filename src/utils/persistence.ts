import { WidgetConfig } from '@/types';

const STORAGE_KEY = 'finboard-widgets';
const LAYOUT_KEY = 'finboard-layout';

export function saveWidgetsToStorage(widgets: WidgetConfig[]): void {
  try {
    const serializable = widgets.map((w) => ({
      ...w,
      createdAt: w.createdAt,
      lastUpdated: w.lastUpdated,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
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

export function saveLayoutToStorage(layout: Record<string, { x: number; y: number; w: number; h: number }>): void {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch (error) {
    console.error('Failed to save layout to storage:', error);
  }
}

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

