import type { JSONSchema4 } from 'json-schema';

export const schema: JSONSchema4 = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            sort: {
                allOf: [
                    {
                        type: 'array',
                        items: {
                            anyOf: [
                                {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', const: 'group' },
                                        groups: {
                                            allOf: [
                                                { type: 'array', items: { type: 'string' }, minItems: 1 },
                                                { type: 'array', items: { type: 'string' } },
                                            ],
                                        },
                                        ignore: { type: 'array', items: { type: 'string' } },
                                    },
                                    additionalProperties: false,
                                    required: ['type', 'groups'],
                                },
                                { type: 'object', properties: { type: { type: 'string', const: 'depth' } }, additionalProperties: false, required: ['type'] },
                                {
                                    type: 'object',
                                    properties: { type: { type: 'string', const: 'name' }, asc: { type: 'boolean' } },
                                    additionalProperties: false,
                                    required: ['type'],
                                },
                            ],
                        },
                        minItems: 1,
                    },
                    {
                        type: 'array',
                        items: {
                            anyOf: [
                                {
                                    type: 'object',
                                    properties: {
                                        type: { type: 'string', const: 'group' },
                                        groups: {
                                            allOf: [
                                                { type: 'array', items: { type: 'string' }, minItems: 1 },
                                                { type: 'array', items: { type: 'string' } },
                                            ],
                                        },
                                        ignore: { type: 'array', items: { type: 'string' } },
                                    },
                                    additionalProperties: false,
                                    required: ['type', 'groups'],
                                },
                                { type: 'object', properties: { type: { type: 'string', const: 'depth' } }, additionalProperties: false, required: ['type'] },
                                {
                                    type: 'object',
                                    properties: { type: { type: 'string', const: 'name' }, asc: { type: 'boolean' } },
                                    additionalProperties: false,
                                    required: ['type'],
                                },
                            ],
                        },
                    },
                ],
            },
            debug: { type: 'boolean' },
        },
        additionalProperties: false,
        required: ['sort'],
    },
    minItems: 1,
    maxItems: 1,
    definitions: {},
};

export const name = 'relative-import-order';
