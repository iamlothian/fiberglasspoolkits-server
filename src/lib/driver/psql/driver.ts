import { Pool, Client, QueryResult }  from 'pg'
import * as Datastore from '../driver'
import { Queryable } from '../../query'
import { Model } from '../../model'



/**
 * An implementation of the Datastore interface which communicates with a posgres database
 */
export class Driver implements Datastore.Driver {

    /**
     * 
     * @param pool create an internal connection pool or pass one in.
     */
    constructor(
        private connectionString:string,
        public name = "Database",
        private pool = new Pool({ connectionString:connectionString })
    ){
        console.log(this.name+" connected established")
        pool.on('error', this.onError)
    }

    /**
     * the private error handler of the connection pool
     * @param err 
     * @param client 
     */
    private onError(err, client) {
        console.error('Encountered an error on '+this.name, err)
    }

    /**
     * 
     * @param queryText 
     * @param value 
     */
    async query(queryText:string, value:Array<any> = []) : Promise<QueryResult> {
        const client = await this.pool.connect()
        try {
            return await client.query(queryText, value)
        } finally {
            client.release()
        }
    }

    /**
     * execute a Lib.Query.Queryable object on the database and return the results as models
     * @param type 
     * @param query 
     */
    async execute<T extends Model>(query:Queryable<T>) : Promise<any> {
        let queryText = "",
            values = new Array<any>()

        

        return await this.query(queryText, values)
    }

    async end(): Promise<void> {
        await this.pool.end()
        console.log(this.name+" connection ended")
    }

}