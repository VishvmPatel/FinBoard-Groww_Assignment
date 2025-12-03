import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { saveWidgetsToStorage, loadWidgetsFromStorage } from '@/utils/persistence';
import { useAppDispatch } from '@/store/hooks';
import { setWidgets } from '@/store/slices/widgetsSlice';

export function useLocalStoragePersistence() {
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const dispatch = useAppDispatch();

  // Load from storage on mount
  useEffect(() => {
    const stored = loadWidgetsFromStorage();
    if (stored.length > 0) {
      dispatch(setWidgets(stored));
    }
  }, [dispatch]);

  // Save to storage whenever widgets change
  useEffect(() => {
    if (widgets.length > 0) {
      saveWidgetsToStorage(widgets);
    }
  }, [widgets]);
}


