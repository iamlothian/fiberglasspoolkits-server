import { Model, table, column } from '../model'
import { Entity } from '../entity'
import { Queryable } from './queryable'
import { QueryBuilder } from './queryBuilder'

@table()
class Thing extends Entity{

    @column({dbType:'int'})
    a:number

    constructor(){ super() }
}
@table()
class Other extends Entity{

    @column({dbType:'int'})
    b:number

    constructor(){ super() }
}

let queryBuilder = new QueryBuilder()

let query1 = queryBuilder
            .select<Thing>(from=>Thing)
            .withRelationship<Other>(join=>queryBuilder.select(from=>Other), 'b', 'a')
            .withCondition<Other>(column=>
                column('id').equals(1)
                .and(column('b').notEquals(1))
            )
            

let query2 = queryBuilder
            .select<Thing>(from=>Thing)
            .withCondition(column=>
                column('id').gte(1)
                .and(column('id').lte(4))
                .and(
                    column('id').equals(2)
                    .or(column('id').equals(3))
                )
            )
            .orderBy([column=>column('version','ASC')])
            .withOffset(10).withLimit(10)

queryBuilder.insert(new Other())