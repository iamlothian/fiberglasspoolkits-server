import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity } from "./entity"
import { Item } from "./item"
import { ItemCategory } from "./itemCategory"

@table()
export class Kit extends Entity {

    //@column({dbType:'', mappedBy:Item})
    categories:Array<ItemCategory>

    items:Array<Item>

    constructor(){
        super()
    }

}