import assert from 'assert';
import type { RuleTester } from 'eslint';

import type { Options } from '.';
import type { NonEmptyArray, ReadonlyRecord } from './utils';

type Case<OptionlessCase, Options, E = ReadonlyRecord<never, never>> = Omit<OptionlessCase, 'options'> & ReadonlyRecord<'options', Options> & E;

const testCases: {
    [P in keyof Options]: Readonly<{
        valid: NonEmptyArray<Case<RuleTester.ValidTestCase, readonly Options[P][]>>;
        invalid: NonEmptyArray<Case<RuleTester.InvalidTestCase, readonly Options[P][], Readonly<{ errors: string[] }>>>;
    }>;
} = {
    'import-spaces': {
        valid: [
            {
                name: 'groups imports as expected',
                code: [
                    "import { DomainType } from 'static'",
                    '',
                    "import { FooA } from './foo/a'",
                    "import { FooB } from './foo/b'",
                    '',
                    "import { Bar } from './bar'",
                    '',
                    "import { Other } from './other'",
                ].join('\n'),
                options: [{ groups: ['^foo.*$', '^bar.*$'] }],
            },
        ],
        invalid: [
            {
                name: 'detects spaces that should be added or removed',
                code: [
                    "import { DomainType } from 'static';",
                    '',
                    "import { FooA } from './foo/a';",
                    '',
                    "import { FooB } from './foo/b';",
                    "import { Bar } from './bar';",
                    '',
                    "import { Other } from './other';",
                ].join('\n'),
                options: [{ groups: ['^foo.*$', '^bar.*$'] }],
                errors: ['There should be no empty lines in a import group', 'There should be one empty line between import groups'],
                output: [
                    "import { DomainType } from 'static';",
                    '',
                    "import { FooA } from './foo/a';",
                    "import { FooB } from './foo/b';",
                    '',
                    "import { Bar } from './bar';",
                    '',
                    "import { Other } from './other';",
                ].join('\n'),
            },
            {
                name: 'detects spaces that should be added or removed even if they have comments',
                code: [
                    "import { A } from 'a';",
                    '',
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { B } from 'b';",
                    '',
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { C } from 'c';",
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { D } from './foo';",
                ].join('\n'),
                options: [{ groups: ['^foo.*$', '^bar.*$'] }],
                errors: [
                    'There should be no empty lines in a import group',
                    'There should be no empty lines in a import group',
                    'There should be one empty line between import groups',
                ],
                output: [
                    "import { A } from 'a';",
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { B } from 'b';",
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { C } from 'c';",
                    '',
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { D } from './foo';",
                ].join('\n'),
            },
        ],
    },
    'relative-import-order': {
        valid: [
            {
                name: 'sorts by all sort options at once',
                code: [
                    "import { A } from 'static'",
                    "import { B } from './src/utils'",
                    "import { C } from './src/domain'",
                    "import { D } from './src/domain/a'",
                    "import { E } from './src/domain/b'",
                    "import { F } from './src/domain/c'",
                    "import { G } from './src/domain/d'",
                    "import { H } from './src/domain/b/a'",
                    "import { I } from './src/domain/b/b'",
                    "import { J } from './src/react'",
                    "import { K } from 'other-static'",
                ].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['src/utils', 'src/domain', 'src/react'] }, { type: 'depth' }, { type: 'name' }] }],
            },
            {
                name: 'does not report about imports in the right order',
                code: ["import { DomainType } from '../domain'", "import { ReactComponent } from '../react'"].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['../domain', '../react'] }] }],
            },
            {
                name: 'does not report relative imports added to the ignored list',
                code: ["import { DomainType } from '../domain'", "import { ReactComponent } from '../react'"].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['../foo', '../bar'], ignore: ['../domain', '../react'] }] }],
            },
            {
                name: 'sorts by name is ascending order by default',
                code: ["import { A } from '../domain/a'", "import { B } from '../domain/b'"].join('\n'),
                options: [{ sort: [{ type: 'name' }] }],
            },
            {
                name: 'sorts by name is descending order',
                code: ["import { B } from '../domain/b'", "import { A } from '../domain/a'"].join('\n'),
                options: [{ sort: [{ type: 'name', asc: false }] }],
            },
            {
                name: 'sorts by name depth',
                code: ["import { A } from '../domain'", "import { B } from '../domain/b'"].join('\n'),
                options: [{ sort: [{ type: 'depth' }] }],
            },
        ],
        invalid: [
            {
                name: 'detects wrong group import order and lists imports that are not listed in groups',
                code: [
                    "import { Label } from '../bottom-library'",
                    "import { isBufferValid } from '../top-library'",
                    "import { SpanishInquisition } from '../non-listed/import-path'",
                ].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['top-library', 'bottom-library'] }, { type: 'depth' }, { type: 'name' }] }],
                errors: [
                    "Imports from '../top-library' should be above the import from '../bottom-library'",
                    [
                        "The path 'non-listed/import-path' is not listed.",
                        'All imported paths need to be included, either in the groups (so they are sorted) or ignored',
                    ].join('\n'),
                ],
                filename: './bottom-library/ExampleImporter.tsx',
                output: [
                    "import { isBufferValid } from '../top-library'",
                    "import { Label } from '../bottom-library'",
                    "import { SpanishInquisition } from '../non-listed/import-path'",
                ].join('\n'),
            },
            {
                name: 'reports imports not listed in the directories option',
                code: ["import { DomainType } from '../domain'", "import { OtherType } from '../utils'"].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['../utils'] }] }],
                errors: [
                    [
                        "The path '../domain' is not listed.",
                        'All imported paths need to be included, either in the groups (so they are sorted) or ignored',
                    ].join('\n'),
                ],
            },
            {
                name: 'detects issues with group sorting',
                code: ["import { ReactComponent } from '../react'", "import { DomainType } from '../domain'"].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['../domain', '../react'] }] }],
                errors: ["Imports from '../domain' should be above the import from '../react'"],
                output: ["import { DomainType } from '../domain'", "import { ReactComponent } from '../react'"].join('\n'),
            },
            {
                name: 'detects issues with name sorting',
                code: ["import { A } from '../domain/a'", "import { B } from '../domain/b'"].join('\n'),
                options: [{ sort: [{ type: 'name', asc: false }] }],
                errors: ["Imports from '../domain/b' should be above the import from '../domain/a'"],
                output: ["import { B } from '../domain/b'", "import { A } from '../domain/a'"].join('\n'),
            },
            {
                name: 'detects issues with depth sorting',
                code: ["import { B } from '../domain/b'", "import { A } from '../domain'"].join('\n'),
                options: [{ sort: [{ type: 'depth' }] }],
                errors: ["Imports from '../domain' should be above the import from '../domain/b'"],
                output: ["import { A } from '../domain'", "import { B } from '../domain/b'"].join('\n'),
            },
            {
                name: 'detects wrong group import order and corrects it even if there are comments',
                code: [
                    "import { Label } from '../bottom-library'",
                    "import { LabelA } from '../bottom-library/a'",
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { isBufferValid } from '../top-library'",
                ].join('\n'),
                options: [{ sort: [{ type: 'group', groups: ['top-library', 'bottom-library'] }, { type: 'depth' }, { type: 'name' }] }],
                errors: ["Imports from '../top-library' should be above the import from '../bottom-library/a'"],
                filename: './bottom-library/ExampleImporter.tsx',
                output: [
                    "import { Label } from '../bottom-library'",
                    '/**',
                    ' * @deprecated',
                    ' */',
                    "import { isBufferValid } from '../top-library'",
                    "import { LabelA } from '../bottom-library/a'",
                ].join('\n'),
            },
        ],
    },
    'siloed-relative-import': {
        valid: [
            {
                name: 'does not report relative imports if the filter is for another file',
                code: ["import { getUsers } from './http'"].join('\n'),
                filename: 'src/http',
                options: [{ directories: [{ filter: '^src/react', forbid: ['^src/http'] }] }],
            },
            {
                name: 'does not report non relative imports',
                code: ["import { readSync } from 'fs'", "import { getUsers } from './valid-path'"].join('\n'),
                filename: 'src/react',
                options: [{ directories: [{ filter: '^src/react', forbid: ['^src/http'] }] }],
            },
            {
                name: 'does not report allowed imports',
                code: ["import { DomainType } from './domain'"].join('\n'),
                filename: 'src/react',
                options: [{ directories: [{ filter: '^src/react', forbid: ['^src/http'] }] }],
            },
        ],
        invalid: [
            {
                name: 'reports forbidden imports',
                code: ["import { getUsers } from '../some-other-folder'"].join('\n'),
                filename: 'src/importing-folder/file.ts',
                options: [{ directories: [{ filter: '^src/importing-folder.*$', forbid: ['^src/some-other-folder'] }] }],
                errors: ["Importing of '../some-other-folder' is forbidden on 'src/importing-folder/file.ts'"],
            },
        ],
    },
};

type TestCases = typeof testCases;

export const getRuleTestCases = (ruleName: string): TestCases[keyof TestCases] => {
    const ruleTestcases = testCases[ruleName as keyof typeof testCases];

    assert(ruleTestcases, `Test cases for rule '${ruleName}' should exist`);

    return ruleTestcases;
};
