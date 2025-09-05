import type { ImportDeclaration } from 'estree';
import type { AST } from 'eslint';

import { isPathRelative, type ReadonlyRecord } from '../../utils';
import { createRule, type ExtendedImportDeclaration } from '../Base';
import { mapDebugRuleOptionInput } from '../Debug';
import { mapGroups, type Options, type OptionsInput } from './Input';
import { name, schema } from './Metadata';

type Type = 'ABSOLUTE' | 'GROUP_NOT_FOUND' | `GROUP_${number}`;

/**
 * Auxiliar class to calculate the group of a given import
 */
class ImportGroupHelper {
    private readonly cache = new Map<ExtendedImportDeclaration, Type>();

    constructor (private readonly groups: Options['groups']) {}

    private calculateType (declaration: ExtendedImportDeclaration): Type {
        if (!isPathRelative(declaration.rawPath)) {
            return 'ABSOLUTE';
        }

        const position = this.groups.findIndex((pattern) => pattern.test(declaration.pathFromWorkingDirectory));

        if (position < 0) {
            return 'GROUP_NOT_FOUND';
        }

        return `GROUP_${position}`;
    }

    mapType (declaration: ExtendedImportDeclaration): Type {
        const value = this.cache.get(declaration) ?? this.calculateType(declaration);

        if (!this.cache.has(declaration)) {
            this.cache.set(declaration, value);
        }

        return value;
    }
}

type WantedBreaks = 1 | 2;

const errorMessages: ReadonlyRecord<WantedBreaks, string> = {
    1: 'There should be no empty lines in a import group',
    2: 'There should be one empty line between import groups',
};

const rule = createRule<OptionsInput, Options>(
    {
        name,
        type: 'layout',
        fixable: 'whitespace',
        hasSuggestions: true,
        docs: {
            description: [
                'Enforces consistency of spacing between relative imports according to the folder each imports reference.',
                'Imports are grouped as defined in the configuration, spaces are only allowed between the groups.',
                'Non relative imports, and relative imports without a specified group will be considered to be each in their own group, thus having spaces between them as well.',
            ].join('\n'),
        },
        schema,
    },
    (input) => ({ ...mapGroups(input), ...mapDebugRuleOptionInput(input) }),
    (context) => {
        const groups = context.getOption('groups');
        context.debug('groups', ...groups);

        const helper = new ImportGroupHelper(groups);

        const corrections = new Map<ImportDeclaration, Readonly<{ range: AST.Range; breaks: WantedBreaks }>>();

        let previousDeclaration: ExtendedImportDeclaration | null = null;
        for (const currenDeclaration of context.getImportDeclarations()) {
            context.debug('declaration', currenDeclaration);

            if (previousDeclaration !== null) {
                const needsSpace = helper.mapType(currenDeclaration) !== helper.mapType(previousDeclaration);

                const wantedLineBreaks = needsSpace ? 2 : 1;
                context.debug('wantedLines', wantedLineBreaks);

                const actualLineBreaks = currenDeclaration.location.start.line - previousDeclaration.location.end.line;
                context.debug('actualLines', actualLineBreaks);

                if (wantedLineBreaks !== actualLineBreaks) {
                    corrections.set(currenDeclaration.node, {
                        range: context.getRangeBetween(previousDeclaration, currenDeclaration),
                        breaks: wantedLineBreaks,
                    });
                }
            } else {
                context.debug('no previous declaration');
            }

            previousDeclaration = currenDeclaration;
        }

        context.debug('corrections', ...corrections.keys());

        return {
            ImportDeclaration: (node) => {
                const correction = corrections.get(node);

                if (correction === undefined) {
                    return;
                }

                context.report({
                    node,
                    message: errorMessages[correction.breaks],
                    fix: (fixer) => [fixer.replaceTextRange(correction.range, Array(correction.breaks).fill('\n').join(''))],
                });
            },
        };
    },
);

export { type OptionsInput, rule };
