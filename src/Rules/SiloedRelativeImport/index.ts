import { createRule } from '../Base';
import { mapDebugRuleOptionInput } from '../Debug';
import { mapDirectories, type Options, type OptionsInput } from './Input';
import { name, schema } from './Metadata';

const rule = createRule<OptionsInput, Options>(
    {
        name,
        type: 'problem',
        docs: { description: 'Prevents importing of files in specific folders from other specified locations of the codebase through regex.' },
        schema,
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

                if (forbidden.some((forbid) => forbid.test(declaration.pathFromWorkingDirectory))) {
                    context.report({
                        node,
                        message: `Importing of '${declaration.rawPath}' is forbidden on '${relativeFileName}'`,
                    });
                }
            },
        };
    },
);

export { type OptionsInput, rule };
