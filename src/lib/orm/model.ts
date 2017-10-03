import "reflect-metadata"
import * as Injector from 'typescript-injector-lite'

const TableMetadataKey = Symbol("design:tableName")
const columnMetadataKey = Symbol("design:column")

export interface Column {
    /**
     * The name of the column to be used in the Datastore
     */
    name?:string
    /**
     * The name of the property on the model class (Automatically populated)
     */
    property?:string
    /**
     * The value of the model class property at the time the columns metadata is requested
     */
    value?:any
    /**
     * The data typescript type of the model class property
     */
    type?:string
    /**
     * The optional datatype of the column in the Datastore
     */
    dbType?:string
    /**
     * Specify that a column should not be writable to the Datastore. For example an automatic ID or default value.
     */
    isReadOnly?:boolean
    /**
     * Specify the a column must be present when attempting to deserialize the Model instance
     */
    isRequired?:boolean
    /**
     * Specify that a column must not be presented when the Model is serialized
     */
    isPublic?:boolean
}

/**
 * The base abstract class for supporting ORM models, it provides metadata helpers used by the Query and Datastore abstractions
 * and the ability to serialize & deserialize or patch ORM models
 */
export abstract class Model {
    
    @column({name:"id", isReadOnly:true, dbType:'serial', isPublic:false})
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
        return Model.deserialize(type, tableColumn, "ROW")
    }
    /**
     * Create a new instance using the provided constructor type, and map the provided viewModel properties to it where supported on the constructor
     * @param type the constructor function to use for deserialization  
     * @param viewModel the serializedModel to deserialize to a Model instance
     */
    static deserializeViewModel<T extends Model>(type: { new(): T; }, viewModel: object, skipRequiredCheck:boolean = false): T {
        return Model.deserialize(type,viewModel, "REQ", skipRequiredCheck)
    }

    /**
     * Create a new instance using the provided constructor type, and map the provided serializedModel properties to it where supported on the constructor
     * @param type the constructor function to use for deserialization  
     * @param serializedModel the serializedModel to deserialize to a Model instance
     * @param mode the type of data to expect, 
     * "ROW" for a serializedModel where table column names represent the model properties, 
     * "REQ" for a serializedModel where model property names will be present
     */
    static deserialize<T extends Model>(type: { new(): T; }, serializedModel: object, mode:'ROW'|'REQ', skipRequiredCheck:boolean = false): T {
        let inst: T = new type(),
            missingProps = new Array<string>()

        inst.columns.forEach(c => {
            if (!skipRequiredCheck && c.isRequired && serializedModel[c.name] == undefined){
                missingProps.push(c.property)
            }
            if (mode === "ROW" && serializedModel[c.name] != undefined){
                inst[c.property] = serializedModel[c.name]
            }
            if (mode === "REQ" && serializedModel[c.property] != undefined){
                inst[c.property] = serializedModel[c.property]
            }
        })
        
        if (missingProps.length>0){
            throw new Error('Required properties of model ['+inst.tableName+'] not present ['+missingProps.join(', ')+']')
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
    static serialize<T extends Model>(model: T): object {
        let viewModel = {}
        model.columns
            .filter(c => c.isPublic)
            .forEach(c => viewModel[c.property] = c.value )
        return viewModel
    }

    serialize<T extends Model>(model: T): object {
        return Model.serialize(model);
    }

}

/**
 * Internal array of models
 */
let models: Array<string> = new Array()

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
 * annotation of a model class as a table in the Datastore
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