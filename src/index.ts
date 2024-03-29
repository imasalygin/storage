export type StringKey<T> = Extract<keyof T, string>;

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
}

export type Subscription = () => void;

export type Options = {
  name?: string;
  storage?: Storage;
  stringify?(value: any): string;
  parse?(value: string): any;
}

export function create<Type extends Record<string, any>, Key extends StringKey<Type> = StringKey<Type>>(options?: Options) {
  const {
    name,
    storage = localStorage,
    stringify = JSON.stringify,
    parse = JSON.parse,
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

  const prefix = name ? `${name}:` : '';

  function id(key: Key) {
    return `${prefix}${key}`;
  }

  function set<K extends Key>(key: K, value: Type[K]): void {
    storage.setItem(id(key), stringify(value));
    notify();
  }

  function has(key: Key): boolean {
    return id(key) in storage
  }

  function get<K extends Key>(key: K): Type[K] | null;
  function get<K extends Key>(key: K[]): Nullable<Pick<Type, K>>;
  function get<K extends Key>(key: K | K[]): unknown {
    if (Array.isArray(key)) {
      return key.reduce((acc, key) => {
        acc[key] = get(key);
        return acc;
      }, {} as Nullable<Pick<Type, K>>);
    } else {
      const value = storage.getItem(id(key));
      return value === null ? null : parse(value);
    }
  }

  function remove(key: Key): void {
    if (has(key)) {
      storage.removeItem(id(key));
      notify();
    }
  }

  function keys(): Key[] {
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
    keys().forEach(remove);
  }

  if (typeof window !== 'undefined' && [localStorage, sessionStorage].includes(storage)) {
    window.addEventListener('storage', (event) => {
      if (keys().map(id).includes(event.key as Key)) {
        notify();
      }
    });
  }

  const methods = { set, get, has, remove, clear, subscribe, keys };

  return new Proxy(methods, {
    get(target, prop: Key & typeof target) {
      return prop in target ? target[prop] : target.get(prop);
    }
  }) as typeof methods & Nullable<Type>;
}
