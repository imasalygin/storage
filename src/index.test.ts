import { describe, test, expect, beforeEach, vi } from 'vitest';
import { deepEqual } from 'fast-equals';
import { StorageItem, type StorageItemOptions } from './index';

interface User {
  name: string;
  age: number;
}

describe('StorageItem', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should store and retrieve values', () => {
    const options: StorageItemOptions<User> = {
      key: 'user',
      value: { name: 'John', age: 30 },
      parse: JSON.parse,
      stringify: JSON.stringify
    };
    const storage = new StorageItem(options);

    expect(storage.get()).toEqual({ name: 'John', age: 30 });

    storage.set({ name: 'Jane', age: 25 });
    expect(storage.get()).toEqual({ name: 'Jane', age: 25 });
  });

  test('should handle custom parsers', () => {
    const options: StorageItemOptions<Date> = {
      key: 'lastLogin',
      value: new Date('2024-03-06'),
      parse: (str: string) => new Date(str),
      stringify: (date: Date) => date.toISOString()
    };
    const storage = new StorageItem(options);

    const newDate = new Date('2024-03-07');
    storage.set(newDate);
    
    const retrieved = storage.get();
    expect(retrieved instanceof Date).toBe(true);
    expect((retrieved as Date).toISOString()).toBe(newDate.toISOString());
  });

  test('should handle parsing errors', () => {
    const storage = new StorageItem<User>({
      key: 'user',
      value: { name: 'John', age: 30 }
    });

    // Manually set invalid JSON
    localStorage.setItem('user', 'invalid json');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const event = new StorageEvent('storage', { key: 'user', storageArea: localStorage });
    window.dispatchEvent(event);
    
    expect(storage.get()).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Error parsing storage item:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  test('should notify subscribers of changes from other tabs', () => {
    const storage = new StorageItem<User>({
      key: 'user',
      value: { name: 'John', age: 30 },
      parse: JSON.parse,
      stringify: JSON.stringify
    });

    const handler = vi.fn();
    storage.subscribe(handler);

    // Simulate storage event from another tab
    const newValue = { name: 'Jane', age: 25 };
    localStorage.setItem('user', JSON.stringify(newValue)); // Set the actual value in localStorage
    
    const event = new StorageEvent('storage', { key: 'user', storageArea: localStorage });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledWith(newValue);
  });

  test('should handle unsubscribe', () => {
    const storage = new StorageItem<User>({
      key: 'user',
      value: { name: 'John', age: 30 }
    });

    const handler = vi.fn();
    const unsubscribe = storage.subscribe(handler);

    // First event should trigger handler
    const event1 = new StorageEvent('storage', {
      key: 'user',
      oldValue: null,
      newValue: JSON.stringify({ name: 'Jane', age: 25 }),
      storageArea: localStorage
    });
    window.dispatchEvent(event1);
    expect(handler).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // Second event should not trigger handler
    const event2 = new StorageEvent('storage', {
      key: 'user',
      oldValue: null,
      newValue: JSON.stringify({ name: 'Bob', age: 35 }),
      storageArea: localStorage
    });
    window.dispatchEvent(event2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('should ignore events for different keys', () => {
    const storage = new StorageItem<User>({
      key: 'user',
      value: { name: 'John', age: 30 },
      parse: JSON.parse,
      stringify: JSON.stringify
    });

    const handler = vi.fn();
    storage.subscribe(handler);

    // Event for different key
    const event = new StorageEvent('storage', {
      key: 'different-key',
      oldValue: null,
      newValue: JSON.stringify({ name: 'Jane', age: 25 }),
      storageArea: localStorage
    });
    window.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  test('should remove item from storage', () => {
    const storage = new StorageItem<User>({
      key: 'user',
      value: { name: 'John', age: 30 }
    });

    storage.remove();
    expect(storage.get()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('should handle basic operations', () => {
    const storage = new StorageItem<string>({
      key: 'test',
      value: 'initial'
    });

    expect(storage.get()).toBe('initial');
    storage.set('updated');
    expect(storage.get()).toBe('updated');
    storage.remove();
    expect(storage.get()).toBeNull();
  });

  test('should support custom comparison', () => {
    interface User {
      id: number;
      name: string;
    }

    // Custom compare that only checks id and name
    const storage = new StorageItem<User>({
      key: 'user',
      value: { id: 1, name: 'John' },
      equals: deepEqual
    });

    const handler = vi.fn();
    storage.subscribe(handler);

    // Should not trigger (only lastUpdated changed)
    storage.set({
      id: 1,
      name: 'John',
    });
    expect(handler).not.toHaveBeenCalled();

    // Should trigger (name changed)
    storage.set({
      id: 1,
      name: 'Jane'
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('should work with sessionStorage', () => {
    const storage = new StorageItem<number>({
      key: 'counter',
      value: 1,
      storage: sessionStorage
    });
  
    expect(storage.get()).toBe(1);
    expect(sessionStorage.getItem('counter')).toBe('1');
  
    storage.set(2);
    expect(storage.get()).toBe(2);
    expect(sessionStorage.getItem('counter')).toBe('2');
  
    storage.remove();
    expect(storage.get()).toBeNull();
    expect(sessionStorage.getItem('counter')).toBeNull();
  });
});