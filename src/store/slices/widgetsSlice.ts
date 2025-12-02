import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WidgetConfig } from '@/types';

interface WidgetsState {
  widgets: WidgetConfig[];
}

const initialState: WidgetsState = {
  widgets: [],
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<WidgetConfig>) => {
      state.widgets.push(action.payload);
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      state.widgets = state.widgets.filter((w) => w.id !== action.payload);
    },
    updateWidget: (state, action: PayloadAction<{ id: string; config: Partial<WidgetConfig> }>) => {
      const index = state.widgets.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index] = { ...state.widgets[index], ...action.payload.config };
      }
    },
    updateWidgetLayout: (
      state,
      action: PayloadAction<{ id: string; layout: { x: number; y: number; w: number; h: number } }>
    ) => {
      const index = state.widgets.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index].layout = action.payload.layout;
      }
    },
    setWidgets: (state, action: PayloadAction<WidgetConfig[]>) => {
      state.widgets = action.payload;
    },
    updateWidgetLastUpdated: (state, action: PayloadAction<{ id: string; timestamp: number }>) => {
      const index = state.widgets.findIndex((w) => w.id === action.payload.id);
      if (index !== -1) {
        state.widgets[index].lastUpdated = action.payload.timestamp;
      }
    },
  },
});

export const {
  addWidget,
  removeWidget,
  updateWidget,
  updateWidgetLayout,
  setWidgets,
  updateWidgetLastUpdated,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;

