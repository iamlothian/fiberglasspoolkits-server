import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity, oneToMany, LazyLoad } from "./entity"
import { Item } from "../models"

@table()
export class ItemCategory extends Entity {

    @column({dbType:'boolean'})
    isRequired:boolean = false

    @oneToMany<Item>("Item", 'categoryId')
    items: LazyLoad<Array<Item>> = new LazyLoad(async loader=>{
        return await ItemCategory.getAll(Item, this.state,
            q=>q.and(c=>c.column("categoryId").equals(this.entityId))
        )
    })

    constructor(){
        super()
    }

}