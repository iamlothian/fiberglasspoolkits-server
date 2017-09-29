import "reflect-metadata"
import * as uuid from 'uuid/v4'
import * as Injector from 'typescript-injector-lite'
import {Model, table, column } from "../lib"
import { DB, Query } from "../db"

export enum ENTITY_STATE { HIDDEN, DRAFT, PUBLIC }

/**
 * 
 */
export abstract class Entity extends Model {

    @column()
    entityId: string = uuid()

    @column()
    version: number = 1

    @column()
    createdAt: Date = new Date()

    @column()
    createdBy: string = "system"

    @column()
    updatedAt: Date = new Date()  

    @column()
    updatedBy: string = "system"

    @column()
    state: ENTITY_STATE = ENTITY_STATE.DRAFT

    @column()
    activateAt: Date = new Date()

    @column()
    deactivateAt: Date = undefined

    @column({isRequired:true})
    title: string = undefined

    @column({isRequired:true})
    description: string = undefined

    protected constructor(){
        super()
    }

    /**
     * 
     * @param entityType 
     * @param json 
     */
    static async create<E extends Entity>(entityType: { new (): E; }, json:object): Promise<E> {
        let entity:E = Entity.deserialize(json, entityType),
            query = Query.insert<E>(entity),
            db:DB = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await Model.deserialize(result.rows[0], entityType)
    }
    /**
     * 
     * @param entityType 
     * @param entityId 
     */
    static async getByEntityId<E extends Entity>(entityType: { new (): E; }, entityId:string): Promise<E> {
        let query = Query.select(entityType).where(
                e=>e.column('entityId').equals(entityId)
            ),
            db:DB = Injector.instantiate('DB'),
            result = await db.execute(query)

        return await Model.deserialize(result.rows[0], entityType)
    }
    /**
     * 
     * @param entityType 
     * @param id 
     */
    static async getByRowID<E extends Entity>(entityType: { new (): E; }, id:number): Promise<E> {
        let query = Query.select(entityType).where(
                e=>e.column('id').equals(id)
            ),
            db:DB = Injector.instantiate('DB'),
            result = await db.execute(query)
            
        return await Model.deserialize(result.rows[0], entityType)
    }

    static async getAll<E extends Entity>(entityType: { new (): E; }): Promise<Array<E>> {
        let query = Query.select(entityType),
        db:DB = Injector.instantiate('DB'),
        result = await db.execute(query)
        
        return await result.rows.map(row=>Model.deserialize(row, entityType))
    }
    static async getVersions<E extends Entity>(entityType: { new (): E; }, entityId: string): Promise<Array<E>> {
        let query = Query.select(entityType).where(
            e=>e.column('entityId').equals(entityId)
        ),
        db:DB = Injector.instantiate('DB'),
        result = await db.execute(query)
        
        return await result.rows.map(row=>Model.deserialize(row, entityType))
    }
}