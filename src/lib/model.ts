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
    private _id: number = undefined
    get id():number {
        return this._id
    }

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
     * Create a new instance using the provided constructor type, and map the provided viewModel properties to it where supported on the constructor
     * @param tableRow 
     * @param viewModel
     * @param mode 
     */
    static deserialize<T extends Model>(type: { new(): T; }, viewModel: object, mode:'ROW'|'REQ' = "ROW"): T {
        let inst: T = new type(),
            missingProps = new Array<string>()

        inst.columns.forEach(c => {
            if (c.isRequired && viewModel[c.name] == undefined){
                missingProps.push(c.property)
            }
            if (mode === "ROW" && viewModel[c.name] != undefined){
                inst[c.property] = viewModel[c.name]
            }
            if (mode === "REQ" && viewModel[c.property] != undefined){
                inst[c.property] = viewModel[c.property]
            }
        })
        
        if (missingProps.length>0){
            throw new Error('Required properties of model ['+inst.tableName+'] not present ['+missingProps.join(', ')+']')
        }

        return inst
    }

    /**
     * Patch and existing instance of a Model by mapping the patchModel properties to it where supported on the constructor
     * @param inst 
     * @param patch 
     */
    static patch<T extends Model>(modle:T, patchModel: object): T {
        let missingProps = new Array<string>()

        modle.columns.forEach(c => {
            if (c.isRequired && patchModel[c.property] == undefined){
                missingProps.push(c.property)
            }
            if (patchModel[c.property] != undefined){
                modle[c.property] = patchModel[c.property]
            }
        })
        
        if (missingProps.length>0){
            throw new Error('Required properties of model ['+modle.tableName+'] not present ['+missingProps.join(', ')+']')
        }

        return modle
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