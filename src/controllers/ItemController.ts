/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite'
import { Router, Request, Response, Application } from 'express' 
import { API, ORM } from '../lib'
import { Item, ENTITY_STATE } from '../models'
import { ItemCategoryController } from '../controllers'



@API.Controller()
export class AdminItemController extends API.ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application
    ){
        super(express, undefined, "item")
    }

    protected async getMany(req: Request, res: Response){
        try {
            let kits:Array<Item> = await Item.getAll(Item)
            res.status(200).send(
                kits.map(k=> Item.serialize(k))
            )

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }

}

@API.Controller()
export class ItemController extends API.ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application,
        @Injector.inject("ItemCategoryController") protected parent:ItemCategoryController
    ){
        super(express, parent, "item")
    }

    protected async post(req: Request, res: Response){
        
        let { categoryId } = req.params
        
        try {

            if (!req.body) { 
                throw new Error("No request body found")
            }

            (<Item>req.body).category = categoryId

            let item:Item = await Item.create(Item, req.body)
            res.status(200).send(
                Item.serialize(item)
            )

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }

    protected async getMany(req: Request, res: Response){

        let { categoryId } = req.params

        try {
            let kits:Array<Item> = await Item.getAll(Item)
            res.status(200).send(
                kits.map(k=> Item.serialize(k))
            )

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }

    protected async getOne(req: Request, res: Response){
        let { [this.resourceRefName]:id, categoryId } = req.params,
            { state } =  req.query

        try {
            let item:Item = await Item.getByEntityId(Item, id, state)
            res.status(200).send(
                Item.serialize(item)
            )

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
        let { [this.resourceRefName]:id, categoryId } = req.params,
            { state } =  req.query

        try {

            if (!req.body) { 
                throw new Error("No request body found")
            }

            let item:Item = await Item.updateVersion(Item, req.body, state)
            item === undefined ? 
                res.sendStatus(404) : 
                res.status(200).send(
                    Item.serialize(item)
                )

        } catch (error) {
            console.error(error)
            res.status(400).send({
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
        let { [this.resourceRefName]:id, categoryId } = req.params,
            { state } =  req.query

        try {

            if (!req.body) { 
                throw new Error("No request body found")
            }

            // get active item
            let item:Item = await Item.getByEntityId(Item, id, state)

            // patch changes onto item
            item = Item.patch(item, req.body)
            
            // apply changes to the Datastore
            await Item.updateReplace(item)

            res.status(200).send(
                Item.serialize(item)
            )

        } catch (error) {
            console.error(error)
            res.status(400).send({
                errors:[error.message]
            })
        }
    }
    protected async delete(req: Request, res: Response){
        // let { [this.resourceRefName]:id } = req.params

        // let query = Query.delete(Item).where(item => item.column('id').equals(id))
        
        // let kits:Array<Item> = await this.db.execute(Item, query);

        // res.status(204).send(kits)
    }

}