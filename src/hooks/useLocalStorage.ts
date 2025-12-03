import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { saveWidgetsToStorage, loadWidgetsFromStorage } from '@/utils/persistence';
import { useAppDispatch } from '@/store/hooks';
import { setWidgets } from '@/store/slices/widgetsSlice';

export function useLocalStoragePersistence() {
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const dispatch = useAppDispatch();
  const hasLoadedRef = useRef(false);

  // Load from storage ONLY once on initial mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      const stored = loadWidgetsFromStorage();
      if (stored.length > 0) {
        dispatch(setWidgets(stored));
      }
      hasLoadedRef.current = true;
    }
  }, [dispatch]);

  // Save to storage whenever widgets change (including empty array to clear storage)
  useEffect(() => {
    // Only save after initial load is complete (to avoid overwriting with empty array on mount)
    if (hasLoadedRef.current) {
      saveWidgetsToStorage(widgets);
    }
  }, [widgets]);
}


