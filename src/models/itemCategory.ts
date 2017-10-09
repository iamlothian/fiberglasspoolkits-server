import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity } from "./entity"

@table()
export class ItemCategory extends Entity {

    @column({dbType:'boolean'})
    isRequired:boolean = false

    constructor(){
        super()
    }

}