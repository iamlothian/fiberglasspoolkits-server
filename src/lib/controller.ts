import * as Injector from 'typescript-injector-lite';
import { Router, Request, Response, Application } from 'express';

let controllers:Array<string> = new Array()

/**
 * 
 * @param key 
 */
export function Controller(key?:string){
    return function<T extends {new(...args:any[]):{}}> (constructor:T) {

        controllers.push(key || constructor['name'])

        return Injector.service(key)(constructor)
    }
}

/**
 * 
 */
export function bootstrap(appServiceKey:string = 'App'):void{
    console.log('======= bootstrap =======');
    controllers.forEach(c=>{
        let inst:ControllerBase = Injector.instantiate(c)
        console.log('Controller ['+c+'] => ' + inst.getPath().join('/'))
    });
    Injector.instantiate(appServiceKey);
}

/**
 * 
 */
export abstract class ControllerBase {
    
    protected router:Router = Router()
    protected path:string
    protected pathRef:string

    constructor(
        protected app:Application,
        protected parent:ControllerBase,
        protected resourceName:string,
        protected resourceRefName:string = 'id',
    ){
        this.path = '/'+this.resourceName
        this.pathRef = this.path+'/:'+this.resourceRefName

        this.router.options(this.path, this.options);
        this.router.post(this.path, this.post);
        this.router.get(this.path, this.getMany);
        this.router.get(this.pathRef, this.getOne);
        this.router.patch(this.pathRef, this.patch);
        this.router.put(this.pathRef, this.put);
        this.router.delete(this.pathRef, this.delete);

        if (parent === undefined){
            app.use('/',this.router);
        }else{
            parent.router.use(parent.pathRef ,this.router);
        }
        
    }

    public getPath(pathMem:Array<string> = new Array()):Array<string> {

        pathMem.unshift(this.resourceName, ':'+this.resourceRefName);
        return this.parent !== undefined ?
            this.parent.getPath(pathMem) :
            pathMem;

    }

    protected options(req: Request, res: Response):void { 
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        res.send(200);    
    }

    protected post(req: Request, res: Response):void {  }
    protected getMany(req: Request, res: Response):void { res.sendStatus(405); }
    protected getOne(req: Request, res: Response):void { res.sendStatus(405); }
    protected patch(req: Request, res: Response):void { res.sendStatus(405); }
    protected put(req: Request, res: Response):void { res.sendStatus(405); }
    protected delete(req: Request, res: Response):void { res.sendStatus(405); }

}