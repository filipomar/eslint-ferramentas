# eslint-plugin-ferramentas

This package contains 3 ESLint rules.<br/>
As all these rules **need** configuration by default, no plugin preset is exported.<br/>
Install it by running `npm install --save-dev eslint-plugin-ferramentas`

## Rules

### import-spaces

Enforces consistency of spacing between relative imports according to the folder each imports reference.<br/>
Imports are grouped as defined in the configuration, spaces are only allowed between the groups.<br/>
Non relative imports, and relative imports without a specified group will be considered to be each in their own group, thus having spaces between them as well.

#### Configuration

To configure the rule on `.eslintrc.js`, simply add:

```js
/** @type {import('eslint-plugin-ferramentas').Options['import-spaces']} */
const options = {
    groups: ['^foo.*$', '^bar.*$'],
};

module.exports = { rules: { 'ferramentas/import-spaces': ['error', options] } };
```

#### Possible errors examples

`🔧 Automatic fixes available`

> There should be no empty lines in a import group

> There should be one empty line between import groups

#### Fixes

When configured with:

```json
{
    "groups": ["^foo.*$", "^bar.*$"]
}
```

Will change:

```ts
import { DomainType } from 'static';

import { FooA } from './foo/a';

import { FooB } from './foo/b';
import { Bar } from './bar';

import { Other } from './other';
```

To:

```ts
import { DomainType } from 'static';

import { FooA } from './foo/a';
import { FooB } from './foo/b';

import { Bar } from './bar';

import { Other } from './other';
```

### relative-import-order

Ensure relative imports appear in a specific order as set on the configuration.<br/>
The paths must be set with root paths and not from the perspective of the files where the import actually happens.

#### Configuration

To configure the rule on `.eslintrc.js`, simply add:

```js
/** @type {import('eslint-plugin-ferramentas').Options['relative-import-order']} */
const options = {
    sort: [
        {
            type: 'group',
            groups: ['src/utils', 'src/domain'],
        },
        {
            type: 'depth',
        },
        {
            type: 'name',
        },
    ],
};

module.exports = { rules: { 'ferramentas/relative-import-order': ['error', options] } };
```

#### Possible errors examples

`🔧 Automatic fixes available`

> Imports from '../top-library' should be above the import from '../bottom-library'

> The path 'non-listed/import-path' is not listed.
> All imported paths need to be included, either in the groups (so they are sorted) or ignored

#### Fixes

When configured with:

```json
{
    "sort": [
        {
            "type": "group",
            "groups": ["top-library", "bottom-library"]
        },
        {
            "type": "depth"
        },
        {
            "type": "name"
        }
    ]
}
```

Will change (while on the file `./bottom-library/ExampleImporter.tsx`):

```ts
import { Label } from '../bottom-library';
import { isBufferValid } from '../top-library';
import { SpanishInquisition } from '../non-listed/import-path';
```

To:

```ts
import { isBufferValid } from '../top-library';
import { Label } from '../bottom-library';
import { SpanishInquisition } from '../non-listed/import-path';
```

### siloed-relative-import

Prevents importing of files in specific folders from other specified locations of the codebase through regex.

#### Configuration

To configure the rule on `.eslintrc.js`, simply add:

```js
/** @type {import('eslint-plugin-ferramentas').Options['siloed-relative-import']} */
const options = {
    directories: [
        {
            filter: '^src/react',
            forbid: ['^src/http'],
        },
    ],
};

module.exports = { rules: { 'ferramentas/siloed-relative-import': ['error', options] } };
```

#### Possible errors examples

> Importing of '../some-other-folder' is forbidden on 'src/importing-folder/file.ts'
