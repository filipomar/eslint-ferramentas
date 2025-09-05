import assert from 'assert';
import type { JSONSchema4 } from 'json-schema';
import type { AST, Rule, SourceCode } from 'eslint';
import type { BaseNodeWithoutComments, Comment, ImportDeclaration, Node, SourceLocation } from 'estree';
import { dirname, relative, resolve } from 'path';

import { type ArrayType, createDebugger, createExecuteOnce, type ReadonlyRecord } from '../utils';

export type BaseRuleOptionInputTemplate<T> = readonly [Readonly<T>];

export const createBaseRuleOptionInputMapper =
    <I, O>(mapper: (input: I) => O) =>
    ([input]: BaseRuleOptionInputTemplate<I>): O =>
        mapper(input);

const relativeToWorkingDirectory = (context: Rule.RuleContext, absolutePath: string): string => relative(context.cwd, absolutePath);

abstract class ExtendedNode<N extends Node = Node> {
    private readonly getFirstComment = createExecuteOnce((): Comment | null => this.sourceCode.getCommentsBefore(this.node)[0] ?? null);

    protected abstract readonly NodeConstructor: new (node: N, context: Rule.RuleContext) => ExtendedNode<N>;

    private static getProperty<Node extends BaseNodeWithoutComments, Prop extends keyof Node> (node: Node, property: Prop): Exclude<Node[Prop], undefined> {
        const value = node[property];

        assert(value !== undefined, `Expected property '${String(property)}' can not be undefined`);

        return value as Exclude<Node[Prop], undefined>;
    }

    private static sortPositions<P extends readonly SourceLocation[]> ([...positions]: P): P {
        return positions.sort(({ start: aStart }, { start: bStart }) => {
            let diff = 0;

            for (const prop of ['line', 'column'] as const) {
                diff = aStart[prop] - bStart[prop];
                if (diff !== 0) {
                    break;
                }
            }

            return diff;
        }) as unknown as P;
    }

    constructor (protected readonly node: N, protected readonly context: Rule.RuleContext) {}

    protected abstract get siblings (): readonly Node[];

    protected get sourceCode (): SourceCode {
        return this.context.sourceCode;
    }

    private getProperty<Prop extends keyof Comment & keyof N> (
        prop: Prop,
        withComments: boolean,
    ): readonly [Exclude<N[Prop], undefined>, Exclude<Comment[Prop], undefined> | null] {
        const nodeValue = ExtendedNode.getProperty(this.node, prop);

        if (!withComments) {
            return [nodeValue, null];
        }

        const firstComment = this.getFirstComment();

        return [nodeValue, firstComment === null ? null : ExtendedNode.getProperty(firstComment, prop)];
    }

    protected abstract isNode (node: Node): node is N;

    protected getPreviousSiblingWithSameTypeOrThrow (): ExtendedNode<N> {
        const { siblings } = this;

        const currentIndex = siblings.indexOf(this.node);

        const previousSibling: ArrayType<typeof siblings> | undefined = siblings[currentIndex - 1];
        assert(previousSibling !== undefined && this.isNode(previousSibling), 'Previous import declaration could not be found');

        return new this.NodeConstructor(previousSibling, this.context);
    }

    getLocation (withComments: boolean): SourceLocation {
        const [loc, commentLoc] = this.getProperty('loc', withComments);
        assert(loc !== null, 'Location was not expected to be null');
        return commentLoc === null ? loc : { ...loc, start: ExtendedNode.sortPositions([loc, commentLoc] as const)[0].start };
    }

    getRange (withComments: boolean): AST.Range {
        const [range, commentRange] = this.getProperty('range', withComments);
        return commentRange === null ? range : [commentRange[0], range[1]];
    }

    getRangeBetween<OtherNode extends Node> (destination: ExtendedNode<OtherNode>, withComments: boolean): AST.Range {
        const thisLocation = this.getLocation(withComments);
        const destinationLocation = destination.getLocation(withComments);

        const [first, second] = ExtendedNode.sortPositions([thisLocation, destinationLocation] as const);
        return [this.sourceCode.getIndexFromLoc(first.end), this.sourceCode.getIndexFromLoc(second.start)];
    }

