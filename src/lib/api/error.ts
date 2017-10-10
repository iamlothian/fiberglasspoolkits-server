export class Error {

    constructor(
        public message:string,
        public statusCode:number
    ){}

}
export class BadRequest extends Error {
    
    constructor(
        public message:string = 'BadRequest',
        public statusCode:number = 400
    ){super(message, statusCode)}

}
export class Unauthorized extends Error {
    
    constructor(
        public message:string = 'Unknown server error',
        public statusCode:number = 401
    ){super(message, statusCode)}

}
export class Forbidden extends Error {
    
    constructor(
        public message:string = 'Unknown server error',
        public statusCode:number = 403
    ){super(message, statusCode)}

}
export class NotFound extends Error {
    
    constructor(
        public message:string = 'Not Found',
        public statusCode:number = 404
    ){super(message, statusCode)}

}

export class UnknownError extends Error {
    
    constructor(
        public message:string = 'Unknown server error',
        public statusCode:number = 500
    ){super(message, statusCode)}

}