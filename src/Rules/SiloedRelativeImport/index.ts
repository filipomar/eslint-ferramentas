import { isPathRelative } from '../../utils';
import { createRule } from '../Base';
import { mapDebugRuleOptionInput } from '../Debug';
import { mapDirectories, type Options, type OptionsInput } from './Input';
import { name, schema } from './Metadata';

const rule = createRule<OptionsInput, Options, 'fobiddenImport'>(
    {
        name,
        type: 'problem',
        docs: { description: 'Prevents importing of files in specific folders from other specified locations of the codebase through regex.' },
        schema,
        messages: { fobiddenImport: "Importing of '{{rawPath}}' is forbidden on '{{relativeFileName}}'" },
    },
    (input) => ({ ...mapDirectories(input), ...mapDebugRuleOptionInput(input) }),
    (context) => {
        const relativeFileName = context.getRelativeFilename();
        context.debug('relativeFileName', relativeFileName);

        const forbidden = context
            .getOption('directories')
            .reduce<readonly RegExp[]>(
                (r, { filter, forbid }) => (new RegExp(filter).test(relativeFileName) ? [...r, ...forbid.map((f) => new RegExp(f))] : r),
                [],
            );
        context.debug('forbidden', ...forbidden);

        if (forbidden.length === 0) {
            /**
             * There is nothing to forbid
             * So don't return any declaration
             */
            return {};
        }

        return {
            ImportDeclaration: (node) => {
                const declaration = context.getImportDeclaration(node);
                context.debug('declaration', declaration);

                const isRelative = isPathRelative(declaration.rawPath);
                context.debug('isRelative', isRelative);
                if (!isRelative) {
                    return;
                }

                if (forbidden.some((forbid) => forbid.test(declaration.pathFromWorkingDirectory))) {
                    context.report({
                        loc: declaration.getLocation(false),
                        messageId: 'fobiddenImport',
                        data: { rawPath: declaration.rawPath, relativeFileName },
                    });
                }
            },
        };
    },
);

export { type OptionsInput, rule };
