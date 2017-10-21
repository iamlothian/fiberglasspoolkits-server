import "reflect-metadata"
import { toUnderscoreCase } from './common'
import * as Injector from 'typescript-injector-lite'

const TableMetadataKey = Symbol("design:tableName")

/**
 * Internal array of models
 */
let models: Map<string, { new(): {} }> = new Map()

/**
 * 
 * @param modelName 
 */
export function getTableConstructor(modelName:string): { new(): {} } {
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