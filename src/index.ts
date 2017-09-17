/* app/server.ts */

// Import everything from express and assign it to the express variable
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as Injector from 'typescript-injector-lite';

// Import WelcomeController from controllers entry point
import { Router } from 'express';
import { kitController } from './controllers';

Injector.importValue('Router', Router());

@Injector.service()
class App {

    // Create a new express application instance
    app: express.Application = express();
    // The port the express app will listen on
    port: string = process.env.PORT || "3000";

    constructor(@Injector.inject() private kitController:kitController){

        // configure app to use bodyParser()
        // this will let us get the data from a POST
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());

        // Mount the WelcomeController at the /welcome route
        this.app.use('/welcome', kitController.route());

        // Serve the application at the given port
        this.app.listen(this.port, () => {
            // Success callback
            console.log(`Listening at http://localhost:${this.port}/`);
        });

    }

}

//new App();


