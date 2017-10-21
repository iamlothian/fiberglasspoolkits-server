import { Model, table } from '../model'
import { Entity } from '../entity'
import { Queryable } from './queryable'
import { QueryBuilder } from './queryBuilder'

@table()
class Thing extends Entity{
    constructor(){ super() }
}
@table()
class Other extends Entity{
    constructor(){ super() }
}

let queryBuilder = new QueryBuilder()

let query1 = queryBuilder
            .select<Thing>(from=>Thing)
            .withCondition(column=>column('id').equals(1))

let query2 = queryBuilder
            .select<Thing>(from=>Thing)
            .withCondition(Thing=>
                Thing('id').gte(1)
                .and(Thing('id').lte(4))
                .and(
                    Thing('id').equals(2)
                    .or(Thing('id').equals(3))
                )
            )
// let n = new Thing()
// queryBuilder.insert(n)


class QueryParser {
    
    
}