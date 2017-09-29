/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite'
import { Router, Request, Response, Application } from 'express' 
import { ControllerBase, Controller, getColumns } from '../lib'
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
        try {

            if (!req.body) { 
                throw new Error("No request body found")
            }

            let kit:Kit = await Kit.create(Kit, req.body)
            res.status(200).send(kit)

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }

    protected async getMany(req: Request, res: Response){
        try {
            let kits:Array<Kit> = await Kit.getAll(Kit)
            res.status(200).send(kits)

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }
    protected async getOne(req: Request, res: Response){
        let { id } = req.params

        try {
            let kit:Kit = await Kit.getByEntityId(Kit, id)
            res.status(200).send(kit)

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }

    /**
     * New version of the resource
     * @param req 
     * @param res 
     */
    protected async patch(req: Request, res: Response){
        // let { id } = req.params,
        //     kit:Kit = Kit.deserialize(req.body, Kit)

        // let query = Query.update(kit).where(kit => kit.column('id').equals(id))
        
        // let kits:Array<Kit> = await this.db.execute(Kit, query);

        // res.status(200).send(kits)
    }

    /**
     * Update the current resource
     * @param req 
     * @param res 
     */
    protected async put(req: Request, res: Response){
        // let { id } = req.params,
        //     kit:Kit = Kit.deserialize(req.body, Kit)

        // let query = Query.update(kit).where(kit => kit.column('id').equals(id))
        
        // let kits:Array<Kit> = await this.db.execute(Kit, query);

        // res.status(200).send(kits)
    }
    protected async delete(req: Request, res: Response){
        // let { id } = req.params

        // let query = Query.delete(Kit).where(kit => kit.column('id').equals(id))
        
        // let kits:Array<Kit> = await this.db.execute(Kit, query);

        // res.status(204).send(kits)
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