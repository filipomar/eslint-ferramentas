import { RuleTester } from 'eslint';

import { RelativeImportOrderOptions } from '../types';
import { ruleName, rule } from '.';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015, sourceType: 'module' } });

const valid: (Omit<RuleTester.ValidTestCase, 'options'> & { options: RelativeImportOrderOptions[] })[] = [
    {
        name: 'does not report non relative imports by default',
        code: ["import { readSync } from 'fs'"].join('\n'),
        options: [{ directories: [] }],
    },
    {
        name: 'does not report about imports in the right order',
        code: ["import { DomainType } from '../domain'", "import { ReactComponent } from '../react'"].join('\n'),
        options: [{ directories: ['../domain', '../react'] }],
    },
    {
        name: 'does not report relative imports added to the ignored list',
        code: ["import { DomainType } from '../domain'", "import { ReactComponent } from '../react'"].join('\n'),
        options: [{ ignore: ['../domain', '../react'], directories: [] }],
    },
    {
        name: 'does not report relative imports added if it considers the import to not be relative',
        code: ["import { DomainType } from '../domain'"].join('\n'),
        options: [{ directories: [], isRelative: 'TIME_IS_NOT_RELATIVE' }],
    },
];

const invalid: (RuleTester.InvalidTestCase & { options: RelativeImportOrderOptions[] })[] = [
    {
        name: 'reports imports out of the right order',
        code: ["import { ReactComponent } from '../react'", "import { DomainType } from '../domain'"].join('\n'),
        options: [{ directories: ['../domain', '../react'] }],
        errors: ["Imports from '../domain' should be above the import from '../react'"],
        output: ["import { DomainType } from '../domain'", "import { ReactComponent } from '../react'"].join('\n'),
    },
    {
        name: 'reports imports not listed in the directories option',
        code: ["import { DomainType } from '../domain'"].join('\n'),
        options: [{ ignore: [], directories: [] }],
        errors: [
            [
                "The path '../domain' is not listed on the ESLINT rule 'relative-import-order'.",
                "If 'relative-import-order' is enabled then all imported paths need to be included,",
                'if you do not wish to order this import, add it to the ignored list',
            ].join('\n'),
        ],
    },
];

ruleTester.run(ruleName, rule, { valid, invalid });
