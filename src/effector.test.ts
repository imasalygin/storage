import { describe, test, expect, beforeEach, vi } from 'vitest';
import { fromObservable } from 'effector';
import { StorageItem } from './index';

interface Theme {
    mode: 'light' | 'dark';
    primaryColor: string;
}

describe('Storage with Effector', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('should work as an Observable with fromObservable', async () => {
        // Create storage instance
        const themeStorage = new StorageItem<Theme>({
            key: 'theme',
            value: { mode: 'light', primaryColor: '#007AFF' }
        });

        // Verify initial value
        expect(themeStorage.get()).toEqual({ mode: 'light', primaryColor: '#007AFF' });

        // Create Effector event from Observable
        const event = fromObservable<Theme | null>(themeStorage);
        const fn = vi.fn();
        event.watch(fn);

        // Test value updates
        themeStorage.set({ mode: 'dark', primaryColor: '#FF0000' });
        expect(fn).toHaveBeenCalledWith({ mode: 'dark', primaryColor: '#FF0000' });

        // Test multiple updates
        themeStorage.set({ mode: 'light', primaryColor: '#00FF00' });
        expect(fn).toHaveBeenCalledWith({ mode: 'light', primaryColor: '#00FF00' });

        // Test removal
        themeStorage.remove();
        expect(fn).toHaveBeenCalledWith(null);

        // Verify call count
        expect(fn).toHaveBeenCalledTimes(3);
    });
}); 