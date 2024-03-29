import { Domain, DomainOptions, KeyDefinitions, StringKeys } from './Domain';
import { FakeStorage } from './FakeStorage';

export const fakeStorage = new FakeStorage();

type StringKey<T> = Extract<keyof T, string>;
type Subscription = () => void;

type Nullable<T> = {
  [P in keyof T]: T[P] | null;
}

export function create<Type extends Record<string, any>, Key extends StringKey<Type> = StringKey<Type>>(options?: DomainOptions) {
  const {
    name,
    storage = localStorage,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options ?? {};

  const subscriptions = new Set<Subscription>();

  function subscribe(fn: Subscription) {
    subscriptions.add(fn);
    return () => {
      subscriptions.delete(fn);
    }
  }

  function notify() {
    subscriptions.forEach((fn) => fn());
  }

  function id(key: Key | '') {
    return name ? `${name}:${key}` : key;
  }

  function set<K extends Key>(key: K, value: Type[K]): void {
    storage.setItem(id(key), serialize(value));
    notify();
  }

  function get<K extends Key>(key: K): Type[K] | null;
  function get<K extends Key>(key: K[]): Nullable<Pick<Type, K>>;
  function get<K extends Key>(key: K | K[]): any {
    if (Array.isArray(key)) {
      return key.reduce((acc, key) => {
        acc[key] = get(key);
        return acc;
      }, {} as Nullable<Pick<Type, K>>);
    } else {
      const value = storage.getItem(id(key));
      return value === null ? null : deserialize(value);
    }
  }

  function remove(key: Key): void {
    storage.removeItem(id(key));
    notify();
  }

  function keys(): Key[] {
    const prefix = id('');
    const keys: Key[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key.substring(prefix.length) as Key);
      }
    }

    return keys;
  }

  function clear(): void {
    keys().forEach((key) => storage.removeItem(key));
  }

  return {
    set,
    get,
    remove,
    clear,
    subscribe
  }
}

const storage = create<{a: number, b: string}>()

storage.set('b', '4');
storage.get('a')

const { a, b} = storage.get(['a', 'b'])

storage.remove('a');
