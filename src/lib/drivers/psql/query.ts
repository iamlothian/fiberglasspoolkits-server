import {DTO, Queryable} from '../../orm'
import * as Recipes from './queryRecipes'

/**
 * 
 */
export class QueryColumn implements Queryable.ColumnSelection{
    constructor(
        private model: DTO.Model, 
        private queryStack:Array<Queryable.QueryRecipe> = []
    ) {}
    column(columnName:string): Queryable.OperandsSelection {
        let column:DTO.Column = this.model.columns.find((c) => c.property === columnName)
        if(column === undefined){
            throw new Error('No property found matching:'+column)
        }
        return new QueryOperand(
            column, 
            this.model, 
            this.queryStack
        )
    }
}

/**
 * 
 */
export class QueryOperand implements Queryable.OperandsSelection {
    constructor(
        private column:DTO.Column, 
        private model: DTO.Model, 
        private queryStack:Array<Queryable.QueryRecipe>
    ){}
    equals(value: string | number): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.Equals(this.model.tableName, this.column, value))
        return new QueryTerminator(this.model, this.queryStack)
    }
    notEqals(value: string | number): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.NotEquals(this.model.tableName, this.column, value))
        return new QueryTerminator(this.model, this.queryStack)
    }
    gt(value: string | number): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.GreaterThan(this.model.tableName, this.column, value))
        return new QueryTerminator(this.model, this.queryStack)
    }
    gte(value: string | number): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.GreaterThanEqual(this.model.tableName, this.column, value))
        return new QueryTerminator(this.model, this.queryStack)
    }
    lt(value: string | number): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.LessThan(this.model.tableName, this.column, value))
        return new QueryTerminator(this.model, this.queryStack)
    }
    lte(value: string | number): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.LessThanEqual(this.model.tableName, this.column, value))
        return new QueryTerminator(this.model, this.queryStack)
    }
    in(values: (string | number)[]): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.In(this.model.tableName, this.column, values))
        return new QueryTerminator(this.model, this.queryStack)
    }
    notNull(): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.NotNull(this.model.tableName, this.column))
        return new QueryTerminator(this.model, this.queryStack)
    }
    isNull(): Queryable.TerminatorSelection {
        this.queryStack.push( new Recipes.IsNull(this.model.tableName, this.column))
        return new QueryTerminator(this.model, this.queryStack)
    }
}

/**
 * 
 */
export class QueryTerminator implements Queryable.TerminatorSelection {
    
    constructor(
        private model: DTO.Model, 
        private queryStack:Array<Queryable.QueryRecipe> = [],
    ){}
    and(conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection){
        this.queryStack.push(new Recipes.And())
        return conditionFunction(
            new QueryColumn(this.model, this.queryStack)
        )
    }
    or(conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection){
        this.queryStack.push(new Recipes.Or())
        return conditionFunction(
            new QueryColumn(this.model, this.queryStack)
        )
    }
    getStack(): Array<Queryable.QueryRecipe> {
        return this.queryStack
    }
}

/**
 * 
 */
export class Query<T extends DTO.Model> extends Queryable.Queryable<T> implements Queryable.Queryable<T> {

    private constructor(
        protected model: DTO.Model,
        protected _queryParts: Array<Queryable.QueryRecipe>
    ){
        super()
    }

    /**
     * 
     * @param modelType 
     */
    static select<T extends DTO.Model>(modelType: { new (): T; }): Queryable.Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<Queryable.QueryRecipe>()

        queryParts.push(
            new Recipes.Select(modelInst)
        )
        return new Query(modelInst, queryParts);
    }

     /**
     * 
     * @param modelType 
     */
    static count<T extends DTO.Model>(modelType: { new (): T; }): Queryable.Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<Queryable.QueryRecipe>()

        queryParts.push(
            new Recipes.Count(modelInst)
        )
        return new Query(modelInst, queryParts);
    }
    /**
     * 
     * @param Lib.DTO.Model 
     */
    static insert<T extends DTO.Model>(model:T): Queryable.Queryable<T>  {
        let queryParts = new Array<Queryable.QueryRecipe>()
        queryParts.push(
            new Recipes.Insert(model)
        )
        return new Query(model, queryParts);
    }
    /**
     * 
     * @param Lib.DTO.Model 
     */
    static update<T extends DTO.Model>(model:T): Queryable.Queryable<T>  {
        let queryParts = new Array<Queryable.QueryRecipe>()
        queryParts.push(
            new Recipes.Update(model)
        )
        return new Query(model, queryParts);
    }
    /**
     * 
     * @param modelType 
     */
    static delete<T extends DTO.Model>(modelType: { new (): T; }): Queryable.Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<Queryable.QueryRecipe>()
        queryParts.push(
            new Recipes.Delete(modelInst)
        )
        return new Query(modelInst, queryParts);
    }
    
    where(conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection): Queryable.Queryable<T>{
        return this.condition('WHERE', conditionFunction)
    }
    and(conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection): Queryable.Queryable<T>{
        return this.condition('AND', conditionFunction)
    }
    or(conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection): Queryable.Queryable<T>{
        return this.condition('OR', conditionFunction)
    }
    not(conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection): Queryable.Queryable<T>{
        return this.condition('NOT', conditionFunction)
    }
    orderBy(orderByColumns:Array<[string, 'ASC'|'DESC']>): Queryable.Queryable<T>{
        this._queryParts.push(
            new Recipes.OrderBy(
                orderByColumns.map(c=>this.model.columns.find(v=>v.property === c[0])), 
                orderByColumns.map(c=>c[1]))
        )
        return this
    }
    limit(limit:number): Queryable.Queryable<T>{
        this._queryParts.push(new Recipes.Limit(limit))
        return this
    }

    private condition(logic:string, conditionFunction:(table:Queryable.ColumnSelection) => Queryable.TerminatorSelection): Queryable.Queryable<T> {
        this._queryParts.push(new Recipes.Token(logic))
        this._queryParts.push(new Recipes.Token('('))
        let parts:Array<Queryable.QueryRecipe> = conditionFunction(
            new QueryColumn(this.model)
        ).getStack();
        this._queryParts = this._queryParts.concat(parts);
        this._queryParts.push(new Recipes.Token(')'))
        return this
    }

    getQueryStack(): Array<Queryable.QueryRecipe> {
        return this._queryParts
    }

}

