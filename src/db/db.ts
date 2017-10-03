import * as Injector from 'typescript-injector-lite'
import { Pool, Client, QueryResult }  from 'pg'
import * as Lib from '../lib'

/**
 * An implementation of the Datastore interface which communicates with a posgres database
 */
@Injector.service("DB")
export class DB implements Lib.Datastore.Datastore {

    static connectionString:string =  process.env.CONNECTION_STRING || 'postgresql://fpkdb:p001z4l!f3@localhost:5432/fpkdb'

    /**
     * 
     * @param pool create an internal connection pool or pass one in.
     */
    constructor(
        public pool = new Pool({ connectionString:DB.connectionString })
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
    async execute<T extends Lib.DTO.Model>(query:Lib.Query.Queryable<T>) : Promise<QueryResult> {
        let queryText = "",
            values = new Array<any>()

        query.queryParts.forEach(v => {
            queryText += ' '+this.getRecipe(v, values)
        })

        return await this.query(queryText, values)
    }

    /**
     * 
     * @param queryPart 
     */
    prepare<T extends Lib.DTO.Model>(queryFn:(...any) => Lib.Query.Queryable<T>): Lib.Datastore.PrepareableQuery {
        let queryText = "",
            defaultValues = new Array<any>()

        queryFn().queryParts.forEach(v => {
            queryText += ' '+this.getRecipe(v, defaultValues)
        })
        

        return new PreparedQuery<T>(this, queryText, defaultValues)
    }

    /**
     * 
     * @param queryPart 
     * @param values 
     */
    private getRecipe(queryPart: Lib.Query.QueryPart, values:Array<any>): string {

        switch(queryPart.operation) {
            case Lib.Query.QUERY_TOKENS.SELECT: return this.selectRecipe(queryPart)
            case Lib.Query.QUERY_TOKENS.COUNT: return `SELECT COUNT(*) FROM ${<Lib.DTO.Model>(queryPart.target).tableName}`
            case Lib.Query.QUERY_TOKENS.UPDATE: return this.updateRecipe(queryPart, values) 
            case Lib.Query.QUERY_TOKENS.INSERT: return this.insertRecipe(queryPart, values) 
            case Lib.Query.QUERY_TOKENS.DELETE: return this.deleteRecipe(queryPart) 
            case Lib.Query.QUERY_TOKENS.ORDER_BY: return this.orderByRecipe(queryPart)
            case Lib.Query.QUERY_TOKENS.LIMIT: 
                values.push(queryPart.target)
                return 'LIMIT $'+values.length
            //case Lib.Query.QUERY_TOKENS.JOIN: return "JOIN"

            case Lib.Query.QUERY_TOKENS.WHERE: return "WHERE"
            case Lib.Query.QUERY_TOKENS.AND: return "AND"
            case Lib.Query.QUERY_TOKENS.OR: return "OR"
            case Lib.Query.QUERY_TOKENS.NOT: return "NOT"
            case Lib.Query.QUERY_TOKENS.OPEN_GROUP: return "("
            case Lib.Query.QUERY_TOKENS.CLOSE_GROUP: return ")"

            case Lib.Query.QUERY_TOKENS.EQUALS: return this.operandRecipe('=', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.GREATER_THAN: return this.operandRecipe('>', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.GREATER_THAN_EQUAL: return this.operandRecipe('>=', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.IN: return this.operandRecipe('IN', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.LESS_THAN: return this.operandRecipe('<', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.LESS_THAN_EQUAL: return this.operandRecipe('<=', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.NOT_EQUALS: return this.operandRecipe('!=', queryPart, values) 
            case Lib.Query.QUERY_TOKENS.IS_NULL: return queryPart.target+' ISNULL'
            case Lib.Query.QUERY_TOKENS.NOT_NULL: return queryPart.target+' NOTNULL' 
            
            default: throw new Error("Token [" + queryPart.operation + "] not implemented")
        }
    }

    private operandRecipe(symbol:string, queryPart: Lib.Query.QueryPart, values:Array<any>) {
        values.push(queryPart.value)
        return queryPart.target+' '+symbol+' $'+values.length
    }

    private selectRecipe(queryPart: Lib.Query.QueryPart): string {
        let model = <Lib.DTO.Model>queryPart.target,
            columns = model.columns.map(v=>v.name).join(','),
            table = model.tableName
        return `SELECT ${columns} FROM ${table}`
    }
    private updateRecipe(queryPart: Lib.Query.QueryPart, values:Array<any>): string {
        let model = <Lib.DTO.Model>queryPart.target,
            columns:Array<Lib.DTO.Column> = model.columns.filter(v => v.value !== undefined && !v.isReadOnly),            
            setColumns:Array<string> = columns.map(c => {
                values.push(c.value)
                return c.name+'=$'+values.length
            })

        return `UPDATE ${model.tableName} SET ${setColumns.join(',')}`
    }
    private insertRecipe(queryPart: Lib.Query.QueryPart, values:Array<any>): string {
        let model = <Lib.DTO.Model>queryPart.target,
            columns:Array<Lib.DTO.Column> = model.columns.filter(v => !!v.value && !v.isReadOnly),
            columnNames = Array(), 
            columnParams = Array()
            
        columns.forEach((c,i) => {
            values.push(c.value)
            columnNames.push(c.name)
            columnParams.push('$'+(values.length))
        })

        return `INSERT INTO ${model.tableName} (${columnNames.join(',')}) VALUES (${columnParams.join(',')}) RETURNING *`
    }
    private deleteRecipe(queryPart: Lib.Query.QueryPart): string {
        let table = <Lib.DTO.Model>queryPart.target
        return `DELETE FROM ${table}`
    }
    private orderByRecipe(queryPart: Lib.Query.QueryPart): string {
        let fields = queryPart.target.map(f=>f.column+' '+Lib.Query.ORDER_BY_DIRECTION[f.direction])
        return 'ORDER BY '+fields.join(', ')
    }

}

class PreparedQuery<T extends Lib.DTO.Model> implements Lib.Datastore.PrepareableQuery {

    constructor(
        private db:DB, 
        private queryText:string, 
        private defaultValues:Array<any>
    ){
        
    }

    execute(): Promise<QueryResult> {

        return this.db.query(this.queryText, this.defaultValues)
    }

}