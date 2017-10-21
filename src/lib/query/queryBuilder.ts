import { Model, Column } from '../model'
import { Queryable } from './queryable'
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
        return new Queryable(model.tableName, alias, model.columns)

    }

}