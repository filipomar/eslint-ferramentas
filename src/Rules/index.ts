import type { ArrayType } from '../utils';
import { type OptionsInput as ImportSpacesOptionsInput, rule as importSpacesRule } from './ImportSpaces';
import { type OptionsInput as RelativeImportOrderOptionsInput, rule as relativeImportOrderRule } from './RelativeImportOrder';
import { type OptionsInput as SiloedRelativeImportOptionsInput, rule as siloedRelativeImportRule } from './SiloedRelativeImport';

export type Options = Readonly<{
    'import-spaces': ArrayType<ImportSpacesOptionsInput>;
    'relative-import-order': ArrayType<RelativeImportOrderOptionsInput>;
    'siloed-relative-import': ArrayType<SiloedRelativeImportOptionsInput>;
}>;

export const rules = { ...importSpacesRule, ...relativeImportOrderRule, ...siloedRelativeImportRule };
