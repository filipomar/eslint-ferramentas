import type { Rule } from 'eslint';
import type { ImportDeclaration } from 'estree';
import { resolve, dirname } from 'path';

import { createDebugger, extractImportPath, RELATIVE_IMPORT_PATTERN } from '../Utils';
import { Options, OptionsInput } from './Input';

export const ruleName = 'relative-import-order';

const extractOptions = (directory: string, [firstOption]: unknown[]): Options => {
    const {
        directories, ignore = [], isRelative = RELATIVE_IMPORT_PATTERN, debug = false,
    } = firstOption as OptionsInput;

    return {
        ignore: ignore.map((relativePath) => resolve(directory, relativePath)),
        directories: directories.map((relativePath) => resolve(directory, relativePath)),
        isRelative: new RegExp(isRelative),
        debug,
    };
};

/**
 * @returns the position an import should have *if* it is not ignored
 *  - number for the actual position
 *  - true if it was ignored
 *  - false if no match is founf
 */
const resolvePositionFromConfig = ({ directories, ignore }: Options, importPath: string): number | boolean => {
    const indexPos = directories.findIndex((directory) => importPath.startsWith(directory));

    if (indexPos >= 0) {
        /**
         * Position from config found
         */
        return indexPos;
    }

    if (ignore.some((directory) => importPath.startsWith(directory))) {
        /**
         * Import is ignored
         */
        return true;
    }

    return false;
};

const reportOutOfOrder = (context: Rule.RuleContext, node: ImportDeclaration, lastNode: ImportDeclaration) => context.report({
    node,
    message: `Imports from '${extractImportPath(node)}' should be above the import from '${extractImportPath(lastNode)}'`,
    /** Swap imports */
    fix: (fixer) => [
        fixer.replaceText(node, context.getSourceCode().getText(lastNode)),
        fixer.replaceText(lastNode, context.getSourceCode().getText(node)),
    ],
});

const reportNonListed = (context: Rule.RuleContext, node: ImportDeclaration) => context.report({
    node,
    message: [
        `The path '${extractImportPath(node)}' is not listed on the ESLINT rule '${ruleName}'.`,
        `If '${ruleName}' is enabled then all imported paths need to be included,`,
        'if you do not wish to order this import, add it to the ignored list',
    ].join('\n'),
});

export const rule: Rule.RuleModule = {
    meta: {
        type: 'layout',
        fixable: 'code',
        hasSuggestions: true,
        docs: { description: 'enforces a ordering of relative imports, so they follow a consistent structure across all files' },
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    directories: { type: 'array', items: { type: 'string' } },
                    ignore: { type: 'array', items: { type: 'string' } },
                    isRelative: { type: 'string' },
                    debug: { type: 'boolean' },
                },
                required: ['directories'],
                additionalProperties: false,
            },
            minItems: 1,
            maxItems: 1,
        },
    },
    create: (context) => {
        const workingDirectory = context.getCwd();
        const currentDirectory = dirname(context.getFilename());
        const options = extractOptions(workingDirectory, context.options);

        const debug = createDebugger(options.debug);

        debug('workingDirectory', workingDirectory);
        debug('currentDirectory', currentDirectory);
        debug('options', options);

        let lastAux: Readonly<{ position: number; node: ImportDeclaration }> | null = null;

        return {
            ImportDeclaration: (node) => {
                const importPath = extractImportPath(node);

                debug('importPath', importPath);

                const isRelative = options.isRelative.test(importPath);

                debug('isRelative', isRelative);

                if (!isRelative) {
                    /**
                     * If its a module, just give up
                     */
                    return;
                }

                const position = resolvePositionFromConfig(options, resolve(currentDirectory, importPath));

                debug('position', position);
                debug('lastAux.position', lastAux?.position);

                if (position === true) {
                    /**
                     * Import is in the ignored list
                     */
                    return;
                }

                if (position === false) {
                    reportNonListed(context, node);
                    return;
                }

                if (lastAux !== null && lastAux.position !== null && lastAux.position > position) {
                    /**
                     * If their position is swapped, then report
                     */
                    reportOutOfOrder(context, node, lastAux.node);
                }

                lastAux = { position, node };
            },
        };
    },
};
