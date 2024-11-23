interface CreateStorageOptions<T> {
  key: string;
  storage?: Storage;

  parse?(value: string): T;

  stringify?(value: T): string;

  defaults?: T | null;
}

type Subscription = () => void;

export function create<T>(options: CreateStorageOptions<T>){
  const {
    key,
    storage = localStorage,
    parse = JSON.parse,
    stringify = JSON.stringify,
    defaults = null
  } = options;

  const subscriptions = new Set<Subscription>();

  function publish() {
    subscriptions.forEach((fn) => fn());
  }

  function subscribe(fn: Subscription){
    subscriptions.add(fn);
    return () => {
      subscriptions.delete(fn);
    }
  }

  function get (): T | null {
    const item = storage.getItem(key);
    return item === null ? defaults : parse(item);
  }

  function set (value: T) {
    storage.setItem(key, stringify(value));
    publish();
  }

  globalThis.addEventListener('storage', (event) => {
    if (event.key === key && event.storageArea === storage) {
      publish();
    }
  });

  return {
    get,
    set,
    subscribe
  }
};
