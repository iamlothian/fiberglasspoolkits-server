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


export interface ColumnSelection<M extends Model> {
    column(columnName: keyof M): OperandsSelection<M>
}

export interface OperandsSelection<M extends Model> {
    equals(value: string | number): TerminatorSelection<M>
    notEqals(value: string | number): TerminatorSelection<M>
    gt(value: string | number): TerminatorSelection<M>
    gte(value: string | number): TerminatorSelection<M>
    lt(value: string | number): TerminatorSelection<M>
    lte(value: string | number): TerminatorSelection<M>
    in(values: Array<string | number>): TerminatorSelection<M>
    notNull(): TerminatorSelection<M>
    isNull(): TerminatorSelection<M>
}


export interface TerminatorSelection<M extends Model> {
    and(conditionFunction: (table: ColumnSelection<M>) => TerminatorSelection<M>)
    or(conditionFunction: (table: ColumnSelection<M>) => TerminatorSelection<M>)
    getStack(): Array<QueryRecipe>
}


export interface Queryable<M extends Model>{
    where(conditionFunction:(table:ColumnSelection<M>) => TerminatorSelection<M>): Queryable<M>
    and(conditionFunction:(table:ColumnSelection<M>) => TerminatorSelection<M>): Queryable<M>
    or(conditionFunction:(table:ColumnSelection<M>) => TerminatorSelection<M>): Queryable<M>
    not(conditionFunction:(table:ColumnSelection<M>) => TerminatorSelection<M>): Queryable<M>
    orderBy(...args:any[]): Queryable<M>
    limit(limit:number): Queryable<M>
    getQueryStack():Array<QueryRecipe>
}

export abstract class Queryable<M extends Model> {

    static select<T extends Model>(modelType: { new(): T; }): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static count<T extends Model>(modelType: { new(): T; }): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static insert<T extends Model>(model: T): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static update<T extends Model>(model:T): Queryable<T> { throw new Error("Method not implemented in child class."); }
    static delete<T extends Model>(modelType: { new (): T; }, id:number): Queryable<T> { throw new Error("Method not implemented in child class."); }

}