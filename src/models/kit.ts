import * as Injector from 'typescript-injector-lite'
import { table, column } from '../lib/orm/model'
import { Entity } from "./entity"

@table()
export class Kit extends Entity {

    // @column({dbType:['varchar',60]})
    // foo:string = 'bar'

    constructor(){
        super()
    }

}