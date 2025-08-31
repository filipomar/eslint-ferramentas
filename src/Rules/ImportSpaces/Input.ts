import type { NonEmptyArray } from '../../utils';
import { type BaseRuleOptionInputTemplate, createBaseRuleOptionInputMapper } from '../Base';
import type { DebugRuleOption, DebugRuleOptionInput } from '../Debug';

type GroupsInput = Readonly<{
    /**
     * Each import pair, if belonging to different groups, will be required to have a space between them
     * @example ['^src/utils.*$', '^(src/infrastructure.*|package.json)$']
     */
    groups: NonEmptyArray<string>;
}>;

type GroupsOutput = Readonly<{ groups: NonEmptyArray<RegExp> }>;

export type OptionsInput = BaseRuleOptionInputTemplate<GroupsInput & DebugRuleOptionInput>;
export type Options = GroupsOutput & DebugRuleOption;

export const mapGroups = createBaseRuleOptionInputMapper<GroupsInput, GroupsOutput>(({ groups }) => ({
    groups: groups.map((pattern) => new RegExp(pattern)) as readonly RegExp[] as NonEmptyArray<RegExp>,
}));