    toString (withComments = true): string {
        let offset = 0;

        if (withComments) {
            const [startWithComments] = this.getRange(true);
            const [startWithoutComments] = this.getRange(false);

            offset = startWithoutComments - startWithComments;
        }

        return this.sourceCode.getText(this.node, offset);
    }
}

class ExtendedImportDeclaration extends ExtendedNode<ImportDeclaration> {
    protected readonly NodeConstructor = ExtendedImportDeclaration;

    private readonly getRawPath = createExecuteOnce(() => {
        const { value } = this.node.source;
        assert(typeof value === 'string', `Import path '${String(value)}' should be a string`);
        return value;
    });

    private readonly getPathFromWorkingDirectory = createExecuteOnce(() => {
        const absolutePath = resolve(dirname(this.context.filename), this.rawPath);
        return relativeToWorkingDirectory(this.context, absolutePath);
    });

    protected get siblings (): readonly Node[] {
        return this.sourceCode.ast.body;
    }

    get rawPath (): string {
        return this.getRawPath();
    }

    get pathFromWorkingDirectory (): string {
        return this.getPathFromWorkingDirectory();
    }

    protected isNode (node: Node): node is ImportDeclaration {
        return node.type === 'ImportDeclaration';
    }

    getPreviousSiblingWithSameTypeOrThrow (): ExtendedImportDeclaration {
        return super.getPreviousSiblingWithSameTypeOrThrow() as ExtendedImportDeclaration;
    }
}

export type { ExtendedImportDeclaration };

class RuleContextWrapper<OptionsInput, Options extends Readonly<{ debug: boolean }>, ErrorMessages extends string> {
    private readonly getOptions = createExecuteOnce(() => this.mapOptions(this.context.options as unknown as OptionsInput));

    private readonly createDebugger = createExecuteOnce(() => createDebugger(this.getOption('debug')));

    constructor (private readonly context: Rule.RuleContext, readonly ruleName: string, private readonly mapOptions: (input: OptionsInput) => Options) {}

    getRelativeFilename (): string {
        return relativeToWorkingDirectory(this.context, this.context.filename);
    }

    getImportDeclaration (node: ImportDeclaration): ExtendedImportDeclaration {
        return new ExtendedImportDeclaration(node, this.context);
    }

    getOption<K extends keyof Options> (name: K): Options[K] {
        return this.getOptions()[name];
    }

    debug (...values: readonly Readonly<{ toString: () => string }>[]): void {
        const debug = this.createDebugger();

        debug(...values.map((v) => v.toString()));
    }

    report (descriptor: Rule.ReportDescriptor & Readonly<{ messageId: ErrorMessages; loc: SourceLocation }>): void {
        this.context.report(descriptor);
    }
}

type Metadata<ErrorMessages extends string> = Rule.RuleMetaData &
    Readonly<{ schema: JSONSchema4; docs: Readonly<{ description: string }>; messages: ReadonlyRecord<ErrorMessages, string> }>;

export const createRule = <OptionsInput, Options extends Readonly<{ debug: boolean }>, ErrorMessages extends string>(
    { name, ...meta }: Metadata<ErrorMessages> & Readonly<{ name: string }>,
    mapOptions: (input: OptionsInput) => Options,
    create: (context: RuleContextWrapper<OptionsInput, Options, ErrorMessages>) => Rule.RuleListener,
): ReadonlyRecord<string, Rule.RuleModule & Readonly<{ meta: Metadata<ErrorMessages> }>> => ({
    [name]: {
        meta: { ...meta },
        create: (context) => {
            const contextWrapper = new RuleContextWrapper<OptionsInput, Options, ErrorMessages>(context, name, mapOptions);

            return create(contextWrapper);
        },
    },
});
