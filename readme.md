A tiny wrapper around localStorage/sessionStorage to make them typed

## Usage

```ts
import type { create, Nullable, StringKey } from '@imasalygin/storage';

const myStorage = create<{ firstKey: string; secondKey: number }>({
    name: 'myNamespace',
    storage: localStorage
});

myStorage.set('firstKey', 'value'); // correct
myStorage.set('wrongKey', 'value'); // typescript error
myStorage.set('firstKey', 1); // typescript error

myStorage.get('firstKey'); // string | null

myStorage.get(['firstKey', 'secondKey']); // { firstKey: string | null; secondKey: number | null }

etc
```

## Options

- namespace - required prefix for keys
- storage - localStorage or sessionStorage or your implementation (default localStorage)
- stringify - serialization function (default JSON.stringify)
- parse - deserialization function (default JSON.parse)

## React Hook

One way of implementation

```tsx
import type { create, Nullable, StringKey } from '@imasalygin/storage';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';

export const useStorage = <Type extends Record<string, unknown>, Key extends StringKey<Type> = StringKey<Type>>(
  { get, subscribe }: ReturnType<typeof create<Type, Key>>,
  ...keys: Key[]
): Nullable<Pick<Type, Key>> => {
  const [value, setValue] = useState(get(keys));

  useEffect(() => {
    return subscribe(() => {
      setValue((prev) => {
        const next = get(keys);
        return isEqual(prev, next) ? prev : next;
      });
    })
  }, [subscribe, get, ...keys]);

  return value;
};

const MyComponent = () => {
    const { firstKey, secondKey } = useStorage(myStorage, 'firstKey', 'secondKey');
    return <>{firstKey}</>;
}
```
