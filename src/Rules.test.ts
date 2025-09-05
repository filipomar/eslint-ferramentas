import { RuleTester } from 'eslint';

import { rules } from '.';
import { getRuleTestCases } from './RulesTestCases';

const ruleTester = new RuleTester({ parserOptions: { ecmaVersion: 2015, sourceType: 'module' } });

for (const [ruleName, rule] of Object.entries(rules)) {
    const ruleTestcases = getRuleTestCases(ruleName);

    ruleTester.run(ruleName, rule, { valid: [...ruleTestcases.valid], invalid: [...ruleTestcases.invalid] });
}
