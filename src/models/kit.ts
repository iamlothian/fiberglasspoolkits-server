import * as Injector from 'typescript-injector-lite'
import { DTO } from '../lib'
import { Entity } from "./entity"

@DTO.table()
export class Kit extends Entity {

    constructor(){
        super()
    }

}