import { beforeEach, expect, test } from 'vitest';
import { create } from './index';

beforeEach(() => {
  localStorage.clear();
})

const storage = create<{a: number, b: string, c: boolean}>();

test('should set value', () => {
  storage.set('a', 1);
  expect(localStorage.getItem('a')).toBe('1');
});

test('should get value', () => {
  storage.set('a', 1);
  expect(storage.get('a')).toBe(1);
})

test('should get values', () => {
  storage.set('a', 1);
  storage.set('b', '2');
  expect(storage.get(['a', 'b', 'c'])).toEqual({a: 1, b: '2', c: null})
});

test('should get values directly', () => {
  storage.set('a', 1);
  storage.set('b', '2');
  const { a, b, } = storage;
  expect({ a, b }).toEqual({a: 1, b: '2'})
})

test('should get keys', () => {
  storage.set('a', 1);
  storage.set('b', '2');
  expect(storage.keys()).toEqual(['a', 'b']);
});

test('should get keys with prefix', () => {
  const storage = create<{'a': number}>({
    name: 'asdf'
  });
  storage.set('a', 1);
  expect(storage.keys()).toEqual(['a']);
  expect(localStorage.getItem('asdf:a')).toBe('1')
})

test('should remove', () => {
  storage.set('a', 1);
  expect(storage.get('a')).toBe(1);
  storage.remove('a');
  expect(storage.get('a')).toBe(null);
})

test('should clear', () => {
  storage.set('a', 1);
  storage.set('b', '2');
  storage.clear();
  expect(storage.get('a')).toBe(null);
  expect(storage.get('b')).toBe(null);
});
