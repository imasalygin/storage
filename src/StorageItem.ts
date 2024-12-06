type Options<T> = {
  key: string;
  value: T | null;
  storage: Storage;
  parse: (value: string) => T;
  stringify: (value: T) => string;
  equal: (a: T | null, b: T | null) => boolean;
  defaults: T | null;
};

type Subscription = () => void;

export class StorageItem<T> {
  static readonly #instances: StorageItem<any>[] = [];

  static create<T>(options: Options<T>) {
    const instance = new this(options);
    this.#instances.push(instance);
    return instance;
  }

  static {
    addEventListener('storage', (event) => {
      this.#instances.forEach((item) => {
        if (item.#key === event.key && item.#storage === event.storageArea) {
          const value = item.#read();
          if (!item.#equal(item.#value, value)) {
            item.#value = value;
            item.#notify();
          }
        }
      });
    });

    // cookieStore.addEventListener("change", (event) => {
    //
    // })
  }

  readonly #key: string;
  #value: T | null;
  readonly #storage: Storage;
  readonly #parse: (value: string) => T;
  readonly #stringify: (value: T) => string;
  readonly #equal: (a: T | null, b: T | null) => boolean;
  readonly #defaults: T | null;
  readonly #subscriptions = new Set<Subscription>();

  constructor({key, storage, parse, stringify, equal, defaults}: Options<T>) {
    this.#key = key;
    this.#storage = storage ?? localStorage;
    this.#parse = parse ?? JSON.parse;
    this.#stringify = stringify ?? JSON.stringify;
    this.#defaults = defaults ?? null;
    this.#equal = equal ?? Object.is;
    this.#value = this.#read();
  }

  #read() {
    const value = this.#storage.getItem(this.#key);
    return value === null ? this.#defaults : this.#parse(value);
  }

  #write(value: T): void {
    this.#storage.setItem(this.#key, this.#stringify(value));
  }

  get() {
    return this.#value;
  }

  set(value: T) {
    if (!this.#equal(this.#value, value)) {
      this.#value = value;
      this.#write(value);
      this.#notify();
    }
  }

  subscribe(fn: Subscription) {
    this.#subscriptions.add(fn);
    return () => {
      this.#subscriptions.delete(fn);
    };
  }

  #notify() {
    this.#subscriptions.forEach((fn) => fn());
  }
}
