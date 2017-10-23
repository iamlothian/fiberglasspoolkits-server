import { Model, Column } from '../model'
import { Queryable } from '../query'

export type QueryResult = {}

/**
 * a generic class which can run queries on a database
 */
export interface Driver {
    
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