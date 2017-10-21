import "reflect-metadata"
import * as uuid from 'uuid/v4'
import * as Injector from 'typescript-injector-lite'
import * as API from "../lib/api"
import { DTO, Datastore, Queryable } from "../lib/orm"
import { Query, QueryColumn } from '../lib/drivers/psql'

const relationMetadataKey = Symbol("design:relationship")

export enum ENTITY_STATE { HIDDEN, DRAFT, PUBLIC }
function normalizeEntityState(state:string|number): ENTITY_STATE {
    return typeof(ENTITY_STATE[state]) === 'number' ? ENTITY_STATE[state] : ENTITY_STATE[ENTITY_STATE[state]]
}

// interface searchQuery<M extends DTO.Model> {

//     pageSize:number
//     page:number

// }

/**
 * 
 */
export abstract class Entity extends DTO.Model {

    @DTO.column({dbType:'uuid', isProtected:true})
    entityId: string = uuid()

    @DTO.column({dbType:'smallint', isPrivate:true})
    version: number = 1

    @DTO.column({dbType:'timestamp', isPrivate:true})
    createdAt: Date = new Date()

    @DTO.column({dbType:'varchar(60)', maxLength:60, isPrivate:true})
    createdBy: string = "system"

    @DTO.column({dbType:'timestamp' })
    updatedAt: Date = new Date()  

    @DTO.column({dbType:'varchar(60)', maxLength:60, isPrivate:true})
    updatedBy: string = "system"

    @DTO.column({dbType:'smallint', isProtected:true})
    @DTO.format(v=>ENTITY_STATE[v])
    state: ENTITY_STATE = ENTITY_STATE.DRAFT

    @DTO.column({dbType:'timestamp', isPrivate:true})
    activateAt: Date = new Date()

    @DTO.column({dbType:'timestamp', dbNotNull:true})
    deactivateAt: Date = undefined

    @DTO.column({dbType:'varchar(60)', maxLength:60, isRequired:true})
    title: string = undefined

    @DTO.column({dbType:'varchar(256)', maxLength:256, isRequired:true})
    description: string = undefined

    protected constructor(){
        super()
    }

    /**
     * insert a new deserialized entity into the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param json the object to try deserialized into the entity type
     */
    static async create<E extends Entity>(entityType: { new (): E; }, json:object): Promise<E> {

        let entity:E 
        
        try {
            entity = Entity.deserializeViewModel(entityType, json)
        } catch (error) {
            throw new API.BadRequest(error.message)
        }

        let query = Query.insert<E>(entity),
            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await Entity.deserializeTableRow(entityType, result.rows[0])
    }

    /**
     * create a new version of an active entity in the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param json the object to try deserialized into the entity type
     * @param state the state of the active version to update
     */
    static async updateVersion<E extends Entity>(entityType: { new (): E; }, json:object, state:ENTITY_STATE=ENTITY_STATE.PUBLIC): Promise<E> {
        state = normalizeEntityState(state)
        let newEntity

        try {
            newEntity = Entity.deserializeViewModel(entityType, json, true)
        } catch (error) {
            throw new API.BadRequest(error.message)
        }

        let versions:Array<E> = await Entity.getVersions(entityType, newEntity.entityId),
            now = new Date()

        if (versions.length === 0){
            return undefined
        }

        // find the current active version 
        let currentVersion = versions.find(e => 
            e.state == state && 
            e.activateAt <= now && 
            (e.deactivateAt === undefined || e.deactivateAt >= now)
        )
        
        // set version of new entity
        newEntity.state = currentVersion.state
        newEntity.version = versions.length+1
        let insertQuery = Query.insert<E>(newEntity),
            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(insertQuery)

        // update deactivateAt date of current version
        currentVersion.deactivateAt = newEntity.activateAt
        await Entity.updateReplace(currentVersion)

        return await Entity.deserializeTableRow(entityType, result.rows[0])
    }

    /**
     * update the value of an existing entity in the Datastore
     * @param entitye the constructor of the entity to use for deserialize
     */
    static async updateReplace<E extends Entity>(entity:E): Promise<E> {

        let query = Query.update<E>(entity)
                    .where(e=>e.column('id').equals(entity.id)),

            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await entity
    }
    
    /**
     * get all rows and versions of an entity type from the Datastore, allows custom query conditions to be supplied
     * @param entityType the constructor of the entity to use for deserialize
     * @param state the minimum state of the entities to return
     * @param and any extra condition to apply to the selected set
     */
    static async getAll<E extends Entity>(entityType: { new (): E; }, state:ENTITY_STATE=ENTITY_STATE.PUBLIC, and:(query:Queryable.Queryable<E>) => Queryable.Queryable<E> = q=>q) : Promise<Array<E>> {
        state = normalizeEntityState(state)
        let query = and(Query.select(entityType).where(e=>e.column('state').gte(state))),
            db:Datastore.Driver = Injector.instantiate('DB'),

        result = await db.execute(query)
        
        return await result.rows.map(row=>Entity.deserializeTableRow(entityType, row))
    }

