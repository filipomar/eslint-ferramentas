import type { Rule } from 'eslint';
import { dirname, relative, resolve } from 'path';

import { createDebugger, extractImportPath, RELATIVE_IMPORT_PATTERN } from '../Utils';
import { Options, OptionsInput } from './Input';

export const ruleName = 'siloed-import';

const extractOptions = ([firstOption]: unknown[]): Options => {
    const { directories, isRelative = RELATIVE_IMPORT_PATTERN, debug = false } = firstOption as OptionsInput;

    return {
        directories,
        isRelative: new RegExp(isRelative),
        debug,
    };
};

export const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: { description: 'disallows the importing of the forbidden files from the filtered files' },
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    isRelative: { type: 'string' },
                    debug: { type: 'boolean' },
                    directories: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                filter: { type: 'string' },
                                forbid: { type: 'array', items: { type: 'string' } },
                            },
                            required: ['filter', 'forbid'],
                            additionalProperties: false,
                        },
                    },
                },
                required: ['directories'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 1,
        },
    },
    create: (context) => {
        /**
         * Get context input
         */
        const options = extractOptions(context.options);
        const directory = context.getCwd();
        const fileName = context.getFilename();

        const debug = createDebugger(options.debug);

        debug('options', options);
        debug('directory', directory);
        debug('fileName', fileName);

        const relativeFileName = relative(directory, fileName);
        const fileFolder = dirname(fileName);

        debug('relativeFileName', relativeFileName);
        debug('fileFolder', fileFolder);

        const forbidden = options.directories.reduce<RegExp[]>(
            (r, { filter, forbid }) => (new RegExp(filter).test(relativeFileName) ? [...r, ...forbid.map((f) => new RegExp(f))] : r),
            [],
        );

        debug('forbidden', forbidden);

        if (!forbidden.length) {
            /**
             * There is nothing to forbid
             * So don't return any declaration
             */
            return {};
        }

        return {
            ImportDeclaration: (node) => {
                const importPath = extractImportPath(node);
                const relativeImportedFilename = relative(directory, resolve(fileFolder, importPath));

                debug('importPath', importPath);
                debug('relativeImportedFilename', relativeImportedFilename);

                if (forbidden.some((forbid) => forbid.test(relativeImportedFilename))) {
                    context.report({
                        node,
                        message: `Importing of '${relativeImportedFilename}' is forbidden on '${relativeFileName}'`,
                    });
                }
            },
        };
    },
};
