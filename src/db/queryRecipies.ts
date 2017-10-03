import { DTO, Query } from '../lib'


export class Operand implements Query.OperandRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return this.columns[0]+' '+this.operand+' $'+(++valueCount)
    }

    constructor(
        public table:string, 
        column:DTO.Column,
        value:any,
        public operand:string
    ){
        this.columns.push(column.name)
        this.values.push(value)
    }
    
}
export class Equals extends Operand implements Query.EqualsRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '=') }
}
export class NotEquals extends Operand implements Query.NotEqualsRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '!=') }
}
export class GreaterThan extends Operand implements Query.GreaterThanRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '>') }
}
export class GreaterThanEqual extends Operand implements Query.GreaterThanEqualRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '>=') }
}
export class LessThan extends Operand implements Query.LessThanRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '<') }
}
export class LessThanEqual extends Operand implements Query.LessThanEqualRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '<=') }
}
export class In extends Operand implements Query.InRecipe {
    constructor( public table:string, column:DTO.Column, values:Array<any>) { super(table, column, values, 'IN') }
}
export class NotNull implements Query.NotNullRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return this.columns[0]+' NOTNULL'
    }

    constructor(
        public table:string, 
        column:DTO.Column
    ){
        this.columns.push(column.name)
    }
    
}
export class IsNull implements Query.IsNullRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return this.columns[0]+' ISNULL'
    }

    constructor(
        public table:string, 
        column:DTO.Column
    ){
        this.columns.push(column.name)
    }
    
}
export class Select implements Query.SelectRecipe {

    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `SELECT ${this.columns.join(',')} FROM ${this.table}`
    }

    constructor(
        public table:string, 
        columns:Array<DTO.Column>
    ){
        this.columns = columns.map(v=>v.name)
    }
    
}
export class Count implements Query.CountRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `SELECT COUNT(*) FROM ${this.table}`
    }

    constructor(
        public table:string, 
        columns:Array<DTO.Column>
    ){
        this.columns = columns.map(v=>v.name)
    }
    
}
export class Update implements Query.UpdateRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `UPDATE ${this.table} SET ${this.columns.map(c=>'$'+(++valueCount)).join(',')}`
    }    

    constructor(
        public table:string, 
        columns:Array<DTO.Column>
    ){
        columns = columns.filter(v => v.value !== undefined && !v.isReadOnly)
        this.columns = columns.map(v=>v.name)
        this.values = columns.map(v=>v.value)
    }
    
}
export class Insert implements Query.InsertRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `INSERT INTO ${this.table} (${this.columns.join(',')}) VALUES (${this.columns.map(c=>'$'+(++valueCount)).join(',')}}) RETURNING *`
    }    

    constructor(
        public table:string, 
        columns:Array<DTO.Column>
    ){
        columns = columns.filter(v => v.value !== undefined && !v.isReadOnly)
        this.columns = columns.map(v=>v.name)
        this.values = columns.map(v=>v.value)
    }
    
}
export class Delete implements Query.DeleteRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `DELETE FROM ${this.table}`
    }    

    constructor(
        public table:string, 
    ){}
    
}
export class OrderBy implements Query.OrderByRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `ORDER BY ${this.columns.map(c=>'$'+(++valueCount)).join(',')}`
    }    

    constructor(
        public table:string, 
        columns:Array<DTO.Column>,
        public SortDirections:Array<"ASC"|"DESC">
    ){
        this.columns = columns.map(v=>v.name)
        this.values = columns.map(v=>v.value)
    }
    
}
export class Limit implements Query.LimitRecipe {
    
    table:string = ""
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `LIMIT ${this.values[0]}`
    }    

    constructor(
        private value:number
    ){
        this.values.push(value.toFixed())
    }
    
}