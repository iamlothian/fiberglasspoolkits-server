import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity } from "./entity"
import { ItemCategory } from "./itemCategory"

@table()
export class Item extends Entity {

    @column({dbType:'integer', isRequired:true})
    category: ItemCategory

    @column({dbType:'money'})
    cost: number

    @column({dbType:'boolean'})
    ignoreCostInKit:boolean

    constructor(){
        super()
    }

}