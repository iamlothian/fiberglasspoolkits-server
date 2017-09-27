import * as Injector from 'typescript-injector-lite'
import { Pool, Client, QueryResult }  from 'pg'
import { Model, Column, Datastore, Queryable} from '../lib'
import { } from '../lib'

@Injector.service("DB")
export class DB implements Datastore {

    static connectionString:string =  process.env.CONNECTION_STRING || 'postgresql://fpkdb:p001z4l!f3@localhost:5432/fpkdb'

    constructor(
        public pool = new Pool({ connectionString:DB.connectionString })
    ){
        console.log("DB Connected")
        pool.on('error', this.onError)
    }

    private onError(err, client) {
        console.error('Unexpected error on idle client', err)
    }

    async query(queryText:string, value:Array<any> = []) : Promise<QueryResult> {
        const client = await this.pool.connect()
        try {
            return await client.query(queryText, value)
        } finally {
            client.release()
        }
    }

    /**
     * 
     * @param model 
     */
    async insert<T extends Model>(model:T) : Promise<T> {

        let table:string = model.tableName,
            columns:Array<Column> = model.columns.filter(v => !!v.value && !v.isReadOnly),
            columnNames = Array(), 
            columnParams = Array(), 
            columnValues = Array()
            
        columns.forEach((c,i) => {
            columnNames.push(c.name)
            columnParams.push('$'+(i+1))
            columnValues.push(c.value)
        })

        let query = `INSERT INTO ${table} (${columnNames.join(',')}) VALUES (${columnParams.join(',')}) RETURNING id`
        
        let result:QueryResult = await this.query(query, columnValues);

        model.id = result.rows[0].id

        return await model
    }

    /**
     * 
     * @param type 
     */
    async execute<T extends Model>(type: { new(): T; }, query:Queryable<T>) : Promise<Array<T>> {
        let R = new Array<T>(),
            Q = query.toQuery(),
            result:QueryResult = await this.query(Q.queryText, Q.value)

        result.rows.forEach(row => {
            let inst:T = Model.deserialize(row, type)
            R.push(inst);
        })

        return await R
    }

}