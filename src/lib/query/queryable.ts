import { Model, Column } from '../model'
import { Condition, ConditionColumn, ConditionExtension, ConditionOperand } from './condition'
import { OmitModelMeta } from './common'

type ConditionColumnProvider<T extends Model> = (property:keyof OmitModelMeta<T>) => ConditionOperand
type OrderByColumnDirection = 'ASC' | 'DESC'
type OrderByColumnProvider<T extends Model> = (property:keyof OmitModelMeta<T>, direction:OrderByColumnDirection) => Array<OrderByColumn>

interface OrderByColumn {
    column:Column
    direction:OrderByColumnDirection
}

/**
 * 
 */
export class Queryable<T extends Model> {

    private whereTable

    distinct: Array<keyof OmitModelMeta<T>>
    conditions: Array<ConditionColumn> = []
    orderby: Array<OrderByColumn> = []

    constructor(
        public readonly name: string,
        public readonly alias: string, 
        public readonly columns: Array<Column>,
    ){

    }

    /**
     * 
     * @param columns 
     */
    withDistinct(columns:Array<keyof OmitModelMeta<T>>){
        this.distinct = columns
    }

    /**
     * given a key of T as a string find the column on the queryable model and build a new BinaryOperation
     * @param name the name of the column to create an operation on
     */
    private provideOperationForColumn(): ConditionColumnProvider<T> {
        let self = this
        return (name)=>{
            let colName = name === 'id' ? '_id' : name,
                column = self.columns.find(
                    c=>c.property === colName
                )
            if (column === undefined){
                throw Error("Column "+name+" not found on table "+ self.name)
            }
            return new Condition(column)
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
    withCondition(condition:(column:ConditionColumnProvider<T>) => ConditionExtension): Queryable<T> {    
        let operation:ConditionColumn = <Condition>condition(this.provideOperationForColumn())
        this.conditions.push(operation)
        return this
    }

    withLimit(limit:number): Queryable<T> {
        return this
    }
    withOffset(offset:number): Queryable<T> {
        return this
    }



    OrderBy(columns:Array<OrderByColumnProvider<T>>): Queryable<T> {

        //columns.map(c=>c())

        return this
    }



}