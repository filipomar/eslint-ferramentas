import type { JSONSchema4 } from 'json-schema';

export const schema: JSONSchema4 = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            groups: {
                allOf: [
                    { type: 'array', items: { type: 'string' }, minItems: 1 },
                    { type: 'array', items: { type: 'string' } },
                ],
            },
            debug: { type: 'boolean' },
        },
        additionalProperties: false,
        required: ['groups'],
    },
    minItems: 1,
    maxItems: 1,
    definitions: {},
};

export const name = 'import-spaces';
