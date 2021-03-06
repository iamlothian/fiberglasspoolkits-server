/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite'
import { Router, Request, Response, Application } from 'express' 
import { API, ORM } from '../lib'
import { ItemCategory, ENTITY_STATE } from '../models'



@API.Controller()
export class ItemCategoryController extends API.ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application
    ){
        super(express, undefined, "category")
    }

    protected async post(req: Request, res: Response){  
        try {

            if (!req.body) { 
                throw new API.BadRequest("No request body found")
            }

            let category:ItemCategory = await ItemCategory.create(ItemCategory, req.body)
            res.status(200).send(
                await ItemCategory.serialize(category)
            )

        } catch (error) {
            console.error(error)
            res.status(error.statusCode || 500).send({
                errors:[error.message]
            })
        }
    }

    protected async getMany(req: Request, res: Response){
        let { state } =  req.query

        try {
            let itemCategories:Array<ItemCategory> = await ItemCategory.getAll(ItemCategory, state),
                serialized = await Promise.all(itemCategories.map(k=>ItemCategory.serialize(k)))

            res.status(200).send(serialized)

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
            let category:ItemCategory = await ItemCategory.getByEntityId(ItemCategory, id, state)

            if (category === undefined){
                throw new API.NotFound()
            }

            res.status(200).send(
                await ItemCategory.serialize(category)
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

            let category:ItemCategory = await ItemCategory.updateVersion(ItemCategory, req.body, state)
            category === undefined ? 
                res.sendStatus(404) : 
                res.status(200).send(
                    await ItemCategory.serialize(category)
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

            // get active category
            let category:ItemCategory = await ItemCategory.getByEntityId(ItemCategory, id, state)

            // patch changes onto category
            category = ItemCategory.patch(category, req.body)
            
            // apply changes to the Datastore
            await ItemCategory.updateReplace(category)

            res.status(200).send(
                await ItemCategory.serialize(category)
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

        // let query = Query.delete(ItemCategory).where(category => category.column('id').equals(id))
        
        // let itemCategories:Array<ItemCategory> = await this.db.execute(ItemCategory, query);

        // res.status(204).send(itemCategories)
    }

}