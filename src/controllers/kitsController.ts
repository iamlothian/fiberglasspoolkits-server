/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite'
import { Router, Request, Response, Application } from 'express' 
import {ControllerBase, Controller, getColumns} from '../lib'
import { Kit } from '../models'
import { DB } from "../db"



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
        //getColumns(kit)

        await this.db.insert(kit);

        let kits = await this.db.get(Kit);

        res.status(200).send(kits)
    }

    protected async getMany(req: Request, res: Response){
        res.status(200).send('many kits!')
    }
    protected async getOne(req: Request, res: Response){
        let { id } = req.params

        res.status(200).send(`kit, ${id}`)
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