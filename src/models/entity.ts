import "reflect-metadata"
import * as uuid from 'uuid/v4'
import * as Injector from 'typescript-injector-lite'
import {Model, table, column } from "../lib"

export enum ENTITY_STATE { HIDDEN, DRAFT, PUBLIC }

/**
 * 
 */
export abstract class Entity extends Model {

    @column()
    entityId: string = uuid()

    @column()
    version: number = 0

    @column()
    createdAt: Date = new Date()

    @column()
    createdBy: string = undefined

    @column()
    updatedAt: Date = new Date()  

    @column()
    updatedBy: string = undefined

    @column()
    state: ENTITY_STATE = ENTITY_STATE.DRAFT

    @column()
    activateAt: Date = new Date()

    @column()
    deactivateAt: Date = undefined

    @column()
    title: string = undefined

    @column()
    description: string = undefined

    protected constructor(){
        super()
    }

    static create(): Entity {
        throw new Error("Method not implemented.")
    }
    static getByEntityId(entityId: string): Entity {
        throw new Error("Method not implemented.")
    }
    static getByRowID(id: number): Entity {
        throw new Error("Method not implemented.")
    }
    static getAll(): Entity[] {
        throw new Error("Method not implemented.")
    }
    static getVersions(entityId: string): Entity[] {
        throw new Error("Method not implemented.")
    }
}