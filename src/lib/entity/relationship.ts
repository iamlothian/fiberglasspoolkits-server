import { Entity } from './entity'
import { getTableConstructor } from '../model'

const relationMetadataKey = Symbol("design:relationship")

/**
 * 
 */
export interface Relationship<M extends Entity> {
    property?:string
    joinColumn?:keyof M
    mappedBy?:string
    mappedByCtor?: { new():{} }
    type: "oneToMany"|"manyToOne"|"manyToMany"
}

/**
 * 
 */
export class LazyLoad<T> {
    constructor(
        private loader:(...args:Array<any>) => Promise<T>,
        private args: Array<any> = []
    ){}
    async load(): Promise<T> {
        return await this.loader.apply(null, this.args)
    }
}

/**
 * Item
 * @param joinColumn 
 */
export function manyToOne<M extends Entity>(joinColumn:keyof M, mappedBy: string): any {
    return (target, propertyKey) => {
        let relationship:Relationship<M> = Reflect.getMetadata(relationMetadataKey, target, propertyKey) || {},
            type = Reflect.getMetadata('desigm:type', target, propertyKey)
        
        relationship.type = "manyToOne"
        relationship.property = propertyKey
        relationship.joinColumn = joinColumn
        relationship.mappedBy = mappedBy

        Reflect.defineMetadata(relationMetadataKey, relationship, target, propertyKey)
    }
}

/**
 * Array<Item>
 * @param mappedBy 
 */
export function oneToMany<M extends Entity>(mappedBy: string, joinColumn:keyof M): any {
    return (target, propertyKey) => {
        
        let relationship:Relationship<M> = Reflect.getMetadata(relationMetadataKey, target, propertyKey) || {}
        
        relationship.type = "oneToMany"
        relationship.property = propertyKey
        relationship.joinColumn = joinColumn
        relationship.mappedBy = mappedBy

        Reflect.defineMetadata(relationMetadataKey, relationship, target, propertyKey)
    }
}

export function manyToMany(): any {
    return (target, propertyKey) => {
        
    }
}

/**
 * get the columns metadata from a model instance
 * @param target 
 */
export function getRelationships<M extends Entity>(target: any): Array<Relationship<M>> {
    let relationships = Array<Relationship<M>>(), prototype = target
    while (prototype !== null) {
        Object.getOwnPropertyNames(prototype).forEach(c => {
            let relationship:Relationship<M> = Reflect.getMetadata(relationMetadataKey, prototype, c)
            if (relationship !== undefined) {
                relationship.mappedByCtor = getTableConstructor(relationship.mappedBy)
                relationships.push(relationship)
            }
        })
        prototype = Object.getPrototypeOf(prototype)
    }
    return relationships
}