import "reflect-metadata"
import { toUnderscoreCase } from './common'
const columnMetadataKey = Symbol("design:column")

export interface DBColumn {
    /** The name of the column to be used in the Datastore, used in queries and table deserialization. DEFAULT: property in underscore case */
    name?:string
    /** The datatype of the column in the Datastore, required for datastore model version sync */
    dbType:string
    /** Can the Datastore column accept null values? DEFAULT: false */
    dbNotNull?:boolean
    /** Is this column the primary key of the table, not you can only have one primary key. DEFAULT: false */
    dbIsPrimaryKey?:boolean
    /** Is the column required to contain only unique values. DEFAULT: false */
    dbIsUnique?:boolean
    /** Is the column indexed, true or specify a sort order. DEFAULT: false */
    dbIsIndexed?:boolean|"ASC"|"DESC"
}

export interface Column extends DBColumn {
    /** The name of the property on the model class. Used for view model deserialization. DEFAULT: class property name */
    property?:string
    /** The value of the model class property at the time the columns metadata is requested */
    value?:any
    /** The data typescript type of the model class property. DEFAULT: typescript type script property type */
    type?:string
    /** Specify that a column should not be writeable to the Datastore. For example an automatic ID or default value. DEFAULT: false */
    isReadOnly?:boolean
    /** Specify that a column can not be present in a entity request, likely because it is set by the constructor or datastore. DEFAULT: false */
    isProtected?:boolean
    /** Specify the a column must be present when attempting to deserialize the Model instance: DEFAULT: false */
    isRequired?:boolean
    /** Specify that a column must not be presented when the Model is serialized: DEFAULT: false */
    isPrivate?:boolean
    /** The min length of the property value if required */
    minLength?:number
    /** The max length of the dbType and property value if required */
    maxLength?:number
    /** The maximum value of a numeric field */
    max?:number
    /** The minimum value of a numeric field */
    min?:number
}

/**
 * annotation for adding column metadata to a model property
 * @param columnsName 
 */
export function column(column: Column): any {
    return (target, propertyKey) => {
        column.name = column.name || toUnderscoreCase(propertyKey)
        column.property = propertyKey
        column.type = Reflect.getMetadata('desigm:type', target, propertyKey)
        Reflect.defineMetadata(columnMetadataKey, column, target, propertyKey)
    }
}

/**
 * get the columns metadata from a model instance
 * @param target 
 */
export function getColumns(target: any): Array<Column> {
    let columns = Array<Column>(), prototype = target
    while (prototype !== null) {
        Object.getOwnPropertyNames(prototype).forEach(c => {
            let column:Column = Reflect.getMetadata(columnMetadataKey, prototype, c)
            if (column !== undefined) {
                column.value = target[c]
                columns.push(column)
            }
        })
        prototype = Object.getPrototypeOf(prototype)
    }
    return columns
}