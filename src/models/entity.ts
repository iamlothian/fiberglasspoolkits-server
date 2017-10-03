import "reflect-metadata"
import * as uuid from 'uuid/v4'
import * as Injector from 'typescript-injector-lite'
import { DTO, Datastore } from "../lib/orm"
import { Query } from '../lib/drivers/psql'

export enum ENTITY_STATE { HIDDEN, DRAFT, PUBLIC }


/**
 * 
 */
export abstract class Entity extends DTO.Model {

    @DTO.column()
    entityId: string = uuid()

    @DTO.column()
    version: number = 1

    @DTO.column({isPublic:false})
    createdAt: Date = new Date()

    @DTO.column({isPublic:false})
    createdBy: string = "system"

    @DTO.column({isPublic:false})
    updatedAt: Date = new Date()  

    @DTO.column({isPublic:false})
    updatedBy: string = "system"

    @DTO.column({isPublic:false})
    state: ENTITY_STATE = ENTITY_STATE.DRAFT

    @DTO.column({isPublic:false})
    activateAt: Date = new Date()

    @DTO.column({isPublic:false})
    deactivateAt: Date = undefined

    @DTO.column({isRequired:true})
    title: string = undefined

    @DTO.column({isRequired:true})
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
        let entity:E = Entity.deserializeViewModel(entityType, json),
            query = Query.insert<E>(entity),
            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await DTO.Model.deserializeTableRow(entityType, result.rows[0])
    }

    /**
     * create a new version of an active entity in the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param json the object to try deserialized into the entity type
     * @param state the state of the active version to update
     */
    static async updateVersion<E extends Entity>(entityType: { new (): E; }, json:object, state:ENTITY_STATE=ENTITY_STATE.PUBLIC): Promise<E> {
        let newEntity:E = Entity.deserializeViewModel(entityType, json, true),
            versions:Array<E> = await Entity.getVersions(entityType, newEntity.entityId),
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

        return await DTO.Model.deserializeTableRow(entityType, result.rows[0])
    }

    /**
     * update the value of an existing entity in the Datastore
     * @param entitye the constructor of the entity to use for deserialize
     */
    static async updateReplace<E extends Entity>(entity:E): Promise<E> {

        let query = Query.update<E>(entity)
                    .where(e=>e.column('_id').equals(entity.id)),

            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await entity
    }
    /**
     * get the current active versions of an entity in the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param entityId the entity id to search 
     * @param state the state of the active version required
     */
    static async getByEntityId<E extends Entity>(entityType: { new (): E; }, entityId:string, state:ENTITY_STATE=ENTITY_STATE.PUBLIC): Promise<E> {
        
        let now = new Date().toUTCString(),

            query = Query.select(entityType)
                    .where(e=>e.column('entityId').equals(entityId))
                    .and(e=>e.column('state').equals(state))
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
            DTO.Model.deserializeTableRow(entityType, result.rows[0]) :
            undefined
    }
    /**
     * get a specific entity by its row ID from the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     * @param id the row id to use for the search
     */
    static async getByRowID<E extends Entity>(entityType: { new (): E; }, id:number): Promise<E> {
        let query = Query.select(entityType).where(
                e=>e.column('_id').equals(id)
            ),

            db:Datastore.Driver = Injector.instantiate('DB'),
            result = await db.execute(query)
            
        return await result.rowCount !== 0 ? 
            DTO.Model.deserializeTableRow(entityType, result.rows[0]) :
            undefined
    }
    /**
     * get a rows of a entity from the Datastore
     * @param entityType the constructor of the entity to use for deserialize
     */
    static async getAll<E extends Entity>(entityType: { new (): E; }): Promise<Array<E>> {
        let query = Query.select(entityType),
        db:Datastore.Driver = Injector.instantiate('DB'),

        result = await db.execute(query)
        
        return await result.rows.map(row=>DTO.Model.deserializeTableRow(entityType, row))
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
        
        return await result.rows.map(row=>DTO.Model.deserializeTableRow(entityType, row))
    }
}