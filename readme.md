A tiny wrapper around localStorage/sessionStorage to make them typed

##Usage

```ts
import type { create, Nullable, StringKey } from '@imasalygin/storage';

const myStorage = create<{ firstKey: string; secondKey: number }>({
    name: 'myNamespace',
    storage: localStorage
});

myStorage('firstKey', 'value');
```

##Options

- name - optional prefix for keys
- storage - localStorage or sessionStorage or your implementation (default localStorage)
- stringify - serialization function (default JSON.stringify)
- parse - deserialization function (default JSON.parse)

##React Hook

One way of implementation

```tsx
import type { create, Nullable, StringKey } from '@imasalygin/storage';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';

export const useStorage = <Type extends Record<string, any>, Key extends StringKey<Type> = StringKey<Type>>(
  { get, subscribe }: ReturnType<typeof create<Type, Key>>,
  ...keys: Key[]
): Nullable<Pick<Type, Key>> => {
  const [value, setValue] = useState(get(keys));

  useEffect(() =>
    subscribe(() => {
      setValue((prev) => {
        const next = get(keys);
        return isEqual(prev, next) ? prev : next;
      });
    })
  );

  return value;
};

const MyComponent = () => {
    const { firstKey } = useStorage(myStorage, 'firstKey');
    return <>{firstKey}</>;
}
```
