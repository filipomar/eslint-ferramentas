# eslint-ferramentas

A bundle of useful ESLint rules.

As all these rules _need_ configuration by default, no plugin preset is exported.

Install it by running `npm install --save-dev eslint-ferramentas`

## Rules

### Static analysis

-   **Forbid** importing modules relative to the root of the project with `siloed-import` with the power of regex.

With the rule below:

```js
/**
 * @type {import('eslint-plugin-ferramentas').SiloedImportOptions}
 */
const siloedImportOptions = {
    directories: [
        // Forbids import of test files or
        // files from the test folder from regular files
        {
            filter: '^(.*?)(?<!\\.test)\\.ts$',
            forbid: ['^(.*?)\\.test$', '^src/test'],
        },
    ],
};

module.exports = {
    plugins: ['ferramentas'],
    rules: {
        'ferramentas/siloed-import': ['error', siloedImportOptions],
    },
};
```

Then importing any `*.test.ts` files or files from the `./src/test` folder will be forbidden by ESLint.

All configuration options can be found [here](./src/SiloedImport/Input.ts#L4).

### Style guide

-   Ensure relative imports (and **only**) appear in a specific order with `relative-import-order` and the power ~~friendship~~ of regex.

With the rule below:

```js
/**
 * @type {import('eslint-plugin-ferramentas').RelativeImportOrderOptions}
 */
const relativeImportOrderOptions = {
    directories: ['./src/domain', './src/reducers', './src/react', './src/app', './test'],
};

module.exports = {
    plugins: ['ferramentas'],
    rules: {
        'ferramentas/relative-import-order': ['error', relativeImportOrderOptions],
    },
};
```

The imports seen below:

```js
import { foo } from '../../test';
import { alpha } from '../../../reducers';
import { bar } from '../../../react';
import teta from '../../../domain';

import { createIntl, IntlShape, OnErrorFn } from '@formatjs/intl';
```

Will be auto-fixed to:

```js
import teta from '../../../domain';
import { alpha } from '../../../reducers';
import { bar } from '../../../react';
import { foo } from '../../test';

import { createIntl, IntlShape, OnErrorFn } from '@formatjs/intl';
```

All configuration options can be found [here](./src/RelativeImportOrder/Input.ts#L3).

Note that this rule does **not** attempt to order non relative imports, and does **not** care about their grouping, values sorting, or spacing.
