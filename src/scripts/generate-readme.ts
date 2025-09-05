import { writeFileSync } from 'fs';
import * as md from 'ts-markdown-builder';
import * as ts from 'typescript';

import { name } from '../../package.json';
import { rules } from '..';
import { getRuleTestCases } from '../RulesTestCases';
import { createConstStatement, printNodes, readRulesMetadata } from './utils';

const ruleEntries = Object.entries(rules);
const { externalInputTypeName } = readRulesMetadata();

const content = md.joinBlocks([
    md.heading(name),
    [
        `This package contains ${ruleEntries.length} ESLint rules.`,
        `As all these rules ${md.bold('need')} configuration by default, no plugin preset is exported.`,
        `Install it by running ${md.code(`npm install --save-dev ${name}`)}`,
    ].join(`${md.lineBreak}\n`),

    md.heading('Rules', { level: 2 }),

    ...ruleEntries.flatMap(([ruleName, { meta }]) => {
        const ruleLines: string[] = [];

        const fixes = Boolean(meta.fixable) && (meta.hasSuggestions ?? false);
        const {
            valid: [firstValid],
            invalid: [firstInvalid],
        } = getRuleTestCases(ruleName);

        /** Heading */
        ruleLines.push(md.heading(ruleName, { level: 3 }), meta.docs.description.replaceAll('\n', `${md.lineBreak}\n`));

        /** Configuration */
        ruleLines.push(
            md.heading('Configuration', { level: 4 }),
            `To configure the rule on ${md.code('.eslintrc.js')}, simply add:`,
            md.codeBlock(
                printNodes(
                    ts.factory.createJSDocComment(undefined, [
                        ts.factory.createJSDocTypeTag(
                            undefined,
                            ts.factory.createJSDocTypeExpression(
                                ts.factory.createIndexedAccessTypeNode(
                                    ts.factory.createImportTypeNode(
                                        ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(name, true)),
                                        undefined,
                                        ts.factory.createIdentifier(externalInputTypeName),
                                    ),
                                    ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(ruleName, true)),
                                ),
                            ),
                        ),
                    ]),
                    createConstStatement({
                        exported: false,
                        name: 'options',
                        value: ts.factory.createIdentifier(JSON.stringify(firstValid.options[0], null, 2)),
                    }),
                    '',
                    ts.factory.createBinaryExpression(
                        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('module'), ts.factory.createIdentifier('exports')),
                        ts.factory.createToken(ts.SyntaxKind.EqualsToken),
                        ts.factory.createObjectLiteralExpression([
                            ts.factory.createPropertyAssignment(
                                'rules',
                                ts.factory.createObjectLiteralExpression([
                                    ts.factory.createPropertyAssignment(
                                        ts.factory.createStringLiteral(`ferramentas/${ruleName}`),
                                        ts.factory.createArrayLiteralExpression([
                                            ts.factory.createStringLiteral('error'),
                                            ts.factory.createIdentifier('options'),
                                        ]),
                                    ),
                                ]),
                            ),
                        ]),
                    ),
                ),
                { language: 'js' },
            ),
        );

        /** Errors */
        ruleLines.push(md.heading('Possible errors examples', { level: 4 }));
        if (fixes) {
            ruleLines.push(md.code('🔧 Automatic fixes available'));
        }
        ruleLines.push(...Array.from(new Set(firstInvalid.errors)).map((error) => md.blockquote(error)));

        /** Fixes */
        if (typeof firstInvalid.output === 'string') {
            ruleLines.push(
                md.heading('Fixes', { level: 4 }),
                'When configured with:',
                md.codeBlock(JSON.stringify(firstInvalid.options[0], null, 2), { language: 'json' }),
                typeof firstInvalid.filename === 'string' ? `Will change (while on the file ${md.code(firstInvalid.filename)}):` : 'Will change:',
                md.codeBlock(firstInvalid.code, { language: 'ts' }),
                'To:',
                md.codeBlock(firstInvalid.output, { language: 'ts' }),
            );
        }

        return ruleLines;
    }),
]);

writeFileSync('./README.md', content);
