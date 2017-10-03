import { Model, Column } from './model'

export interface QueryRecipe {
    
    table:string
    columns:Array<string>
    values:Array<string>

    bake(valueCount:number):any
    
}
/* Place holders for required recipies */
export interface OperandRecipe extends QueryRecipe { operand:string }
export interface EqualsRecipe extends OperandRecipe {}
export interface NotEqualsRecipe extends OperandRecipe {}
export interface GreaterThanRecipe extends OperandRecipe {}
export interface GreaterThanEqualRecipe extends OperandRecipe {}
export interface LessThanRecipe extends OperandRecipe {}
export interface LessThanEqualRecipe extends OperandRecipe {}
export interface InRecipe extends OperandRecipe {}
export interface NotNullRecipe extends QueryRecipe {}
export interface IsNullRecipe extends QueryRecipe {}

export interface SelectRecipe extends QueryRecipe {}
export interface CountRecipe extends QueryRecipe {}
export interface UpdateRecipe extends QueryRecipe {}
export interface InsertRecipe extends QueryRecipe {}
export interface DeleteRecipe extends QueryRecipe {}
export interface OrderByRecipe extends QueryRecipe {}
export interface LimitRecipe extends QueryRecipe {}

/**
 * Common keywords and tokens used in building queries
 */
export enum QUERY_TOKENS { 
    SELECT,
    COUNT,
    UPDATE,
    INSERT,
    DELETE,
    ORDER_BY,
    LIMIT,
    JOIN,
    WHERE,
    AND,
    OR,
    NOT,
    OPEN_GROUP,
    CLOSE_GROUP,
    EQUALS, 
    NOT_EQUALS, 
    GREATER_THAN, 
    GREATER_THAN_EQUAL, 
    LESS_THAN, 
    LESS_THAN_EQUAL, 
    IN,
    NOT_NULL,
    IS_NULL
}

export interface QueryableColunms {
    column(columnName: string): QueryableOperands
}
/**
 * 
 */
export class QueryColunms implements QueryableColunms{
    constructor(
        private columns: Array<Column>, 
        private queryStack:Array<QueryPart> = []
    ) {}
    column(columnName:string): QueryableOperands {
        let column:Column = this.columns.find((c) => c.property === columnName)
        if(column === undefined){
            throw new Error('No property found matching:'+column)
        }
        return new QueryOperands(
            column.name, 
            this.columns, 
            this.queryStack
        )
    }
}

export interface QueryableOperands {
    equals(value: string | number): QueryPartsStack
    notEqals(value: string | number): QueryPartsStack
    gt(value: string | number): QueryPartsStack
    gte(value: string | number): QueryPartsStack
    lt(value: string | number): QueryPartsStack
    lte(value: string | number): QueryPartsStack
    in(values: Array<string | number>): QueryPartsStack
    notNull(): QueryPartsStack
    isNull(): QueryPartsStack
}
/**
 * 
 */
export class QueryOperands implements QueryableOperands {
    constructor(
        private column:string, 
        private columns: Array<Column>,
        private queryStack:Array<QueryPart>
    ){}

    construct(operand:QUERY_TOKENS, value:string|number|Array<string|number> = undefined): QueryPartsStack {
        this.queryStack.push(
            new QueryPart(operand, this.column, value)
        )
        return new QueryConditionsStack(
            this.columns,
            this.queryStack
        )
    }
    equals(value:string|number): QueryPartsStack { return this.construct(QUERY_TOKENS.EQUALS,value) }
    notEqals(value:string|number): QueryPartsStack { return this.construct(QUERY_TOKENS.NOT_EQUALS,value) }
    gt(value:string|number): QueryPartsStack { return this.construct(QUERY_TOKENS.GREATER_THAN,value) }
    gte(value:string|number): QueryPartsStack { return this.construct(QUERY_TOKENS.GREATER_THAN_EQUAL,value) }
    lt(value:string|number): QueryPartsStack { return this.construct(QUERY_TOKENS.LESS_THAN,value) }
    lte(value:string|number): QueryPartsStack { return this.construct(QUERY_TOKENS.LESS_THAN_EQUAL,value) }
    in(values:Array<string|number>): QueryPartsStack { return this.construct(QUERY_TOKENS.IN,values) }
    notNull(): QueryPartsStack { return this.construct(QUERY_TOKENS.NOT_NULL) }
    isNull(): QueryPartsStack { return this.construct(QUERY_TOKENS.IS_NULL) }
}

