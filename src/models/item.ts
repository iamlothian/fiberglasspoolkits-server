import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity, manyToOne, LazyLoad } from "./entity"
import { ItemCategory } from "./itemCategory"

@table()
export class Item extends Entity {

    @column({name:'category_uuid', dbType:'integer', isRequired:true})
    categoryId: string = undefined

    @manyToOne<ItemCategory>("entityId", "ItemCategory")
    category: LazyLoad<ItemCategory> = new LazyLoad(async loader=>{
        return await Item.getByEntityId(ItemCategory, this.categoryId)
    })

    @column({dbType:'money'})
    cost: number = 0

    @column({dbType:'boolean'})
    ignoreCostInKit:boolean = false

    constructor(){
        super()
    }

}