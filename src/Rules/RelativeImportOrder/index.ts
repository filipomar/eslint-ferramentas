import { sep } from 'path';
import type { Rule } from 'eslint';

import { isPathRelative, type Tupple } from '../../utils';
import { createRule, ExtendedImportDeclaration } from '../Base';
import { mapDebugRuleOptionInput } from '../Debug';
import { mapSort, type Options, type OptionsInput, type SortOptionsInput, type SortOptionsInputType } from './Input';
import { name, schema } from './Metadata';

const mapTupple = <I, O>([a, b]: Tupple<I>, mapper: (input: I) => O): Tupple<O> => [mapper(a), mapper(b)];

type ImportError = Pick<Rule.ReportDescriptor, 'fix'> & Readonly<{ message: string }>;

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
            (map, declaration) =>
                declaration instanceof ExtendedImportDeclaration
                    ? map.set(declaration, {
                          message: [
                              `The path '${declaration.pathFromWorkingDirectory}' is not listed.`,
                              'All imported paths need to be included, either in the groups (so they are sorted) or ignored',
                          ].join('\n'),
                      })
                    : map,
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

const rule = createRule<OptionsInput, Options>(
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
    },
    (input) => ({ ...mapSort(input), ...mapDebugRuleOptionInput(input) }),
    (context) => {
        const allImports = context.getImportDeclarations();
        context.debug('allImports', ...allImports);

        const relativeImports = allImports.filter((node) => isPathRelative(node.rawPath));
        context.debug('relativeImports', ...relativeImports);

        let errors = new Map<ExtendedImportDeclaration, ImportError>();
        const sortedImports = [...relativeImports].sort((...declarations) => {
            for (const sort of context.getOption('sort')) {
                const sorter = sorters[sort.type];
                const result = sorter(declarations, sort as never);

                if (typeof result === 'number' && result !== 0) {
                    return result;
                }

                if (result instanceof Map) {
                    errors = new Map([...errors, ...result]);
                }
            }

            return 0;
        });
        context.debug('sortedImports', ...sortedImports);

        for (let position = 0; position < sortedImports.length; position++) {
            const sortedImport = sortedImports[position];
            const actualImport = relativeImports[position];

            if (sortedImport !== actualImport) {
                errors.set(sortedImport, {
                    message: `Imports from '${sortedImport.rawPath}' should be above the import from '${actualImport.rawPath}'`,
                    /** Swap imports */
                    fix: (fixer) => [
                        fixer.replaceText(sortedImport.node, actualImport.toString()),
                        fixer.replaceText(actualImport.node, sortedImport.toString()),
                    ],
                });
                break;
            }
        }
        context.debug('errors', ...errors.keys());

        /** Finally, translate the errors to something the rules can actually use */
        const importDeclarationErrors = new Map(Array.from(errors, ([{ node: declaration }, metadata]) => [declaration, { ...metadata, node: declaration }]));

        return {
            ImportDeclaration: (node) => {
                const match = importDeclarationErrors.get(node);
                if (match !== undefined) {
                    context.report({ ...match });
                }
            },
        };
    },
);

export { type OptionsInput, rule };
