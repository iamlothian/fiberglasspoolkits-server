/* app/server.ts */
import "reflect-metadata";
import * as express  from 'express';
import * as bodyParser from 'body-parser';
import * as Injector from 'typescript-injector-lite';
import {bootstrap} from './lib'

import { MongoClient, MongoError, Db } from "mongodb"

// Connection URL
var url = 'mongodb://rw:rwuser@localhost:27017/fpkdb';
//var url = 'mongodb://admin:admin@localhost:27017/admin';

// Use connect method to connect to the server
MongoClient.connect(url, (err:MongoError, db:Db) => {
  
    if (err){
        throw new Error(err.code +": "+ err.message)
    }else{
        console.log("Connected successfully to database");
    }
  
    db.close();
});

// Import controllers entry point
import './controllers';

Injector.importValue("express", express());

@Injector.service()
export class App {

    // The port the express app will listen on
    port: string = process.env.PORT || "3000";

    constructor(
        @Injector.inject("express") public express:express.Application // Create a new express application instance
    ){

        // configure app to use bodyParser()
        // this will let us get the data from a POST
        this.express.use(bodyParser.urlencoded({ extended: true }));
        this.express.use(bodyParser.json());

        // Serve the application at the given port
        this.express.listen(this.port, () => {
            // Success callback
            console.log(`Listening at http://localhost:${this.port}/`);
        });

    }

}

// Bootstrap App
bootstrap("App");