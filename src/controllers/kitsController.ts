/* app/controllers/welcomeController.ts */

import * as Injector from 'typescript-injector-lite';
import {ControllerBase, Controller} from '../lib'
import { Router, Request, Response, Application } from 'express';


@Controller()
export class KitController extends ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application
    ){
        super(express, undefined, "kit");
    }

    protected getMany(req: Request, res: Response){
        res.status(200).send('many kits!');
    }
    protected getOne(req: Request, res: Response){
        let { id } = req.params;
        res.status(200).send(`kit, ${id}`);
    }

}

@Controller()
export class TestController extends ControllerBase {

    constructor(
        @Injector.inject("express") protected express:Application,
        @Injector.inject("KitController") protected parent:ControllerBase
    ){
        super(express, parent, "test");
    }

    protected getMany(req: Request, res: Response){
        res.status(200).send('many tests!');
    }
    protected getOne(req: Request, res: Response){
        let { id } = req.params;
        res.status(200).send(`test, ${id}`);
    }

}