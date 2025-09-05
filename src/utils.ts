import { sep } from 'path';

/** Extract type of array */
export type ArrayType<T extends readonly unknown[]> = T extends readonly (infer U)[] ? U : never;

/** Create readonly non empty array of the given type */
export type NonEmptyArray<T> = readonly [T, ...T[]] & readonly T[];

/** Create readonly ecord of the given type */
export type ReadonlyRecord<K extends keyof any, T> = Readonly<Record<K, T>>;

/** Create tupple of the given type */
export type Tupple<T> = readonly [a: T, b: T];

/** Lists Optional keys of the given type */
// eslint-disable-next-line @typescript-eslint/ban-types
type OptionalKeys<T> = { [K in keyof T]-?: {} extends Pick<T, K> ? K : never }[keyof T];

/** Lists the optional value (and only the optional values) as required values */
export type OptionalAsRequired<T> = Required<Pick<T, OptionalKeys<T>>>;

export const createExecuteOnce = <T>(valueGenerator: () => T): typeof valueGenerator => {
    let aux: Readonly<{ value: T; error: false }> | Readonly<{ value: unknown; error: true }> | null = null;

    return () => {
        if (aux === null) {
            try {
                aux = { value: valueGenerator(), error: false };
            } catch (error: unknown) {
                aux = { value: error, error: true };
            }
        }

        if (aux.error) {
            throw aux.value;
        }

        return aux.value;
    };
};

export const createDebugger = (debugging: boolean): Console['debug'] => {
    if (!debugging) {
        return () => {};
    }

    // eslint-disable-next-line no-console
    return (...args) => {
        console.debug(...args);
    };
};

/**
 * Based on the node implementation
 * @see https://github.com/nodejs/node/blob/main/lib/internal/modules/cjs/loader.js#L1956C10-L1956C20
 */
const isPathRelativePattern = new RegExp(`^(\\.\\.{0,1}|\\.\\.{0,1}\\${sep}.*)$`);
export const isPathRelative = (path: string): boolean => isPathRelativePattern.test(path);
