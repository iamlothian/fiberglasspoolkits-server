import { Model, Column } from './model'

interface QueryableColunmsConstructor {
    constructor(
        columns: Array<Column>,
        queryStack:Array<QueryableConditionsStack>
    ): QueryableColunms
}
export interface QueryableColunms {
    column(columnName:string): QueryableOperands
}

interface QueryableOperandsConstructor {
    constructor(
        column:Column, 
        columns: Array<Column>,
        queryStack:Array<QueryableConditionsStack>
    ): QueryableOperands
}
export interface QueryableOperands {
    equals(value:string|number): QueryableConditionsStack
    notEqals(value:string|number): QueryableConditionsStack 
    gt(value:string|number): QueryableConditionsStack
    gte(value:string|number): QueryableConditionsStack 
    lt(value:string|number): QueryableConditionsStack 
    lte(value:string|number): QueryableConditionsStack
    in(values:Array<string|number>): QueryableConditionsStack
}

interface QueryableConditionsStackConstructor {
    constructor(
        columns: Array<Column>, 
        queryStack:Array<QueryableConditionsStack>
    ): QueryableConditionsStack
}
export interface QueryableConditionsStack {
    and(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack)
    or(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack)
    getStack(): Array<QueryableCondition>
}

export interface QueryableCondition {
    column:string
    operand:string
    value:any
}

export interface Datastore {
    
    query(queryText:string, value:Array<any>): Promise<any>

    insert<T extends Model>(model:T) : Promise<T>

    execute<T extends Model>(type: { new(): T; }, query:Queryable<T>) : Promise<Array<T>>

}

interface QueryableConstructor<T extends Model> {
    constructor(modelType: { new(): T; }): Queryable<T>
}
export interface Queryable<T extends Model> {
    where(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack)
    and(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack)
    or(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack)
    not(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack)
    condition(logic:'WHERE'|'AND'|'OR'|'NOT', conditionFunction:(table:QueryableColunms) => QueryableConditionsStack): Queryable<T>
    toQuery(): { queryText:string, value:Array<any> }
}