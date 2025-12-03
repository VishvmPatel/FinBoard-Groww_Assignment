import { configureStore } from '@reduxjs/toolkit';
import widgetsReducer from './slices/widgetsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      widgets: widgetsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['widgets/addWidget', 'widgets/updateWidget'],
        },
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];



