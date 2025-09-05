import type { ImportDeclaration } from 'estree';

import { isPathRelative } from '../../utils';
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

const rule = createRule<OptionsInput, Options, 'noEmpty' | 'oneEmpty'>(
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
        messages: {
            noEmpty: 'There should be no empty lines in a import group',
            oneEmpty: 'There should be one empty line between import groups',
        },
    },
    (input) => ({ ...mapGroups(input), ...mapDebugRuleOptionInput(input) }),
    (context) => {
        const groups = context.getOption('groups');
        context.debug('groups', ...groups);

        const helper = new ImportGroupHelper(groups);

        return {
            'ImportDeclaration + ImportDeclaration': (node: ImportDeclaration) => {
                const declaration = context.getImportDeclaration(node);
                context.debug('declaration', declaration);

                const previous = declaration.getPreviousSiblingWithSameTypeOrThrow();
                context.debug('previous', previous);

                const needsSpace = helper.mapType(declaration) !== helper.mapType(previous);
                context.debug('needsSpace', needsSpace);

                const wantedLineBreaks = needsSpace ? 2 : 1;
                context.debug('wantedLines', wantedLineBreaks);

                const actualLineBreaks = declaration.getLocation(true).start.line - previous.getLocation(false).end.line;
                context.debug('actualLines', actualLineBreaks);

                if (wantedLineBreaks === actualLineBreaks) {
                    return;
                }

                const range = declaration.getRangeBetween(previous, true);
                context.debug('range', range);

                context.report({
                    loc: declaration.getLocation(false),
                    messageId: needsSpace ? 'oneEmpty' : 'noEmpty',
                    fix: (fixer) => [fixer.replaceTextRange(range, Array(wantedLineBreaks).fill('\n').join(''))],
                });
            },
        };
    },
);

export { type OptionsInput, rule };