    /**
     * get the current active versions of an entity in the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param entityId the entity id to search 
     * @param state the state of the active version required
     */
    static async getByEntityId<E extends Entity>(entityType: { new (): E; }, entityId:string, state:ENTITY_STATE=ENTITY_STATE.PUBLIC): Promise<E> {
        state = normalizeEntityState(state)
        let now = new Date().toUTCString(),

            query = Query.select(entityType)
                    .where(e=>e.column('entityId').equals(entityId))
                    .and(e=>e.column('state').gte(state))
                    .and(e=>e.column('activateAt').lte(now))
                    .and(
                        e=>e.column('deactivateAt').isNull()
                        .or(e=>e.column('deactivateAt').gte(now))
                    )
                    .orderBy([['activateAt','DESC']])
                    .limit(1),

            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await result.rowCount !== 0 ? 
            Entity.deserializeTableRow(entityType, result.rows[0]) :
            undefined
    }

    /**
     * get all active entities from the Datastore, allows custom query conditions to be supplied
     * @param entityType the constructor of the entity to use for deserialize
     * @param state the minimum state of the entities to return
     * @param and any extra condition to apply to the selected set
     */
    static async getAllActive<E extends Entity>(entityType: { new (): E; }, state:ENTITY_STATE=ENTITY_STATE.PUBLIC, and:(query:Queryable.Queryable<E>) => Queryable.Queryable<E> = q=>q) : Promise<Array<E>> {
        state = normalizeEntityState(state)
        let now = new Date().toUTCString(),
            query = and(
                Query.select(entityType, ['entityId'])
                    .where(e=>e.column('state').gte(state))
                    .and(e=>e.column('activateAt').lte(now))
                    .and(
                        e=>e.column('deactivateAt').isNull()
                        .or(e=>e.column('deactivateAt').gte(now))
                    )
            ).orderBy([['entityId'],['activateAt','DESC']]),
        db:Datastore.Driver = Injector.instantiate('DB'),

        result = await db.execute(query)
        
        return await result.rows.map(row=>Entity.deserializeTableRow(entityType, row))
    }

    /**
     * get a specific entity by its row ID from the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param id the row id to use for the search
     */
    static async getByRowID<E extends Entity>(entityType: { new (): E; }, id:number): Promise<E> {
        let query = Query.select(entityType).where(
                e=>e.column('id').equals(id)
            ),

            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)
            
        return await result.rowCount !== 0 ? 
            Entity.deserializeTableRow(entityType, result.rows[0]) :
            undefined
    }
    /**
     * 
     * @param entityType 
     * @param entityId 
     */
    static async getVersions<E extends Entity>(entityType: { new (): E; }, entityId: string): Promise<Array<E>> {
        let query = Query.select(entityType)
                    .where(e=>e.column('entityId').equals(entityId))
                    .orderBy([['version','DESC']]),

        db:Datastore.Driver = Injector.instantiate('DB'),
        result = await db.execute(query)
        
        return await result.rows.map(row=>Entity.deserializeTableRow(entityType, row))
    }

    /**
     * 
     * @param type 
     * @param tableColumn 
     */
    static deserializeTableRow<T extends DTO.Model>(type: { new(): T; }, tableColumn: object): T {
        let inst:T = super.deserializeTableRow(type, tableColumn)

        getRelationships(inst).forEach(rel=>{

            let target = <{ new(): Entity }>rel.mappedByCtor

            switch(rel.type){

                case "oneToMany":
                    inst[rel.property] = new LazyLoad(async loader=>{
                        return await Entity.getAllActive(target, inst['state'], 
                            q=>q.and(c=>c.column(rel.joinColumn).equals(inst[rel.joinColumn]))
                        )
                    })
                    break

                case "manyToOne":
                    inst[rel.property] = new LazyLoad(async loader=>{
                        return await Entity.getByEntityId(target, inst[rel.joinColumn])
                    })
                    break

                case "manyToMany":
                    break
            }

        })

        return inst
    }

        /**
     * Take a model instance and return a POJO the represents it and complies with the column metadata and rules
     * @param model the model instance to deserialize
     */
    static async serialize<T extends DTO.Model>(model: T, depth:number = 1): Promise<object> {
        let viewModel = await super.serialize(model, depth)

        // load lazy loaded values
        let lazyValues = await Promise.all(
            getRelationships(model).map(async r => {
                return {
                    property: r.property,
                    value: await (<LazyLoad<any>>model[r.property]).load()
                }
            })
        )

        // copy values to view model
        lazyValues.forEach(l => {
            viewModel[l.property] = l.value
        })

        return await viewModel
    }
}

/**
 * 
 */
export interface ModelRelationship<M extends Entity> {
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
        let relationship:ModelRelationship<M> = Reflect.getMetadata(relationMetadataKey, target, propertyKey) || {},
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
        
        let relationship:ModelRelationship<M> = Reflect.getMetadata(relationMetadataKey, target, propertyKey) || {}
        
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
export function getRelationships<M extends Entity>(target: any): Array<ModelRelationship<M>> {
    let relationships = Array<ModelRelationship<M>>(), prototype = target
    while (prototype !== null) {
        Object.getOwnPropertyNames(prototype).forEach(c => {
            let relationship:ModelRelationship<M> = Reflect.getMetadata(relationMetadataKey, prototype, c)
            if (relationship !== undefined) {
                relationship.mappedByCtor = DTO.getModelConstructor(relationship.mappedBy)
                relationships.push(relationship)
            }
        })
        prototype = Object.getPrototypeOf(prototype)
    }
    return relationships
}