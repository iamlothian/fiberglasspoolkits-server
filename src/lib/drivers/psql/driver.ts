import { Pool, Client, QueryResult }  from 'pg'
import { Datastore, Queryable, DTO } from '../../orm'

/**
 * An implementation of the Datastore interface which communicates with a posgres database
 */
export class Driver implements Datastore.Driver {

    static connectionString:string =  process.env.CONNECTION_STRING || 'postgresql://fpkdb:p001z4l!f3@localhost:5432/fpkdb'

    /**
     * 
     * @param pool create an internal connection pool or pass one in.
     */
    constructor(
        public pool = new Pool({ connectionString:Driver.connectionString })
    ){
        console.log("DB Connected")
        pool.on('error', this.onError)
    }

    /**
     * the private error handler of the connection pool
     * @param err 
     * @param client 
     */
    private onError(err, client) {
        console.error('Unexpected error on idle client', err)
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
    async execute<T extends DTO.Model>(query:Queryable.Queryable<T>) : Promise<QueryResult> {
        let queryText = "",
            values = new Array<any>()

        query.getQueryStack().forEach(v => {
            let vlength = values.length
            queryText += ' '+v.bake(vlength)
            if (v.values.length > 0){
                values.push(v.values.length === 1 ? v.values[0] : v.values)
            }
            
        })

        return await this.query(queryText, values)
    }

    /**
     * 
     * @param queryPart 
     */
    prepare<T extends DTO.Model>(queryFn:(...any) => Queryable.Queryable<T>): Datastore.PrepareableQuery {
        
        // let queryText = "",
        // values = new Array<any>()

        // query.getQueryStack().forEach(v => {
        //     let vlength = values.length
        //     queryText += ' '+v.bake(vlength)
        //     values.push(v.values)
        // })
        

        return new PreparedQuery<T>(this, "", [])
    }

}

class PreparedQuery<T extends DTO.Model> implements Datastore.PrepareableQuery {

    constructor(
        private db:Driver, 
        private queryText:string, 
        private defaultValues:Array<any>
    ){
        
    }

    execute(): Promise<QueryResult> {

        return this.db.query(this.queryText, this.defaultValues)
    }

}