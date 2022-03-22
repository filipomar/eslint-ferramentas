export type Options = Readonly<{ ignore: string[]; directories: string[]; isRelative: RegExp; debug: boolean }>;

export type OptionsInput = Readonly<{
    /**
     * The import order the relative directories must follow
     */
    directories: Options['directories'];

    /**
     * The relative imported paths whose order can be ignored
     *
     * @default {[]}
     */
    ignore?: Options['ignore'];

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
