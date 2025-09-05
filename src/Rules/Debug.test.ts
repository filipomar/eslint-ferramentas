import { mapDebugRuleOptionInput } from './Debug';

describe('mapDebugRuleOptionInput', () => {
    it('maps input and uses default', () => {
        expect(mapDebugRuleOptionInput([{}])).toStrictEqual<ReturnType<typeof mapDebugRuleOptionInput>>({ debug: false });
        expect(mapDebugRuleOptionInput([{ debug: true }])).toStrictEqual<ReturnType<typeof mapDebugRuleOptionInput>>({ debug: true });
    });
});
