import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity } from "./entity"
import { Item } from "./item"
import { ItemCategory } from "./itemCategory"

@table()
export class Image extends Entity {

    filename:string
    extension:string

    height:number
    width:number

    constructor(){
        super()
    }

}