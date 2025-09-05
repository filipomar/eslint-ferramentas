import { type BaseRuleOptionInputTemplate, createBaseRuleOptionInputMapper } from '../Base';
import type { DebugRuleOption, DebugRuleOptionInput } from '../Debug';

/**
 * The directory to forbid inputs from
 */
type DirectoryOption = Readonly<{
    /**
     * Regex pattern where the rules will apply
     * Needs to start from the root of the project
     * @example '^src/components'
     */
    filter: string;

    /**
     * Regex pattern of what will be forbidden with-in this directory
     * Needs to start from the root of the project
     * @default []
     * @example ['^src/graphql']
     */
    forbid: readonly string[];
}>;

type Directories = Readonly<{ directories: readonly DirectoryOption[] }>;

export type OptionsInput = BaseRuleOptionInputTemplate<Directories & DebugRuleOptionInput>;
export type Options = Directories & DebugRuleOption;

export const mapDirectories = createBaseRuleOptionInputMapper<Directories, Directories>(({ directories }) => ({ directories }));
