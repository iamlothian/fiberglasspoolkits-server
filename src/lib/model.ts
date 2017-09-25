import "reflect-metadata"
import * as Injector from 'typescript-injector-lite'
import { columnMetadataKey, TableMetadataKey } from './symbols'

export interface column {
    name:string
    value:any
}

export abstract class Model {
    
    @column()
    id: number = undefined

    /**
     * 
     */
    get columns(): Array<column> {
        return getColumns(this)
    }

    /**
     * 
     */
    get tableName(): string {
        return getTableName(this)
    }

    protected constructor(){}

    /**
     * 
     * @param tableRow 
     * @param type 
     */
    static deserialize<T extends Model>(tableRow: object, type: { new(...args: any[]): T; }): T {
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
    input = input[0] === '_' ? input.slice(1) : input
    return input ? input.trim().replace(/([A-Z])/g, g => '_' + g[0].toLowerCase()) : null
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
export function column(columnName?: string): any {
    return (target, propertyKey) => {
        columnName = columnName || toUnderscoreCase(propertyKey)
        return Reflect.defineMetadata(columnMetadataKey, columnName, target, propertyKey)
    }
}

/**
 * 
 * @param target 
 */
export function getColumns(target: any): Array<column> {
    let columns = Array<column>(), prototype = target
    while (prototype !== null) {
        Object.getOwnPropertyNames(prototype).forEach(c => {
            let columnName = Reflect.getMetadata(columnMetadataKey, prototype, c)
            if (columnName !== undefined) {
                columns.push({
                    'name': columnName,
                    'value': target[c]
                })
            }
        })
        prototype = Object.getPrototypeOf(prototype)
    }
    return columns
}