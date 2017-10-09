import { Pool, Client, QueryResult }  from 'pg'
import { Datastore, Queryable, DTO, Sync } from '../../orm'



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
    async execute<T extends DTO.Model>(query:Queryable.Queryable<T>) : Promise<QueryResult> {
        let queryText = "",
            values = new Array<any>()

        query.getQueryStack().forEach(v => {
            let vlength = values.length
            queryText += ' '+v.bake(vlength)
            if (v.values.length > 0){
                values = values.concat(v.values)
            }
            
        })

        return await this.query(queryText, values)
    }

    async end(): Promise<void> {
        await this.pool.end()
        console.log(this.name+" connection ended")
    }

}


export class SyncDriver implements Datastore.SyncDriver {
    
    constructor(private db:Driver){}

    modelDeltaToQuery(modelDelta: Sync.ModelDelta): string {
        
        let script:string
        if (modelDelta.hasDelta){

            if (modelDelta.version === 1){   
                script = `CREATE TABLE IF NOT EXISTS ${modelDelta.table} ()\n`
            }

            script = ''+
                `CREATE TABLE IF NOT EXISTS ${modelDelta.table} (\n`+
                    `${modelDelta.modified.map(c=>{
                        let column = [c.name, c.dbType + (c.maxLength ? '('+c.maxLength+')' : '')]
                            
                        !c.dbNotNull && column.push('NOT NUL')
                        c.dbIsPrimaryKey && column.push('CONSTRAINT '+c.name+'_pk PRIMARY KEY')

                        return '\t'+column.join('\t')
                    }).join(',\n')}`+
                '\n);'
        }
            
        return script

    }
    
}