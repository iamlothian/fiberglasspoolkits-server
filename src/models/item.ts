import * as Injector from 'typescript-injector-lite'
import { table, column, manyToOne } from '../lib/orm/model'
import { Entity } from "./entity"
import { ItemCategory } from "./itemCategory"

@table()
export class Item extends Entity {

    @column({name:'category_id', dbType:'integer', isRequired:true})
    @manyToOne("category_id")
    category: ItemCategory

    @column({dbType:'money'})
    cost: number

    @column({dbType:'boolean'})
    ignoreCostInKit:boolean

    constructor(){
        super()
    }

}