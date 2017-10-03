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

export interface TokenRecipe extends QueryRecipe { token:string }
export interface AndRecipe extends TokenRecipe {}
export interface OrRecipe extends TokenRecipe {}


export interface ColumnSelection {
    column(columnName: string): OperandsSelection
}

export interface OperandsSelection {
    equals(value: string | number): TerminatorSelection
    notEqals(value: string | number): TerminatorSelection
    gt(value: string | number): TerminatorSelection
    gte(value: string | number): TerminatorSelection
    lt(value: string | number): TerminatorSelection
    lte(value: string | number): TerminatorSelection
    in(values: Array<string | number>): TerminatorSelection
    notNull(): TerminatorSelection
    isNull(): TerminatorSelection
}


export interface TerminatorSelection {
    and(conditionFunction: (table: ColumnSelection) => TerminatorSelection)
    or(conditionFunction: (table: ColumnSelection) => TerminatorSelection)
    getStack(): Array<QueryRecipe>
}


export interface Queryable<T extends Model>{
    where(conditionFunction:(table:ColumnSelection) => TerminatorSelection): Queryable<T>
    and(conditionFunction:(table:ColumnSelection) => TerminatorSelection): Queryable<T>
    or(conditionFunction:(table:ColumnSelection) => TerminatorSelection): Queryable<T>
    not(conditionFunction:(table:ColumnSelection) => TerminatorSelection): Queryable<T>
    orderBy(...args:any[]): Queryable<T>
    limit(limit:number): Queryable<T>
    getQueryStack():Array<QueryRecipe>
}

export abstract class Queryable<T extends Model> {

    static select<T extends Model>(modelType: { new(): T; }): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static count<T extends Model>(modelType: { new(): T; }): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static insert<T extends Model>(model: T): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static update<T extends Model>(model:T): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static delete<T extends Model>(modelType: { new (): T; }, id:number): Queryable<T> { throw new Error("Method not implemented in child class."); }

}