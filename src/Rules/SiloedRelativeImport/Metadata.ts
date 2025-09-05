import type { JSONSchema4 } from 'json-schema';

export const schema: JSONSchema4 = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            directories: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: { filter: { type: 'string' }, forbid: { type: 'array', items: { type: 'string' } } },
                    additionalProperties: false,
                    required: ['filter', 'forbid'],
                },
            },
            debug: { type: 'boolean' },
        },
        additionalProperties: false,
        required: ['directories'],
    },
    minItems: 1,
    maxItems: 1,
    definitions: {},
};

export const name = 'siloed-relative-import';
