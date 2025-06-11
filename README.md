A type-safe localStorage wrapper.

## Features

- 🔒 Type-safe storage operations
- 🛠️ Customizable serialization/deserialization
- 🔧 Configurable storage backend
- 📦 Zero dependencies

## Installation

```bash
npm install @imasalygin/storage
```

## Usage

### Basic Usage

```typescript
import { StorageItem } from '@imasalygin/storage';

interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

const themeStorage = new StorageItem<Theme>({
  key: 'theme',
  value: { mode: 'light', primaryColor: '#007AFF' } // Optional default value
});

// Get current value
const theme = themeStorage.get();

// Update value
themeStorage.set({ mode: 'dark', primaryColor: '#0A84FF' });

// Remove value
themeStorage.remove();
```

### React Integration

```typescript
import { useSyncExternalStore } from 'react';
import { StorageItem } from '@imasalygin/storage';

// Create storage instance
const themeStorage = new StorageItem<Theme>({
  key: 'theme',
  value: { mode: 'light', primaryColor: '#007AFF' }
});

// Use in component
function ThemeProvider() {
  const theme = useSyncExternalStore(
    themeStorage.subscribe,
    themeStorage.get
  );

  return (
    <div style={{ background: theme.mode === 'dark' ? '#000' : '#fff' }}>
      {/* Your app content */}
    </div>
  );
}
```

### Effector Integration

The StorageItem class implements the Observable interface, making it compatible with Effector's `fromObservable`:

```typescript
// Tab 1
const storage = new StorageItem<Theme>({ key: 'theme', value: null });

const $theme = createStore<Theme>(storage.get());
const event = fromObservable<Theme>(storage);
$theme.on(event, (_, value) => value);

// Tab 2 - Changes here will update Tab 1's store
const storage = new StorageItem<Theme>({ key: 'theme', value: null });
storage.set({ mode: 'dark', primaryColor: '#000000' });
```

### Custom Storage Backend

You can provide a custom storage implementation that follows the Web Storage API:

```typescript
import { StorageItem } from '@imasalygin/storage';

// Example: Using sessionStorage instead of localStorage
const sessionTheme = new StorageItem<Theme>({
  key: 'theme',
  value: { mode: 'light', primaryColor: '#007AFF' },
  storage: sessionStorage
});

// Example: Custom storage implementation
class CustomStorage implements Storage {
  private store = new Map<string, string>();
  
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  
  removeItem(key: string): void {
    this.store.delete(key);
  }
  
  // ... implement other required Storage methods
}

const customTheme = new StorageItem<Theme>({
  key: 'theme',
  value: { mode: 'light', primaryColor: '#007AFF' },
  storage: new CustomStorage()
});
```

### Custom Serialization

```typescript
import { StorageItem } from '@imasalygin/storage';

const dateStorage = new StorageItem<Date>({
  key: 'lastVisit',
  value: new Date(),
  parse: (str) => new Date(str),
  stringify: (date) => date.toISOString()
});
```

### Custom Value Comparison

The StorageItem class uses `Object.is` by default to compare values. You can provide a custom comparison function for more efficient updates or deep equality checks:

```typescript
import { deepEqual } from 'fast-equals';

// Using deep equality for complex objects
const configStorage = new StorageItem<Config>({
  key: 'config',
  value: defaultConfig,
  equals: deepEqual // Only triggers updates when values are actually different
});
```

## API Reference

### StorageItem Class

#### Constructor Options

```typescript
interface StorageItemOptions<T> {
  key: string;              // Storage key
  value?: T;                // Initial value
  parse?: (str: string) => T;    // Custom parse function
  stringify?: (val: T) => string; // Custom stringify function
  equals?: (a: T | null, b: T | null) => boolean; // Custom comparison function
  storage?: Storage;       // Custom storage implementation
}
```

The options object accepts the following properties:

- `key`: The key to use in storage
- `value`: Initial value
- `parse`: Custom function to parse stored string into value (defaults to `JSON.parse`)
- `stringify`: Custom function to convert value to string (defaults to `JSON.stringify`)
- `equals`: Custom function to compare values (defaults to `Object.is`)
  - Used to determine if a value has changed and updates should be triggered
  - Particularly useful for complex objects or when specific fields should be ignored
  - Should handle null values as they are used when storage is empty
- `storage`: Custom storage implementation (defaults to `localStorage`)
  - Must implement the Web Storage API interface
  - Useful for using `sessionStorage` or custom storage implementations

#### Methods

- `get(): T | null` - Get current value
- `set(value: T): void` - Set new value
- `remove(): void` - Remove value from storage
- `subscribe(handler: (value: T | null) => void): () => void` - Subscribe to changes

## License

MIT 
