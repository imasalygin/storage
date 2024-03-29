export class FakeStorage implements Storage {
  length = 0;

  setItem(key: string, value: string) {}

  getItem(key: string): string | null {
    return null;
  }

  removeItem(key: string) {}

  clear() {}

  key(index: number): string | null {
    return null;
  }
}
