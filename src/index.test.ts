import { rules } from '.';

describe('rules', () => {
    it('exports two rules', () => {
        expect(Object.keys(rules).sort()).toStrictEqual(['relative-import-order', 'siloed-import']);
    });
});
