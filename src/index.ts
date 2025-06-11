export type StorageItemChangeHandler<T> = ((value: T | null) => void);

export type StorageItemOptions<T> = {
    key: string;
    value?: T;
    parse?: (value: string) => T;
    stringify?: (value: T) => string;
    equals?: (a: T | null, b: T | null) => boolean;
    storage?: Storage;
}

export class StorageItem<T> {
    private readonly handlers = new Set<StorageItemChangeHandler<T>>();
    private readonly parse: (value: string) => T;
    private readonly stringify: (value: T) => string;
    private readonly equals: (a: T | null, b: T | null) => boolean;
    private readonly key: string;
    private value: T | null = null;
    private readonly storage: Storage;

    constructor(options: StorageItemOptions<T>) {
        this.key = options.key;
        this.parse = options.parse ?? JSON.parse;
        this.stringify = options.stringify ?? JSON.stringify;
        this.equals = options.equals ?? Object.is;
        this.storage = options.storage ?? localStorage;

        if (this.get() === null && options.value !== undefined) {
            this.set(options.value);
        }

        addEventListener('storage', (event: StorageEvent) => {
            if (event.key === this.key) {
                this.refresh();
                this.notify();
            }
        });
    }

    get = (): T | null => {
        return this.value;
    };

    set = (value: T): void => {
        if (!this.equals(this.value, value)) {
            this.storage.setItem(this.key, this.stringify(value));
            this.refresh();
            this.notify();
        }
    };

    remove = (): void => {
        if (this.key in this.storage) {
            this.storage.removeItem(this.key);
            this.refresh();
            this.notify();
        }
    };

    subscribe = (handler: StorageItemChangeHandler<T> | { next: StorageItemChangeHandler<T> }): () => void => {
        const next = 'next' in handler ? handler.next : handler;
        this.handlers.add(next);
        return () => {
            this.handlers.delete(next);
        };
    };

    private refresh = (): void => {
        try {
            const item = this.storage.getItem(this.key) as string;
            this.value = this.parse(item);
        } catch (error) {
            this.value = null;
            console.error('Error parsing storage item:', error);
        }
    };

    private notify = (): void => {
        this.handlers.forEach(handler => handler(this.value));
    };
}