export interface QueryPartsStack {
    and(conditionFunction: (table: QueryableColunms) => QueryPartsStack)
    or(conditionFunction: (table: QueryableColunms) => QueryPartsStack)
    getStack(): Array<QueryPart>
}
/**
 * 
 */
export class QueryConditionsStack implements QueryPartsStack {
    
    constructor(
        private columns: Array<Column> = [],
        private queryStack:Array<QueryPart> = [],
    ){}
    and(conditionFunction:(table:QueryableColunms) => QueryPartsStack){
        this.queryStack.push(new QueryPart(QUERY_TOKENS.AND))
        return conditionFunction(
            new QueryColunms(this.columns, this.queryStack)
        )
    }
    or(conditionFunction:(table:QueryableColunms) => QueryPartsStack){
        this.queryStack.push(new QueryPart(QUERY_TOKENS.OR))
        return conditionFunction(
            new QueryColunms(this.columns, this.queryStack)
        )
    }
    getStack(): Array<QueryPart> {
        return this.queryStack
    }
}

/**
 * 
 */
export class QueryPart {
    /**
     * 
     * @param operation The operation this part represents
     * @param target The target of the operation
     * @param value Optional values intended for use in comparison operations
     */
    constructor(
        public operation: QUERY_TOKENS,
        public target: any = undefined,
        public value: any = undefined
    ){}
}

export enum ORDER_BY_DIRECTION { ACS, DESC }
export class OrderByField {
    constructor(
        public column:string,
        public direction:ORDER_BY_DIRECTION = ORDER_BY_DIRECTION.ACS
    ){}
}

/**
 * 
 */
export abstract class Queryable<T extends Model> {

    constructor(
        protected columns: Array<Column>,
        protected _queryParts: Array<QueryPart>
    ){}

    static select<T extends Model>(modelType: { new(): T; }): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static count<T extends Model>(modelType: { new(): T; }): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static insert<T extends Model>(model: T): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static update<T extends Model>(model:T): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static delete<T extends Model>(modelType: { new (): T; }, id:number): Queryable<T> { throw new Error("Method not implemented in child class."); }

    where(conditionFunction:(table:QueryableColunms) => QueryPartsStack){
        return this.condition(QUERY_TOKENS.WHERE, conditionFunction)
    }
    and(conditionFunction:(table:QueryableColunms) => QueryPartsStack){
        return this.condition(QUERY_TOKENS.AND, conditionFunction)
    }
    or(conditionFunction:(table:QueryableColunms) => QueryPartsStack){
        return this.condition(QUERY_TOKENS.OR, conditionFunction)
    }
    not(conditionFunction:(table:QueryableColunms) => QueryPartsStack){
        return this.condition(QUERY_TOKENS.NOT, conditionFunction)
    }
    orderBy(orderByColumns:Array<OrderByField>){
        orderByColumns.forEach(c=>{
            let column:Column = this.columns.find(v=>v.property === c.column)
            if(column === undefined){
                throw new Error('No property found matching:'+c.column)
            }
            c.column = column.name
        })
        this._queryParts.push(new QueryPart(QUERY_TOKENS.ORDER_BY, orderByColumns))
        return this
    }
    limit(limit:number){
        this._queryParts.push(new QueryPart(QUERY_TOKENS.LIMIT, limit))
        return this
    }
    private condition(logic:QUERY_TOKENS, conditionFunction:(table:QueryableColunms) => QueryPartsStack): Queryable<T> {

        this._queryParts.push(new QueryPart(logic))
        this._queryParts.push(new QueryPart(QUERY_TOKENS.OPEN_GROUP))

        let _queryParts:Array<QueryPart> = conditionFunction(
            new QueryColunms(this.columns)
        ).getStack();

        this._queryParts = this._queryParts.concat(_queryParts);
        this._queryParts.push(new QueryPart(QUERY_TOKENS.CLOSE_GROUP))

        return this 
    }

    get queryParts() {
        return this._queryParts
    }
}