/* app/controllers/welcomeController.ts */

// Import only what we need from express
import { Router, Request, Response } from 'express';
import * as Injector from 'typescript-injector-lite';

export class controller {

    constructor(protected router: Router){
        this.router = router;
        console.log(router.name);

        // The / here corresponds to the route that the WelcomeController
        // is mounted on in the server.ts file.
        // In this case it's /welcome
        router.get('/', (req: Request, res: Response) => {
            // Reply with a hello world when no name param is provided
            res.send('Hello, World!');
        });

        router.get('/:name', (req: Request, res: Response) => {
            // Extract the name from the request parameters
            let { name } = req.params;

            // Greet the given name
            res.send(`Hello, ${name}`);
        });

    }

    route(): Router{
        return this.router;
    }

}
@Injector.service()
export class kitController extends controller {

    constructor(@Injector.inject('Router') protected router: Router){
        super(router);
        console.log(router.name);
    }

}