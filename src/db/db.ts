import * as Injector from 'typescript-injector-lite'
import { Pool, Client, QueryResult }  from 'pg'
import { 
    Model, 
    Column, 
    Datastore, 
    Queryable, 
    QUERY_TOKENS, 
    QueryPart, 
    OrderByField, 
    ORDER_BY_DIRECTION 
} from '../lib'

/**
 * An implementation of the Datastore interface which communicates with a posgres database
 */
@Injector.service("DB")
export class DB implements Datastore {

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
     * execute a Queryable object on the database and return the results as models
     * @param type 
     * @param query 
     */
    async execute<T extends Model>(query:Queryable<T>) : Promise<QueryResult> {
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
    buildQuery(queryPart: Array<QueryPart>): {queryText:string, value:Array<any>} {
        let Q = {
            queryText: "",
            value: new Array<any>()
        }
        queryPart.forEach(v => {
            Q.queryText += ' '+this.getRecipe(v, Q.value)
        })
        return Q
    }

    getRecipe(queryPart: QueryPart, values:Array<any>): string {

        switch(queryPart.operation) {
            case QUERY_TOKENS.SELECT: return this.selectRecipe(queryPart)
            case QUERY_TOKENS.COUNT: return `SELECT COUNT(*) FROM ${<Model>(queryPart.target).tableName}`
            case QUERY_TOKENS.UPDATE: return this.updateRecipe(queryPart, values) 
            case QUERY_TOKENS.INSERT: return this.insertRecipe(queryPart, values) 
            case QUERY_TOKENS.DELETE: return this.deleteRecipe(queryPart) 
            case QUERY_TOKENS.ORDER_BY: return this.orderByRecipe(queryPart)
            case QUERY_TOKENS.LIMIT: 
                values.push(queryPart.target)
                return 'LIMIT $'+values.length
            //case QUERY_TOKENS.JOIN: return "JOIN"

            case QUERY_TOKENS.WHERE: return "WHERE"
            case QUERY_TOKENS.AND: return "AND"
            case QUERY_TOKENS.OR: return "OR"
            case QUERY_TOKENS.NOT: return "NOT"
            case QUERY_TOKENS.OPEN_GROUP: return "("
            case QUERY_TOKENS.CLOSE_GROUP: return ")"

            case QUERY_TOKENS.EQUALS: return this.operandRecipe('=', queryPart, values) 
            case QUERY_TOKENS.GREATER_THAN: return this.operandRecipe('>', queryPart, values) 
            case QUERY_TOKENS.GREATER_THAN_EQUAL: return this.operandRecipe('>=', queryPart, values) 
            case QUERY_TOKENS.IN: return this.operandRecipe('IN', queryPart, values) 
            case QUERY_TOKENS.LESS_THAN: return this.operandRecipe('<', queryPart, values) 
            case QUERY_TOKENS.LESS_THAN_EQUAL: return this.operandRecipe('<=', queryPart, values) 
            case QUERY_TOKENS.NOT_EQUALS: return this.operandRecipe('!=', queryPart, values) 
            case QUERY_TOKENS.IS_NULL: return queryPart.target+' ISNULL'
            case QUERY_TOKENS.NOT_NULL: return queryPart.target+' NOTNULL' 
            
            default: throw new Error("Token [" + queryPart.operation + "] not implemented")
        }
    }

    private operandRecipe(symbol:string, queryPart: QueryPart, values:Array<any>) {
        values.push(queryPart.value)
        return queryPart.target+' '+symbol+' $'+values.length
    }

    private selectRecipe(queryPart: QueryPart): string {
        let model = <Model>queryPart.target,
            columns = model.columns.map(v=>v.name).join(','),
            table = model.tableName
        return `SELECT ${columns} FROM ${table}`
    }
    private updateRecipe(queryPart: QueryPart, values:Array<any>): string {
        let model = <Model>queryPart.target,
            columns:Array<Column> = model.columns.filter(v => v.value !== undefined && !v.isReadOnly),            
            setColumns:Array<string> = columns.map(c => {
                values.push(c.value)
                return c.name+'=$'+values.length
            })

        return `UPDATE ${model.tableName} SET ${setColumns.join(',')}`
    }
    private insertRecipe(queryPart: QueryPart, values:Array<any>): string {
        let model = <Model>queryPart.target,
            columns:Array<Column> = model.columns.filter(v => !!v.value && !v.isReadOnly),
            columnNames = Array(), 
            columnParams = Array()
            
        columns.forEach((c,i) => {
            values.push(c.value)
            columnNames.push(c.name)
            columnParams.push('$'+(values.length))
        })

        return `INSERT INTO ${model.tableName} (${columnNames.join(',')}) VALUES (${columnParams.join(',')}) RETURNING *`
    }
    private deleteRecipe(queryPart: QueryPart): string {
        let table = <Model>queryPart.target
        return `DELETE FROM ${table}`
    }
    private orderByRecipe(queryPart: QueryPart): string {
        let fields = queryPart.target.map(f=>f.column+' '+ORDER_BY_DIRECTION[f.direction])
        return 'ORDER BY '+fields.join(', ')
    }

}