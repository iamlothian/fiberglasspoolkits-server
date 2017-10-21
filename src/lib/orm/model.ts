import "reflect-metadata"
import * as Injector from 'typescript-injector-lite'
import { Driver, SyncDriver } from './driver'
//import * as Sync from './modelSync'
import {  } from "./query"

const TableMetadataKey = Symbol("design:tableName")
const columnMetadataKey = Symbol("design:column")
const formatMetadataKey = Symbol("design:format")

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
 * The base abstract class for supporting ORM models, it provides metadata helpers used by the Query and Datastore abstractions
 * and the ability to serialize & deserialize or patch ORM models
 */
export abstract class Model {
    
    @column({
        name:"id", 
        isReadOnly:true, 
        isProtected:true,
        isPrivate:true,
        dbType:'serial', 
        dbIsPrimaryKey:true
    })
    /**
     * This private _id is designed to only allow deserialize models from the Datastore to provide
     */
    private _id: number = undefined
    /**
     * The most basic field required for ORM the numeric primary key
     */
    get id():number {
        return this._id
    }

    /**
     * get the columns metadata for this instance
     */
    get columns(): Array<Column> {
        return getColumns(this)
    }

    /**
     * get the metadata table name 
     */
    get tableName(): string {
        return getTableName(Object.getPrototypeOf(this).constructor)
    }

    protected constructor(){}

    /**
     * Create a new instance using the provided constructor type, and map the provided viewModel properties to it where supported on the constructor
     * @param type the constructor function to use for deserialization  
     * @param tableColumn the serializedModel to deserialize to a Model instance
     */
    static deserializeTableRow<T extends Model>(type: { new(): T; }, tableColumn: object): T {
        let inst: T = new type(),
        errors = new Array<string>()

        if (tableColumn['id'] === undefined){
            throw new Error("- deserialize expects tableColumn to contain the property [id]")
        }

        inst.columns.forEach(c => {

            if (tableColumn[c.name] != undefined){
                inst[c.property] = tableColumn[c.name]
            }
        })

        if (errors.length>0){
            throw new Error(errors.join('\n'))
        }
        

        return inst
    }
    /**
     * Create a new instance using the provided constructor type, and map the provided viewModel properties to it where supported on the constructor.
     * The created instance will be a shallow entity and not contain joins or relationships, as this method is designed to validate a vew model for use with a datastore 
     * @param type the constructor function to use for deserialization  
     * @param viewModel the serializedModel to deserialize to a Model instance
     */
    static deserializeViewModel<T extends Model>(type: { new(): T; }, viewModel: object, skipRequiredCheck:boolean = false): T {
       
        let inst: T = new type(),
            errors = new Array<string>()

        inst.columns.forEach(c => {
            if (!skipRequiredCheck && c.isRequired && viewModel[c.property] == undefined){
                errors.push('- Required property ['+c.property+'] of model ['+inst.tableName+'] not present in request')
            }
            if (c.isProtected && viewModel[c.property] != undefined){
                viewModel[c.property] = undefined
                errors.push('- Protected properties ['+c.property+'] of model ['+inst.tableName+'] can not be present in request')
            }
            if (viewModel[c.property] != undefined){
                inst[c.property] = viewModel[c.property]
            }
            
        })
        
        if (errors.length>0){
            throw new Error(errors.join('\n'))
        }

        return inst
    }

    /**
     * Patch and existing instance of a Model by mapping the viewModel properties to it, where supported on the constructor
     * @param model the model instance to patch
     * @param viewModel the viewModel to patch onto the instance
     */
    static patch<T extends Model>(model:T, viewModel: object): T {

        model.columns.forEach(c => {
            if (viewModel[c.property] != undefined){
                model[c.property] = viewModel[c.property]
            }
        })

        return model
    }

    /**
     * Take a model instance and return a POJO the represents it and complies with the column metadata and rules
     * @param model the model instance to deserialize
     */
    static async serialize<T extends Model>(model: T, depth:number = 1): Promise<object> {
        let viewModel = model.columns
            .filter(c => !c.isPrivate)
            .map(c => { 
                let fmttr = getFormat(model,c.property)
                c.value = !!fmttr ? fmttr(c.value) : c.value
                return c
            })
            .reduce((o,c) => {o[c.property] = c.value; return o}, {})
            
        return await viewModel
    }

}

/**
 * 
 * @param db 
 */
// export async function syncModels(syncDb:SyncDriver): Promise<Array<any>>{

//     console.log('======= Sync Models =======')

//     let modelList = new Array<Model>()
//     models.forEach(c=>{
//         let inst:Model = Injector.instantiate(c)
//         modelList.push(inst)
//     })

//     let deltaList = await Sync.syncModelDeltas(modelList)

//     deltaList.map(d=>syncDb.modelDeltaToQuery(d))

//     return modelList
// }

/**
 * Helper method for automatic table column name conventions
 * @param input transform a string from camel case to underscore
 */
function toUnderscoreCase(input: string) {
    input = input ? input.trim().replace(/([A-Z])/g, g => '_' + g[0].toLowerCase()) : null
    input = input[0] === '_' ? input.slice(1) : input
    return input;
}

/**
 * Internal array of models
 */
let models: Map<string, { new(): {} }> = new Map()

/**
 * 
 * @param modelName 
 */
export function getModelConstructor(modelName:string): { new(): {} } {
    return models.get(modelName)
}

/**
 * annotation of a model class as a table in the Datastore
 * @param tableName 
 * @param key 
 */
export function table(tableName?: string, key?: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {

        key = key || constructor['name']
        tableName = tableName || toUnderscoreCase(key)

        Reflect.defineMetadata(TableMetadataKey, tableName, constructor)

        let ctrl = Injector.factory(key)(constructor)

        models.set(key, ctrl)

        return ctrl
    }
}

/**
 * static method for getting the table name of a model annotated with the table annotation 
 * @param target 
 */
export function getTableName(target: any): string {
    return Reflect.getMetadata(TableMetadataKey, target)
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

export function format(formatterFn:(value:any) => string|number): any {
    return (target, propertyKey) => {
        Reflect.defineMetadata(formatMetadataKey, formatterFn, target, propertyKey)
    }
}

function getFormat(target:any, propertyKey:string): (value:any) => string|number {
    return Reflect.getMetadata(formatMetadataKey, target, propertyKey)
}