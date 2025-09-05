import { sep } from 'path';
import type { Rule } from 'eslint';
import type { ImportDeclaration } from 'estree';

import { isPathRelative, type Tupple } from '../../utils';
import { createRule, type ExtendedImportDeclaration } from '../Base';
import { mapDebugRuleOptionInput } from '../Debug';
import { mapSort, type Options, type OptionsInput, type SortOptionsInput, type SortOptionsInputType } from './Input';
import { name, schema } from './Metadata';

const messages = {
    directoryNotImported: [
        "The path '{{pathFromWorkingDirectory}}' is not listed.",
        'All imported paths need to be included, either in the groups (so they are sorted) or ignored',
    ].join('\n'),
    shouldSwitch: "Imports from '{{rawPath}}' should be above the import from '{{aux.rawPath}}'",
} as const;

const mapTupple = <I, O>([a, b]: Tupple<I>, mapper: (input: I) => O): Tupple<O> => [mapper(a), mapper(b)];

type ImportError = Pick<Rule.ReportDescriptor, 'fix'> & Readonly<{ messageId: keyof typeof messages }>;

const sorters: {
    [P in SortOptionsInputType]: (
        imports: Tupple<ExtendedImportDeclaration>,
        sort: Required<SortOptionsInput<P>>,
    ) => number | Map<ExtendedImportDeclaration, ImportError>;
} = {
    group: (declarations, sort) => {
        const [a, b] = mapTupple(declarations, (declaration) => {
            const position = sort.groups.findIndex((directory) => declaration.pathFromWorkingDirectory.startsWith(directory));
            if (position >= 0) {
                /** There was a match, great, just yield the result */
                return position;
            }

            if (sort.ignore.some((directory) => declaration.pathFromWorkingDirectory.startsWith(directory))) {
                /** Import was not found on groupings, but explicity told to be ignored */
                return null;
            }

            /** User misconfigured, needs to add an ignore */
            return declaration;
        });

        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }

        return [a, b].reduce(
            (map, declaration) => (declaration !== null && typeof declaration !== 'number' ? map.set(declaration, { messageId: 'directoryNotImported' }) : map),
            new Map<ExtendedImportDeclaration, ImportError>(),
        );
    },
    depth: (declarations) => {
        const [aDepth, bDepth] = mapTupple(declarations, (declaration) => declaration.pathFromWorkingDirectory.split(sep).length);
        return aDepth - bDepth;
    },
    name: ([aDeclaration, bDeclaration], { asc }) => {
        const out = aDeclaration.pathFromWorkingDirectory.localeCompare(bDeclaration.pathFromWorkingDirectory);
        return asc ? out : out * -1;
    },
};

const rule = createRule<OptionsInput, Options, keyof typeof messages>(
    {
        name,
        type: 'layout',
        fixable: 'code',
        hasSuggestions: true,
        docs: {
            description: [
                'Ensure relative imports appear in a specific order as set on the configuration.',
                'The paths must be set with root paths and not from the perspective of the files where the import actually happens.',
            ].join('\n'),
        },
        schema,
        messages,
    },
    (input) => ({ ...mapSort(input), ...mapDebugRuleOptionInput(input) }),
    (context) => ({
        'ImportDeclaration + ImportDeclaration': (node: ImportDeclaration) => {
            const declaration = context.getImportDeclaration(node);
            context.debug('declaration', declaration);

            const previous = declaration.getPreviousSiblingWithSameTypeOrThrow();
            context.debug('previous', previous);

            const tuppleRelativeness = mapTupple([declaration, previous], (d) => isPathRelative(d.rawPath));
            context.debug('tuppleRelativeness', ...tuppleRelativeness);
            if (tuppleRelativeness.includes(false)) {
                return;
            }

            let errors = new Map<ExtendedImportDeclaration, ImportError>();
            const sortedImports = [previous, declaration].sort((...declarations) => {
                for (const sort of context.getOption('sort')) {
                    context.debug('sort.type', sort.type);

                    const sorter = sorters[sort.type];
                    const result = sorter(declarations, sort as never);

                    if (typeof result === 'number' && result !== 0) {
                        context.debug('sort.result', result);
                        return result;
                    }

                    if (result instanceof Map) {
                        context.debug('sort.error', ...result.keys());
                        errors = new Map([...errors, ...result]);
                    }
                }

                return 0;
            });

            context.debug('errors', ...errors.keys());

            const isSorted = sortedImports[0] === previous;
            context.debug('isSorted', isSorted);

            if (errors.size === 0 && !isSorted) {
                errors.set(declaration, {
                    messageId: 'shouldSwitch',
                    /** Swap imports */
                    fix: (fixer) => [
                        fixer.replaceTextRange(declaration.getRange(true), previous.toString(true)),
                        fixer.replaceTextRange(previous.getRange(true), declaration.toString(true)),
                    ],
                });
            }

            for (const [declaration, error] of errors.entries()) {
                context.report({
                    loc: declaration.getLocation(false),
                    ...error,
                    data: {
                        rawPath: declaration.rawPath,
                        pathFromWorkingDirectory: declaration.pathFromWorkingDirectory,
                        'aux.rawPath': previous.rawPath,
                        'aux.pathFromWorkingDirectory': previous.pathFromWorkingDirectory,
                    },
                });
            }
        },
    }),
);

export { type OptionsInput, rule };
