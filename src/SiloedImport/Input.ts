type DirectoryOption = Readonly<{ filter: string; forbid: string[] }>;
export type Options = Readonly<{ directories: DirectoryOption[]; isRelative: RegExp; debug: boolean }>;

export type OptionsInput = Readonly<{
    /**
     * The dictories to forbid inputs from
     */
    directories: Readonly<{
        /**
         * Regex pattern where the rules will apply
         * Needs to start from the root of the project
         * @example '^src/components'
         */
        filter: DirectoryOption['filter'];

        /**
         * Regex pattern of what will be forbidden with-in this directory
         * Needs to start from the root of the project
         * @default {[]}
         * @example {['^src/graphql']}
         */
        forbid: DirectoryOption['forbid'];
    }>[];

    /**
     * The regex pattern used to validate if an import is relevat or not
     * @see {RELATIVE_IMPORT_PATTERN}
     */
    isRelative?: Options['isRelative']['source'];

    /**
     * Activates console.debug calls for relevant variables
     */
    debug?: Options['debug'];
}>;
