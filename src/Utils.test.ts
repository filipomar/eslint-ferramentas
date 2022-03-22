import { extractImportPath, createDebugger } from './Utils';

describe(extractImportPath, () => {
    it('extracts path from import node if there is one', () => {
        expect(() => extractImportPath({
            type: 'ImportDeclaration',
            specifiers: [],
            source: {
                type: 'Literal',
                value: null,
            },
        })).toThrowError(new Error('Import path has unexpected value'));

        expect(
            extractImportPath({
                type: 'ImportDeclaration',
                specifiers: [],
                source: {
                    type: 'Literal',
                    value: 'src/path',
                },
            }),
        ).toBe('src/path');
    });
});

describe(createDebugger, () => {
    it('creates debugger function', () => {
        const debugSpy = jest.spyOn(console, 'debug').mockReturnValueOnce();

        const dontDebug = createDebugger(false);
        const debug = createDebugger(true);

        dontDebug('a', 'b', 'c');
        debug(1, 2, 3);

        expect(debugSpy).toBeCalledTimes(1);
        expect(debugSpy).nthCalledWith(1, 1, 2, 3);
    });
});
