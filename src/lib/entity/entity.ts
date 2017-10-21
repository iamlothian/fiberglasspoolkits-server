import "reflect-metadata"
import * as uuid from 'uuid/v4'
import { ENTITY_STATE } from "./state"
import { Model, column, format } from "../model"

/**
 * 
 */
export abstract class Entity extends Model {

    @column({dbType:'uuid', isProtected:true})
    entityId: string = uuid()

    @column({dbType:'smallint', isPrivate:true})
    version: number = 1

    @column({dbType:'timestamp', isPrivate:true})
    createdAt: Date = new Date()

    @column({dbType:'varchar(60)', maxLength:60, isPrivate:true})
    createdBy: string = "system"

    @column({dbType:'timestamp' })
    updatedAt: Date = new Date()  

    @column({dbType:'varchar(60)', maxLength:60, isPrivate:true})
    updatedBy: string = "system"

    @column({dbType:'smallint', isProtected:true})
    @format(v=>ENTITY_STATE[v])
    state: ENTITY_STATE = ENTITY_STATE.DRAFT

    @column({dbType:'timestamp', isPrivate:true})
    activateAt: Date = new Date()

    @column({dbType:'timestamp', dbNotNull:true})
    deactivateAt: Date = undefined

    @column({dbType:'varchar(60)', maxLength:60, isRequired:true})
    title: string = undefined

    @column({dbType:'varchar(256)', maxLength:256, isRequired:true})
    description: string = undefined

    protected constructor(){
        super()
    }
    
}
