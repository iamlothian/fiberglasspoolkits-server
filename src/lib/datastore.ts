import { Model, Column } from './model'
import { Queryable, QUERY_TOKENS } from './query'

/**
 * a generic class which can run queries on a database
 */
export interface Datastore {
    
    /**
     * run a query with vales on a database
     */
    query(queryText:string, value:Array<any>): Promise<any>


    /**
     * execute a Queryable object on the database and return the results as models
     * @see Queryable
     */
    execute<T extends Model>(query:Queryable<T>) : Promise<any>

}