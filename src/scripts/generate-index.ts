import { writeFileSync } from 'fs';
import * as ts from 'typescript';

import { convertNameCase, createConstStatement, createImportDeclaration, printNodes, readRulesMetadata } from './utils';

const createInputTypeNameCast = (folderName: string, inputTypeName: string): string => `${folderName}${inputTypeName}`;
const createRuleNameVariable = (folderName: string): string => `${convertNameCase(folderName, 'PascalToCamel')}Rule`;

const { rules, externalInputTypeName } = readRulesMetadata();
const toGenerate = 'src/Rules/index.ts';

const content = printNodes(
    createImportDeclaration('../utils', { type: true, from: null, to: 'ArrayType' }),
    ...rules.map(({ folderName, inputTypeName }) =>
        createImportDeclaration(
            `./${folderName}`,
            { type: true, from: inputTypeName, to: createInputTypeNameCast(folderName, inputTypeName) },
            { type: false, from: 'rule', to: createRuleNameVariable(folderName) },
        ),
    ),
    '',
    /** Add type object */
    ts.factory.createTypeAliasDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        externalInputTypeName,
        [],
        ts.factory.createTypeReferenceNode('Readonly', [
            ts.factory.createTypeLiteralNode(
                rules.map(({ folderName, ruleName, inputTypeName }) =>
                    ts.factory.createPropertySignature(
                        [],
                        ts.factory.createStringLiteral(ruleName, true),
                        undefined,
                        ts.factory.createTypeReferenceNode('ArrayType', [
                            ts.factory.createTypeReferenceNode(createInputTypeNameCast(folderName, inputTypeName)),
                        ]),
                    ),
                ),
            ),
        ]),
    ),
    '',
    createConstStatement({
        name: 'rules',
        value: ts.factory.createObjectLiteralExpression(
            rules.map(({ folderName }) => ts.factory.createSpreadAssignment(ts.factory.createIdentifier(createRuleNameVariable(folderName)))),
        ),
    }),
);

writeFileSync(toGenerate, content);
