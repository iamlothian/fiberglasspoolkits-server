import * as Injector from 'typescript-injector-lite'
import * as Lib from '../lib'

/**
 * 
 */
export class Query<T extends Lib.DTO.Model> extends Lib.Query.Queryable<T> implements Lib.Query.Queryable<T> {

    /**
     * 
     * @param modelType 
     */
    static select<T extends Lib.DTO.Model>(modelType: { new (): T; }): Lib.Query.Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<Lib.Query.QueryPart>()

        queryParts.push(
            new Lib.Query.QueryPart(Lib.Query.QUERY_TOKENS.SELECT, modelInst)
        )
        return new Query(modelInst.columns, queryParts);
    }
    /**
     * 
     * @param modelType 
     */
    static count<T extends Lib.DTO.Model>(modelType: { new (): T; }): Lib.Query.Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<Lib.Query.QueryPart>()

        queryParts.push(
            new Lib.Query.QueryPart(Lib.Query.QUERY_TOKENS.COUNT, modelInst)
        )
        return new Query(modelInst.columns, queryParts);
    }
    /**
     * 
     * @param Lib.DTO.Model 
     */
    static insert<T extends Lib.DTO.Model>(model:T): Lib.Query.Queryable<T>  {
        let queryParts = new Array<Lib.Query.QueryPart>()
        queryParts.push(
            new Lib.Query.QueryPart(Lib.Query.QUERY_TOKENS.INSERT, Lib.DTO.Model)
        )
        return new Query(model.columns, queryParts);
    }
    /**
     * 
     * @param Lib.DTO.Model 
     */
    static update<T extends Lib.DTO.Model>(model:T): Lib.Query.Queryable<T>  {
        let queryParts = new Array<Lib.Query.QueryPart>()
        queryParts.push(
            new Lib.Query.QueryPart(Lib.Query.QUERY_TOKENS.UPDATE, Lib.DTO.Model)
        )
        return new Query(model.columns, queryParts);
    }
    /**
     * 
     * @param modelType 
     */
    static delete<T extends Lib.DTO.Model>(modelType: { new (): T; }): Lib.Query.Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<Lib.Query.QueryPart>()
        queryParts.push(
            new Lib.Query.QueryPart(Lib.Query.QUERY_TOKENS.DELETE, modelInst.tableName)
        )
        return new Query(modelInst.columns, queryParts);
    }

    private constructor(
        protected columns: Array<Lib.DTO.Column>,
        protected _queryParts: Array<Lib.Query.QueryPart>
    ){
        super(columns, _queryParts)
    }

}

