/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite'
import { Router, Request, Response, Application } from 'express' 
import {ControllerBase, Controller, getColumns} from '../lib'
import { Kit } from '../models'
import { DB, Query } from "../db"



@Controller()
export class KitController extends ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application,
        @Injector.inject() protected db:DB
    ){
        super(express, undefined, "kit")
    }

    protected async post(req: Request, res: Response){

        let kit:Kit = new Kit()

        kit.title = "My New Kit"

        kit = await this.db.insert(kit);

        res.status(200).send(kit)
    }

    protected async getMany(req: Request, res: Response){
        res.status(200).send('many kits!')
    }
    protected async getOne(req: Request, res: Response){
        let { id } = req.params

        let query:Query<Kit> = new Query(Kit).where(kit => kit.column('id').equals(id))
        
        let kits:Array<Kit> = await this.db.execute(Kit, query);

        res.status(200).send(kits)
    }

}

@Controller()
export class TestController extends ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application,
        @Injector.inject("KitController") protected parent:ControllerBase
    ){
        super(express, parent, "test")
    }

    protected getMany(req: Request, res: Response){
        res.status(200).send('many tests!')
    }
    protected getOne(req: Request, res: Response){
        let { id } = req.params
        res.status(200).send(`test, ${id}`)
    }

}