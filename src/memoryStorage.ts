class MemoryStorage implements Storage {
    #map = new Map<string, string>();

    get length(): number {
        return this.#map.size;
    }

    clear(): void {
        this.#map.clear();
    }

    getItem(key: string): string | null {
        return this.#map.get(key) ?? null;
    }

    key(index: number): string | null {
        return Array.from(this.#map.keys()).at(index) ?? null;
    }

    removeItem(key: string): void {
        this.#map.delete(key);
    }

    setItem(key: string, value: string): void {
        this.#map.set(key, value);
    }

    emit() {
        // TODO: !
    }

}

export const memoryStorage = new MemoryStorage();
