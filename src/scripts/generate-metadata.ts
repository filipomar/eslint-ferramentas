import assert from 'assert';
import { writeFileSync } from 'fs';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import * as ts from 'typescript';
import { createGenerator } from 'ts-json-schema-generator';

import { createConstStatement, createImportDeclaration, isObjectEmpty, printNodes, readRulesMetadata } from './utils';

/**
 * This will create a JSONSchema7 schema, but with a defined set target of JSONSchema4
 * If this ever becomes an issue, and a generated schema has a feature too advanced for JSONSchema4 then function will have to be revised
 */
const createSchemaInstructions = (
    filePath: string,
    typeName: string,
): Readonly<{ schema: JSONSchema7; type: readonly [library: 'json-schema', typeName: 'JSONSchema4'] }> => {
    const { $schema, ...schema } = createGenerator({
        tsconfig: 'tsconfig.json',
        path: filePath,
        additionalProperties: false,
        expose: 'none',
        topRef: false,
        encodeRefs: false,
        strictTuples: true,
        sortProps: true,
    }).createSchema(typeName);

    return { schema, type: ['json-schema', 'JSONSchema4'] };
};

const stripOfNoise = (definition: Readonly<JSONSchema7Definition>): JSONSchema7Definition => {
    if (typeof definition === 'boolean') {
        return definition;
    }

    const { type, items, minItems, maxItems, properties, required, additionalProperties, allOf, anyOf, definitions, const: constValue, ...rest } = definition;

    /**
     * Drop elements we do not care about
     */
    delete rest.description;
    delete rest.examples;
    delete rest.default;

    assert(isObjectEmpty(rest), 'Schema should be empty');

    return Object.fromEntries(
        Object.entries({
            type,

            items: items === undefined ? items : Array.isArray(items) ? items.map(stripOfNoise) : stripOfNoise(items),
            minItems,
            maxItems,

            properties:
                properties === undefined
                    ? properties
                    : Object.fromEntries(Object.entries(properties).map(([id, definition]) => [id, stripOfNoise(definition)])),
            additionalProperties:
                additionalProperties === undefined || typeof additionalProperties === 'boolean' ? additionalProperties : stripOfNoise(additionalProperties),
            required,

            anyOf: anyOf === undefined ? anyOf : anyOf.map(stripOfNoise),
            allOf: allOf === undefined ? allOf : allOf.map(stripOfNoise),

            const: constValue,

            definitions:
                definitions === undefined
                    ? definitions
                    : Object.fromEntries(Object.entries(definitions).map(([id, definition]) => [id, stripOfNoise(definition)])),
            ...rest,
        }).filter(([, value]) => value !== undefined),
    );
};

for (const { inputTypeFilepath, inputTypeName, generatedFilepath, ruleName } of readRulesMetadata().rules) {
    const {
        schema,
        type: [schemaLibrary, schemaTypeName],
    } = createSchemaInstructions(inputTypeFilepath, inputTypeName);

    const typescriptFileContent = printNodes(
        createImportDeclaration(schemaLibrary, { type: true, from: null, to: schemaTypeName }),
        '',
        createConstStatement({
            name: 'schema',
            type: ts.factory.createTypeReferenceNode(schemaTypeName),
            value: ts.factory.createIdentifier(JSON.stringify(stripOfNoise(schema))),
        }),
        '',
        createConstStatement({ name: 'name', value: ts.factory.createStringLiteral(ruleName) }),
    );

    writeFileSync(generatedFilepath, typescriptFileContent);
}
