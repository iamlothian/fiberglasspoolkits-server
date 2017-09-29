import "reflect-metadata"
import * as Injector from 'typescript-injector-lite'

const TableMetadataKey = Symbol("design:tableName")
const columnMetadataKey = Symbol("design:column")

export interface Column {
    name?:string
    property?:string
    value?:any
    type?:string
    dbType?:string
    isReadOnly?:boolean
    isRequired?:boolean
    isPublic?:boolean
}

export abstract class Model {
    
    @column({name:"id", isReadOnly:true, dbType:'serial'})
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
        let inst: T = new type(),
            missingProps = new Array<string>()

        inst.columns.forEach(c => {
            if (c.isRequired && tableRow[c.name] == undefined){
                missingProps.push(c.property)
            }
            if (tableRow[c.name] != undefined){
                inst[c.property] = tableRow[c.name]
            }
        })

        if (missingProps.length>0){
            throw new Error('Required properties of model ['+inst.tableName+'] not present ['+missingProps.join(', ')+']')
        }

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
export function column({name,property,value,type,dbType,isReadOnly=false,isRequired=false,isPublic=true}:Column = {}): any {
    var column:Column = {name,property,value,type,dbType,isReadOnly,isRequired,isPublic}
    return (target, propertyKey) => {
        column.name = column.name || toUnderscoreCase(propertyKey)
        column.property = propertyKey
        column.type = Reflect.getMetadata('desigm:type', target, propertyKey)
        Reflect.defineMetadata(columnMetadataKey, column, target, propertyKey)
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