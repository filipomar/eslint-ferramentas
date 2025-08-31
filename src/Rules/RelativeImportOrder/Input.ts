import type { ArrayType, NonEmptyArray, OptionalAsRequired } from '../../utils';
import { type BaseRuleOptionInputTemplate, createBaseRuleOptionInputMapper } from '../Base';
import type { DebugRuleOption, DebugRuleOptionInput } from '../Debug';

type SortOptionInput<Name extends string, Input = Record<never, never>> = Readonly<{ type: Name } & Input>;

type GroupSortOptionInput = SortOptionInput<
    'group',
    {
        /**
         * Sort folders by their absolute path
         * Files in folders that are mentioned first will be at the top of the import list
         * @example ['src/foo', 'test/foo']
         */
        groups: NonEmptyArray<string>;

        /**
         * Ignore any particular paths
         * @example ['src/foo', 'test/foo']
         * @default []
         */
        ignore?: readonly string[];
    }
>;

/**
 * Files nested deeper in the file structure will be last
 */
type DepthSortOptionInput = SortOptionInput<'depth'>;

/**
 * Files will be sorted alphabetically by the full name
 */
type NameSortOptionInput = SortOptionInput<
    'name',
    {
        /**
         * If set to true, will sort alphabetically in ascending order
         * @default true
         */
        asc?: boolean;
    }
>;

type AllSortOptionsInput = GroupSortOptionInput | DepthSortOptionInput | NameSortOptionInput;

export type SortOptionsInputType = AllSortOptionsInput['type'];
export type SortOptionsInput<Name extends SortOptionsInputType = SortOptionsInputType> = Extract<AllSortOptionsInput, SortOptionInput<Name>>;

type SortInput = Readonly<{ sort: NonEmptyArray<SortOptionsInput> }>;
type SortOutput = Readonly<{ sort: NonEmptyArray<Required<SortOptionsInput>> }>;

export type OptionsInput = BaseRuleOptionInputTemplate<SortInput & DebugRuleOptionInput>;
export type Options = SortOutput & DebugRuleOption;

const sortDefaults: { [P in SortOptionsInputType]: OptionalAsRequired<SortOptionsInput<P>> } = { name: { asc: true }, group: { ignore: [] }, depth: {} };

export const mapSort = createBaseRuleOptionInputMapper<SortInput, SortOutput>(({ sort }) => ({
    sort: sort.map((s) => ({ ...sortDefaults[s.type], ...s })) as readonly ArrayType<Options['sort']>[] as Options['sort'],
}));
