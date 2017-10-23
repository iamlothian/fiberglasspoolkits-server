import { Model, Column } from '../model'
import { Condition, RoConditionColumn, ConditionExtension, ConditionOperand } from './condition'
import { OmitModelMeta } from './common'

type ConditionColumnProvider<T extends Model> = (property:keyof OmitModelMeta<T>) => ConditionOperand
type OrderByColumnDirection = 'ASC' | 'DESC'
type OrderByColumnProvider<T extends Model> = (property:keyof OmitModelMeta<T>, direction:OrderByColumnDirection) => OrderByColumn

type FoundColumn = {table:string, column:Column}

/**
 * 
 */
interface OrderByColumn {
    column:string
    direction:OrderByColumnDirection
}

/**
 * 
 */
class Join<T extends Model, R extends Model> {
    constructor(
        public query:Queryable<R>,
        public JoinFrom:keyof OmitModelMeta<R>,
        public joinTo:keyof OmitModelMeta<T> 
    ){}
}


export enum QUERY_OPERATION {
    INSERT,
    SELECT,
    UPDATE,
    DELETE
}

export interface InsertQueryable<T extends Model> {

    readonly operation: QUERY_OPERATION,
    readonly name: string,
    readonly alias: string, 
    readonly columns: Array<Column>,

}


/**
 * 
 */
export class Queryable<T extends Model> implements InsertQueryable<T>{

    distinctColumns: Array<keyof OmitModelMeta<T>>
    relationships: Array<Join<T,Model>> = []
    conditionColumns: Array<RoConditionColumn> = []
    orderbyColumns: Array<OrderByColumn> = []
    limit: number
    offset: number

    constructor(
        public readonly operation: QUERY_OPERATION,
        public readonly name: string,
        public readonly alias: string, 
        public readonly columns: Array<Column>,
    ){}

    /**
     * Try find a property on this or any joined query tables
     * @param property 
     */
    private findColumn(property:string): FoundColumn {

        let column:Column = this.columns.find(c=>c.property === property),
            table:string

        if (column === undefined){
            for (let r of this.relationships){
                column = r.query.columns.find(c=>c.property === property)
                table = r.query.alias
                if (!!column) {break}
            }
        }

        if (column === undefined){
            throw new Error('Property '+property+' can not be found on')
        }

        return { table, column }

    }
    /**
     * 
     * @param columns 
     */
    withDistinct(columns:Array<keyof OmitModelMeta<T>>){
        this.distinctColumns = columns
    }

    withRelationship<R extends Model>(
        joinQuery:(query:void)=>Queryable<R>,
        joinFrom: keyof OmitModelMeta<R>,
        joinTo: keyof OmitModelMeta<T>
    ): Queryable<T> {

        let query:Queryable<R> = joinQuery(null),
            join = new Join<T,R>(query, joinFrom, joinTo)

        this.relationships.push(join)

        return this
    }
    /**
     * given a key of T as a string find the column on the queryable model and build a new BinaryOperation
     * @param name the name of the column to create an operation on
     */
    private provideOperationForColumn(): ConditionColumnProvider<T> {
        let self = this
        return function(name){
            let colName = name === 'id' ? '_id' : name,
                result:FoundColumn = this.findColumn(colName)

            return new Condition(result.table, result.column.name)
        }
    }
    /**
     * Add the following conditions to the current query, multiple withCondition statements will be combined with AND logic 
     * 
     * Example:
     * ````
     *  queryBuilder.select<Thing>(from=>Thing).withCondition(column=>column('id').equals(1))
     * ````
     * @param condition a callback function that selects a property from the model to build and return a BinaryOperation for
     */
    withCondition<Relationship extends Model>(condition:(column:ConditionColumnProvider<Relationship>) => ConditionExtension): Queryable<T> {    
        let operation:RoConditionColumn = <Condition>condition(this.provideOperationForColumn())
        this.conditionColumns.push(operation)
        return this
    }
    /**
     * 
     * @param limit 
     */
    withLimit(limit:number): Queryable<T> {
        this.limit = limit
        return this
    }
    /**
     * 
     * @param offset 
     */
    withOffset(offset:number): Queryable<T> {
        this.offset = offset
        return this
    }
    /**
     * 
     */
    private provideOrderByForColumn(): OrderByColumnProvider<T> {
        let self = this
        return (property:keyof OmitModelMeta<T>, direction:OrderByColumnDirection) => {
            let colName = name === 'id' ? '_id' : name,
                column:string = this.findColumn(colName).column.name
                
            return { column, direction }
        }
    }
    /**
     * 
     * @param columns 
     */
    orderBy(columns:Array<(column:OrderByColumnProvider<T>) => OrderByColumn>): Queryable<T> {

        this.orderbyColumns = this.orderbyColumns.concat(
            columns.map(column=>column(this.provideOrderByForColumn()))
        )

        return this
    }

}