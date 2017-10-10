import * as Injector from 'typescript-injector-lite'
import { table, column, oneToMany } from '../lib/orm/model'
import { Entity, Item } from "../models"

@table()
export class ItemCategory extends Entity {

    @column({dbType:'boolean'})
    isRequired:boolean = false

    @oneToMany()
    items:Array<Item>

    constructor(){
        super()
    }

}