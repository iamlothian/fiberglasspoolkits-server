/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite'
import { Router, Request, Response, Application } from 'express' 
import { API, ORM } from '../lib'
import { Kit, ENTITY_STATE } from '../models'



@API.Controller()
export class KitController extends API.ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application
    ){
        super(express, undefined, "kit")
    }

    protected async post(req: Request, res: Response){  
        try {

            if (!req.body) { 
                throw new API.BadRequest("No request body found")
            }

            let kit:Kit = await Kit.create(Kit, req.body)
            res.status(200).send(
                Kit.serialize(kit)
            )

        } catch (error) {
            console.error(error)
            res.status(error.statusCode || 500).send({
                errors:[error.message]
            })
        }
    }

    protected async getMany(req: Request, res: Response){
        try {
            let kits:Array<Kit> = await Kit.getAll(Kit)
            res.status(200).send(
                kits.map(k=> Kit.serialize(k))
            )

        } catch (error) {
            console.error(error)
            res.status(error.statusCode || 500).send({
                errors:[error.message]
            })
        }
    }

    protected async getOne(req: Request, res: Response){
        let { [this.resourceRefName]:id } = req.params,
            { state } =  req.query

        try {
            let kit:Kit = await Kit.getByEntityId(Kit, id, state)
            res.status(200).send(
                Kit.serialize(kit)
            )

        } catch (error) {
            console.error(error)
            res.status(error.statusCode || 500).send({
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
        let { [this.resourceRefName]:id } = req.params,
            { state } =  req.query

        try {

            if (!req.body) { 
                throw new API.BadRequest("No request body found")
            }

            let kit:Kit = await Kit.updateVersion(Kit, req.body, state)
            kit === undefined ? 
                res.sendStatus(404) : 
                res.status(200).send(
                    Kit.serialize(kit)
                )

        } catch (error) {
            console.error(error)
            res.status(error.statusCode || 500).send({
                errors:[error.message]
            })
        }
    }

    /**
     * Update the current resource
     * @param req 
     * @param res 
     */
    protected async put(req: Request, res: Response){
        let { [this.resourceRefName]:id } = req.params,
            { state } =  req.query

        try {

            if (!req.body) { 
                throw new API.BadRequest("No request body found")
            }

            // get active kit
            let kit:Kit = await Kit.getByEntityId(Kit, id, state)

            // patch changes onto kit
            kit = Kit.patch(kit, req.body)
            
            // apply changes to the Datastore
            await Kit.updateReplace(kit)

            res.status(200).send(
                Kit.serialize(kit)
            )

        } catch (error) {
            console.error(error)
            res.status(error.statusCode || 500).send({
                errors:[error.message]
            })
        }
    }
    protected async delete(req: Request, res: Response){
        // let { [this.resourceRefName]:id } = req.params

        // let query = Query.delete(Kit).where(kit => kit.column('id').equals(id))
        
        // let kits:Array<Kit> = await this.db.execute(Kit, query);

        // res.status(204).send(kits)
    }

}