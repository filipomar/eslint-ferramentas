module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: ['standard-with-typescript'],
    parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: 'tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    rules: {
        'sort-imports': ['error', { ignoreCase: true, ignoreDeclarationSort: true }],
        'import/order': [
            'error',
            {
                groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
                'newlines-between': 'always-and-inside-groups',
            },
        ],
        'import/newline-after-import': ['error', { count: 1 }],

        /** General rules */
        indent: 'off',
        /** @see https://github.com/typescript-eslint/typescript-eslint/issues/1824 */
        '@typescript-eslint/indent': 'off',
        '@typescript-eslint/array-type': 'off',
        'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
        'no-trailing-spaces': 'error',
        'space-before-function-paren': ['error', 'always'],
        '@typescript-eslint/comma-dangle': [
            'error',
            {
                arrays: 'only-multiline',
                tuples: 'only-multiline',
                enums: 'only-multiline',
                generics: 'only-multiline',
                objects: 'only-multiline',
                imports: 'only-multiline',
                exports: 'only-multiline',
                functions: 'only-multiline',
            },
        ],
        '@typescript-eslint/member-delimiter-style': [
            'error',
            {
                multiline: { delimiter: 'semi', requireLast: true },
                singleline: { delimiter: 'semi', requireLast: false },
                multilineDetection: 'brackets',
            },
        ],
        '@typescript-eslint/member-ordering': [
            'error',
            {
                default: [
                    // Index signature
                    'signature',

                    // Fields
                    'field',

                    'private-static-method',
                    'protected-static-method',
                    'public-static-method',

                    // Constructors
                    'constructor',

                    // Getters and Setters at the same rank
                    ['get', 'set'],

                    // Methods
                    'private-method',
                    'protected-method',
                    'public-method',
                ],
            },
        ],
        '@typescript-eslint/semi': ['error', 'always'],
    },
};
