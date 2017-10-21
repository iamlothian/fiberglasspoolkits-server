import "reflect-metadata"

const formatMetadataKey = Symbol("design:format")

/**
 * 
 * @param formatterFn 
 */
export function format(formatterFn:(value:any) => string|number): any {
    return (target, propertyKey) => {
        Reflect.defineMetadata(formatMetadataKey, formatterFn, target, propertyKey)
    }
}

/**
 * 
 */
export function getFormat(target:any, propertyKey:string): (value:any) => string|number {
    return Reflect.getMetadata(formatMetadataKey, target, propertyKey)
}