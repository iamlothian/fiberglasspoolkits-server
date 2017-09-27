import "reflect-metadata"
import * as Injector from 'typescript-injector-lite'

const TableMetadataKey = Symbol("design:tableName")
const columnMetadataKey = Symbol("design:columnName")
const columnTypeMetadataKey = Symbol("design:columnType")
const columnROMetadataKey = Symbol("design:columnReadOnly")

export interface Column {
    name:string
    value:any
    type:string
    dbType:string
    isReadOnly:boolean
}

export abstract class Model {
    
    @column("id", true, 'serial')
    id: number = undefined

    /**
     * 
     */
    get columns(): Array<Column> {
        return getColumns(this)
    }

    /**
     * 
     */
    get tableName(): string {
        return getTableName(Object.getPrototypeOf(this).constructor)
    }

    protected constructor(){}

    /**
     * 
     * @param tableRow 
     * @param type 
     */
    static deserialize<T extends Model>(tableRow: object, type: { new(): T; }): T {
        let inst: T = new type()

        inst.columns.forEach(c => {
            inst[c.name] = tableRow[c.name]
        })

        return inst
    }

    // /**
    //  * 
    //  * @param type 
    //  */
    // static serialize<T extends Model>(type: T): object {

    // }

}

let models: Array<string> = new Array()

/**
 * 
 * @param input transform a string from camel case to underscore
 */
function toUnderscoreCase(input: string) {
    input = input ? input.trim().replace(/([A-Z])/g, g => '_' + g[0].toLowerCase()) : null
    input = input[0] === '_' ? input.slice(1) : input
    return input;
}

/**
 * 
 * @param tableName 
 * @param key 
 */
export function table(tableName?: string, key?: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {

        key = key || constructor['name']
        tableName = tableName || toUnderscoreCase(key)

        Reflect.defineMetadata(TableMetadataKey, tableName, constructor)

        models.push(key)
        return Injector.factory(key)(constructor)
    }
}

/**
 * 
 * @param target 
 */
export function getTableName(target: any): string {
    return Reflect.getMetadata(TableMetadataKey, target)
}

/**
 * 
 * @param columnsName 
 */
export function column(columnName?: string, readOnly?: boolean, dbType?: string): any {
    return (target, propertyKey) => {
        columnName = columnName || toUnderscoreCase(propertyKey)
        Reflect.defineMetadata(columnMetadataKey, columnName, target, propertyKey)
        !readOnly && Reflect.defineMetadata(columnROMetadataKey, dbType, target, propertyKey)
        !dbType && Reflect.defineMetadata(columnTypeMetadataKey, dbType, target, propertyKey)
    }
}

/**
 * 
 * @param target 
 */
export function getColumns(target: any): Array<Column> {
    let columns = Array<Column>(), prototype = target
    while (prototype !== null) {
        Object.getOwnPropertyNames(prototype).forEach(c => {
            let columnName = Reflect.getMetadata(columnMetadataKey, prototype, c)
            if (columnName !== undefined) {
                columns.push({
                    'name': columnName,
                    'value': target[c],
                    'type': Reflect.getMetadata('design:type', prototype, c),
                    'dbType': Reflect.getMetadata(columnTypeMetadataKey, prototype, c),
                    'isReadOnly': Reflect.getMetadata(columnROMetadataKey, prototype, c)
                })
            }
        })
        prototype = Object.getPrototypeOf(prototype)
    }
    return columns
}