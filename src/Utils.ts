import type { ImportDeclaration } from 'estree';

export const RELATIVE_IMPORT_PATTERN = '^\\..*';

export const extractImportPath = ({ source: { value } }: ImportDeclaration): string => {
    if (typeof value !== 'string') {
        throw new Error('Import path has unexpected value');
    }

    return value;
};

export const createDebugger = (debugging: boolean): Console['debug'] => {
    if (!debugging) {
        return () => {};
    }

    // eslint-disable-next-line no-console
    return (...args) => console.debug(...args);
};
