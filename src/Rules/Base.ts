import assert from 'assert';
import type { JSONSchema4 } from 'json-schema';
import type { AST, Rule, SourceCode } from 'eslint';
import type { ImportDeclaration, SourceLocation } from 'estree';
import { dirname, relative, resolve } from 'path';

import { createDebugger, createExecuteOnce, type ReadonlyRecord } from '../utils';

export type BaseRuleOptionInputTemplate<T> = readonly [Readonly<T>];

export const createBaseRuleOptionInputMapper =
    <I, O>(mapper: (input: I) => O) =>
    ([input]: BaseRuleOptionInputTemplate<I>): O =>
        mapper(input);

const relativeToWorkingDirectory = (context: Rule.RuleContext, absolutePath: string): string => relative(context.getCwd(), absolutePath);

export class ExtendedImportDeclaration {
    private readonly getRawPath = createExecuteOnce(() => {
        const { value } = this.node.source;
        assert(typeof value === 'string', `Import path '${String(value)}' should be a string`);
        return value;
    });

    private readonly getPathFromWorkingDirectory = createExecuteOnce(() => {
        const absolutePath = resolve(dirname(this.context.filename), this.rawPath);
        return relativeToWorkingDirectory(this.context, absolutePath);
    });

    constructor (readonly node: ImportDeclaration, private readonly context: Rule.RuleContext) {}

    get rawPath (): string {
        return this.getRawPath();
    }

    get pathFromWorkingDirectory (): string {
        return this.getPathFromWorkingDirectory();
    }

    get location (): SourceLocation {
        const { loc } = this.node;
        assert(loc, `Import path '${String(loc)}' should be truthy`);
        return loc;
    }

    toString (): string {
        return this.context.sourceCode.getText(this.node);
    }
}

class RuleContextWrapper<OptionsInput, Options extends Readonly<{ debug: boolean }>> {
    private readonly getOptions = createExecuteOnce(() => this.mapOptions(this.context.options as unknown as OptionsInput));

    private readonly createDebugger = createExecuteOnce(() => createDebugger(this.getOption('debug')));

    constructor (private readonly context: Rule.RuleContext, readonly ruleName: string, private readonly mapOptions: (input: OptionsInput) => Options) {}

    private get sourceCode (): SourceCode {
        return this.context.sourceCode;
    }

    getRelativeFilename (): string {
        return relativeToWorkingDirectory(this.context, this.context.filename);
    }

    getImportDeclaration (node: ImportDeclaration): ExtendedImportDeclaration {
        return new ExtendedImportDeclaration(node, this.context);
    }

    getImportDeclarations (): readonly ExtendedImportDeclaration[] {
        return this.sourceCode.ast.body
            .filter((node): node is ImportDeclaration => node.type === 'ImportDeclaration')
            .map((node) => this.getImportDeclaration(node));
    }

    getRangeBetween (from: ExtendedImportDeclaration, to: ExtendedImportDeclaration): AST.Range {
        return [this.sourceCode.getIndexFromLoc(from.location.end), this.sourceCode.getIndexFromLoc(to.location.start)];
    }

    getOption<K extends keyof Options> (name: K): Options[K] {
        return this.getOptions()[name];
    }

    debug (...values: readonly Readonly<{ toString: () => string }>[]): void {
        const debug = this.createDebugger();

        debug(...values.map((v) => v.toString()));
    }

    report (descriptor: Rule.ReportDescriptor): void {
        this.context.report(descriptor);
    }
}

type Metadata = Rule.RuleMetaData & Readonly<{ schema: JSONSchema4; docs: { description: string } }>;

export const createRule = <OptionsInput, Options extends Readonly<{ debug: boolean }>>(
    { name, ...meta }: Metadata & Readonly<{ name: string }>,
    mapOptions: (input: OptionsInput) => Options,
    create: (context: RuleContextWrapper<OptionsInput, Options>) => Rule.RuleListener,
): ReadonlyRecord<string, Rule.RuleModule & Readonly<{ meta: Metadata }>> => ({
    [name]: {
        meta: { ...meta },
        create: (context) => {
            const contextWrapper = new RuleContextWrapper<OptionsInput, Options>(context, name, mapOptions);

            return create(contextWrapper);
        },
    },
});
