import { createDebugger, createExecuteOnce, isPathRelative } from './utils';

describe(createExecuteOnce, () => {
    it('caches value on the first execution', async () => {
        const mock = jest.fn();

        const executeFirst = createExecuteOnce(mock.mockReturnValueOnce(1));
        expect(executeFirst()).toBe(1);

        const executeSecond = createExecuteOnce(
            mock.mockImplementationOnce(() => {
                throw new Error('I am error');
            }),
        );
        await expect(async () => executeSecond()).rejects.toThrowError(new Error('I am error'));

        expect(mock).toBeCalledTimes(2);
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

describe(isPathRelative, () => {
    it('detects path relativiness', () => {
        expect(isPathRelative('module')).toBe(false);
        expect(isPathRelative('.')).toBe(true);
        expect(isPathRelative('..')).toBe(true);
        expect(isPathRelative('./file')).toBe(true);
        expect(isPathRelative('../file')).toBe(true);
        expect(isPathRelative('./')).toBe(true);
        expect(isPathRelative('../')).toBe(true);
    });
});
