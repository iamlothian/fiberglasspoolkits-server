import { Model, Column } from '../model'
import { Queryable, InsertQueryable, QUERY_OPERATION } from './queryable'
import { OmitModelMeta } from './common'

export class QueryBuilder {

    constructor(){}

    select<T extends Model>(
        from:(from)=> { new():T },
        as:(as) => string = (n)=>n,
        columns:(columns) => Array<keyof OmitModelMeta<T>> | '*' = ()=>'*'
    ): Queryable<T> {

        let model = new (from(null))(),
            alias:string = as(model.tableName)
        return new Queryable(
            QUERY_OPERATION.SELECT,
            model.tableName, 
            alias, 
            model.columns
        )

    }

    insert<T extends Model>(
        model:T,
        columns:(columns) => Array<keyof OmitModelMeta<T>> | '*' = ()=>'*'
    ): InsertQueryable<T> {

        let alias:string = model.tableName
        return new Queryable(
            QUERY_OPERATION.INSERT, 
            model.tableName, 
            alias, 
            model.columns.filter(c=>!c.isReadOnly && c.value !== undefined)
        )

    }

    update<T extends Model>(
        model:T,
        columns:(columns) => Array<keyof OmitModelMeta<T>> | '*' = ()=>'*'
    ): Queryable<T> {

        let alias:string = model.tableName
        return new Queryable(
            QUERY_OPERATION.UPDATE, 
            model.tableName, 
            alias, 
            model.columns.filter(c=>!c.isReadOnly && c.value !== undefined)
        )

    }

    delete<T extends Model>(
        from:(from)=> { new():T },
        columns:(columns) => Array<keyof OmitModelMeta<T>> | '*' = ()=>'*'
    ): Queryable<T> {

        let model = new (from(null))(),
            alias:string = model.tableName
        return new Queryable(
            QUERY_OPERATION.DELETE, 
            model.tableName, 
            alias, 
            model.columns.filter(c=>!c.isReadOnly && c.value !== undefined)
        )

    }

}