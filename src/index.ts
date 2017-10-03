/* app/server.ts */
import "reflect-metadata"
import * as express  from 'express'
import * as bodyParser from 'body-parser'
import * as Injector from 'typescript-injector-lite'
import {API} from './lib'


// Import controllers entry point
import './controllers'

Injector.importValue("express", express())

@Injector.service()
class App {

    // The port the express app will listen on
    port: string = process.env.PORT || "3000"

    constructor(
        @Injector.inject("express") public express:express.Application // Create a new express application instance
    ){

        console.log("Constructing Application");

        // configure app to use bodyParser()
        // this will let us get the data from a POST
        ///this.express.use(bodyParser.urlencoded({ extended: true }))
        //this.express.use(bodyParser.json())

        // Serve the application at the given port
        this.express.listen(this.port, () => {
            // Success callback
            console.log(`Listening at http://localhost:${this.port}/`)
        })

    }

}

// Bootstrap App
API.bootstrap("App")