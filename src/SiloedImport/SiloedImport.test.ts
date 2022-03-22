import { RuleTester } from 'eslint';

import { SiloedImportOptions } from '../types';
import { ruleName, rule } from '.';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015, sourceType: 'module' } });

const valid: (Omit<RuleTester.ValidTestCase, 'options'> & { options: SiloedImportOptions[] })[] = [
    {
        name: 'does not report non relative imports',
        code: ["import { readSync } from 'fs'"].join('\n'),
        options: [{ directories: [] }],
    },
    {
        name: 'does not report allowed imports',
        code: ["import { DomainType } from './domain'"].join('\n'),
        filename: 'src/react',
        options: [{ directories: [{ filter: '^src/react', forbid: ['^src/http'] }] }],
    },
    {
        name: 'does not report relative imports added if it considers the import to not be relative',
        code: ["import { DomainType } from '../domain'"].join('\n'),
        options: [{ directories: [], isRelative: 'TIME_IS_NOT_RELATIVE' }],
    },
    {
        name: 'does not report relative imports if the filter is for another file',
        code: ["import { getUsers } from './http'"].join('\n'),
        filename: 'src/http',
        options: [{ directories: [{ filter: '^src/react', forbid: ['^src/http'] }] }],
    },
];

const invalid: (RuleTester.InvalidTestCase & { options: SiloedImportOptions[] })[] = [
    {
        name: 'reports forbidden imports',
        code: ["import { getUsers } from './http'"].join('\n'),
        filename: 'src/react',
        options: [{ directories: [{ filter: '^src/react', forbid: ['^src/http'] }] }],
        errors: ["Importing of 'src/http' is forbidden on 'src/react'"],
    },
];

ruleTester.run(ruleName, rule, { valid, invalid });
