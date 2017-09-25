import * as Injector from 'typescript-injector-lite'
import { Pool, Client, QueryResult }  from 'pg'
import { Model } from '../lib'
import { Entity } from '../models'

interface Queryable {
    
    query(queryText:string, value:Array<any>): Promise<QueryResult>

}


@Injector.service("DB")
export class DB implements Queryable {

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

    /*
    INSERT INTO table_name [ AS alias ] [ ( column_name [, ...] ) ]
    { DEFAULT VALUES | VALUES ( { expression | DEFAULT } [, ...] ) [, ...] | query }
    [ ON CONFLICT [ conflict_target ] conflict_action ]
    [ RETURNING * | output_expression [ [ AS ] output_name ] [, ...] ]
    */
    async insert<T extends Model>(model:Model) : Promise<Array<T>> {

        let table = model.tableName,
            columns = model.columns,
            R = new Array<T>()

        //await this.query("SELECT * FROM kit");

        return await R
    }

    async get<T extends Model>(type: { new(...args: any[]): T; }) : Promise<Array<T>> {
        let R = new Array<T>(),
            result:QueryResult = await this.query("SELECT * FROM kit");

        result.rows.forEach(row => {
            let inst:T = Model.deserialize(row, type)
            R.push(inst);
        })

        return await R
    }

}

