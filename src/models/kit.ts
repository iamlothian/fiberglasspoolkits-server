import * as Injector from 'typescript-injector-lite'
import { table } from '../lib'
import { Entity } from "./entity"

@table()
export class Kit extends Entity {

    constructor(){
        super()
    }

}