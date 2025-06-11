import { describe, test, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { StorageItem } from './index';

interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

const createThemeStorage = () => new StorageItem<Theme>({
  key: 'theme',
  value: { mode: 'light', primaryColor: '#007AFF' }
});

describe('Storage with React', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should sync with localStorage', () => {
    const storage = createThemeStorage();
    const { result } = renderHook(() =>
      useSyncExternalStore(storage.subscribe, storage.get)
    );

    expect(result.current).toEqual({
      mode: 'light',
      primaryColor: '#007AFF'
    });

    act(() => {
      storage.set({ mode: 'dark', primaryColor: '#0A84FF' });
    });

    expect(result.current).toEqual({
      mode: 'dark',
      primaryColor: '#0A84FF'
    });
  });

  test('should sync across multiple hooks', () => {
    const storage = createThemeStorage();
    const hook1 = renderHook(() =>
      useSyncExternalStore(storage.subscribe, storage.get)
    );
    const hook2 = renderHook(() =>
      useSyncExternalStore(storage.subscribe, storage.get)
    );

    act(() => {
      storage.set({ mode: 'dark', primaryColor: '#0A84FF' });
    });

    expect(hook1.result.current).toEqual({
      mode: 'dark',
      primaryColor: '#0A84FF'
    });
    expect(hook2.result.current).toEqual({
      mode: 'dark',
      primaryColor: '#0A84FF'
    });
  });

  test('should handle storage events', () => {
    const storage = createThemeStorage();
    const { result } = renderHook(() =>
      useSyncExternalStore(storage.subscribe, storage.get)
    );

    act(() => {
      localStorage.setItem('theme', JSON.stringify({ mode: 'dark', primaryColor: '#0A84FF' }));

      const event = new StorageEvent('storage', {
        key: 'theme',
        storageArea: localStorage
      });
      window.dispatchEvent(event);
    });

    expect(result.current).toEqual({
      mode: 'dark',
      primaryColor: '#0A84FF'
    });
  });

  test('should cleanup on unmount', () => {
    const storage = createThemeStorage();
    const unsubscribe = vi.fn();
    vi.spyOn(storage, 'subscribe').mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() =>
      useSyncExternalStore(storage.subscribe, storage.get)
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
