import { readdirSync } from 'fs';
import { join } from 'path';
import * as ts from 'typescript';

import type { ReadonlyRecord } from '../utils';

export const isObjectEmpty = (object: object): object is ReadonlyRecord<never, never> => {
    for (const prop in object) {
        if (Object.prototype.hasOwnProperty.call(object, prop)) {
            return false;
        }
    }
    return true;
};

const converters = {
    PascalToKebab: (path: string) => path.replaceAll(/(?<!^)(?=[A-Z])/g, '-').toLowerCase(),
    PascalToCamel: (path: string) => path.replace(/^([A-Z]{1})/g, (match) => match.toLowerCase()),
} as const;

export const convertNameCase = (path: string, conversion: keyof typeof converters): string => converters[conversion](path);

type RuleMetadata = Readonly<{
    /**
     * Just the folder name
     */
    folderName: string;

    /**
     * The formatted name of the rule
     */
    ruleName: string;

    /**
     * Internal reference type option types
     */
    inputTypeFilepath: string;
    inputTypeName: string;

    generatedFilepath: string;
}>;

type RulesMetadata = Readonly<{
    /**
     * The type that will be exported containing all option types
     */
    externalInputTypeName: string;

    rules: readonly RuleMetadata[];
}>;

const foldePath = 'src/Rules';

export const readRulesMetadata = (): RulesMetadata => {
    const rules: RuleMetadata[] = [];

    for (const entry of readdirSync(foldePath, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            rules.push({
                folderName: entry.name,
                ruleName: convertNameCase(entry.name, 'PascalToKebab'),

                inputTypeFilepath: join(foldePath, entry.name, 'Input.ts'),
                inputTypeName: 'OptionsInput',

                generatedFilepath: join(foldePath, entry.name, 'Metadata.ts'),
            });
        }
    }

    return { rules, externalInputTypeName: 'Options' };
};

export const createConstStatement = ({
    exported = true,
    name,
    type,
    value,
}: Readonly<{ exported?: boolean; name: string; type?: ts.TypeNode; value?: ts.Expression }>): ts.VariableStatement =>
    ts.factory.createVariableStatement(
        exported ? [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)] : undefined,
        ts.factory.createVariableDeclarationList([ts.factory.createVariableDeclaration(name, undefined, type, value)], ts.NodeFlags.Const),
    );

export const createImportDeclaration = (
    module: string,
    ...namedImports: readonly Readonly<{ type: boolean; from: string | null; to: string }>[]
): ts.ImportDeclaration => {
    const allTypes = namedImports.every((i) => i.type);

    return ts.factory.createImportDeclaration(
        [],
        ts.factory.createImportClause(
            allTypes,
            undefined,
            ts.factory.createNamedImports(
                namedImports.map(({ type, from, to }) =>
                    ts.factory.createImportSpecifier(
                        allTypes ? false : type,
                        from !== null ? ts.factory.createIdentifier(from) : undefined,
                        ts.factory.createIdentifier(to),
                    ),
                ),
            ),
        ),
        ts.factory.createStringLiteral(module, true),
    );
};

export const printNodes = (...nodes: readonly (ts.Node | '')[]): string =>
    ts
        .createPrinter({ removeComments: false })
        .printList(
            ts.ListFormat.MultiLine,
            ts.factory.createNodeArray(nodes.map((node) => (node === '' ? ts.factory.createIdentifier('\n') : node))),
            ts.factory.createSourceFile([], ts.factory.createToken(ts.SyntaxKind.EndOfFileToken), ts.NodeFlags.None),
        );
