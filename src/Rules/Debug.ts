import type { OptionalAsRequired } from '../utils';
import { createBaseRuleOptionInputMapper } from './Base';

export type DebugRuleOptionInput = Readonly<{
    /**
     * Activates console.debug calls for relevant variables
     * @default false
     */
    debug?: boolean;
}>;

export type DebugRuleOption = Required<DebugRuleOptionInput>;

const defaultValues: OptionalAsRequired<DebugRuleOptionInput> = { debug: false };

export const mapDebugRuleOptionInput = createBaseRuleOptionInputMapper<DebugRuleOptionInput, DebugRuleOption>((options) => ({
    debug: { ...defaultValues, ...options }.debug,
}));
