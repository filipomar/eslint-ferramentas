import { ruleName as relativeImportOrderRuleName, rule as relativeImportOrderRule } from './RelativeImportOrder';
import { ruleName as siloedImportRuleName, rule as siloedImportRule } from './SiloedImport';

export const rules = {
    [siloedImportRuleName]: siloedImportRule,
    [relativeImportOrderRuleName]: relativeImportOrderRule,
};
