import * as Injector from 'typescript-injector-lite'
import { 
    Model, 
    Column, 
    Queryable, 
    QueryColunms,
    QueryableColunms, 
    QueryPartsStack, 
    QueryPart,
    QUERY_TOKENS
} from '../lib'

/**
 * 
 */
export class Query<T extends Model> extends Queryable<T> implements Queryable<T> {

    /**
     * 
     * @param modelType 
     */
    static select<T extends Model>(modelType: { new (): T; }): Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<QueryPart>()

        queryParts.push(
            new QueryPart(QUERY_TOKENS.SELECT, modelInst)
        )
        return new Query(modelInst.columns, queryParts);
    }
    /**
     * 
     * @param model 
     */
    static insert<T extends Model>(model:T): Queryable<T>  {
        let queryParts = new Array<QueryPart>()
        queryParts.push(
            new QueryPart(QUERY_TOKENS.INSERT, model)
        )
        return new Query(model.columns, queryParts);
    }
    /**
     * 
     * @param model 
     */
    static update<T extends Model>(model:T): Queryable<T>  {
        let queryParts = new Array<QueryPart>()
        queryParts.push(
            new QueryPart(QUERY_TOKENS.UPDATE, model)
        )
        return new Query(model.columns, queryParts);
    }
    /**
     * 
     * @param modelType 
     */
    static delete<T extends Model>(modelType: { new (): T; }): Queryable<T>  {
        let modelInst = new modelType(),
            queryParts = new Array<QueryPart>()
        queryParts.push(
            new QueryPart(QUERY_TOKENS.DELETE, modelInst.tableName)
        )
        return new Query(modelInst.columns, queryParts);
    }

    private constructor(
        protected columns: Array<Column>,
        protected _queryParts: Array<QueryPart>
    ){
        super(columns, _queryParts)
    }

}

