import {DTO, Queryable} from '../../orm'


export class Operand implements Queryable.OperandRecipe {
    
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
export class Equals extends Operand implements Queryable.EqualsRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '=') }
}
export class NotEquals extends Operand implements Queryable.NotEqualsRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '!=') }
}
export class GreaterThan extends Operand implements Queryable.GreaterThanRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '>') }
}
export class GreaterThanEqual extends Operand implements Queryable.GreaterThanEqualRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '>=') }
}
export class LessThan extends Operand implements Queryable.LessThanRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '<') }
}
export class LessThanEqual extends Operand implements Queryable.LessThanEqualRecipe {
    constructor( public table:string, column:DTO.Column, value:any) { super(table, column, value, '<=') }
}
export class In extends Operand implements Queryable.InRecipe {
    constructor( public table:string, column:DTO.Column, values:Array<any>) { super(table, column, [values], 'IN') }
}
export class NotNull implements Queryable.NotNullRecipe {
    
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
export class IsNull implements Queryable.IsNullRecipe {
    
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

export class Select implements Queryable.SelectRecipe {

    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `SELECT ${this.columns.join(',')} FROM ${this.table}`
    }

    constructor(
        model:DTO.Model,
        public table:string = model.tableName, 
        columns:Array<DTO.Column> = model.columns
    ){
        this.columns = columns.map(v=>v.name)
    }
    
}
export class Count implements Queryable.CountRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `SELECT COUNT(*) FROM ${this.table}`
    }

    constructor(
        model:DTO.Model,
        public table:string = model.tableName, 
        columns:Array<DTO.Column> = model.columns
    ){
        this.columns = columns.map(v=>v.name)
    }
    
}
export class Update implements Queryable.UpdateRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `UPDATE ${this.table} SET ${this.columns.map(c=>'$'+(++valueCount)).join(',')}`
    }    

    constructor(
        model:DTO.Model,
        public table:string = model.tableName, 
        columns:Array<DTO.Column> = model.columns
    ){
        columns = columns.filter(v => v.value !== undefined && !v.isReadOnly)
        this.columns = columns.map(v=>v.name)
        this.values = columns.map(v=>v.value)
    }
    
}
export class Insert implements Queryable.InsertRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `INSERT INTO ${this.table} (${this.columns.join(',')}) VALUES (${this.columns.map(c=>'$'+(++valueCount)).join(',')}) RETURNING *`
    }    

    constructor(
        model:DTO.Model,
        public table:string = model.tableName, 
        columns:Array<DTO.Column> = model.columns
    ){
        columns = columns.filter(v => v.value !== undefined && !v.isReadOnly)
        this.columns = columns.map(v=>v.name)
        this.values = columns.map(v=>v.value)
    }
    
}
export class Delete implements Queryable.DeleteRecipe {
    
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `DELETE FROM ${this.table}`
    }    

    constructor(
        model:DTO.Model,
        public table:string = model.tableName
    ){}
    
}

export class OrderBy implements Queryable.OrderByRecipe {
    
    table:string = ""
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `ORDER BY ${this.columns.map((c,i)=>c+' '+this.SortDirections[i]).join(',')}`
    }    

    constructor(
        columns:Array<DTO.Column>,
        public SortDirections:Array<"ASC"|"DESC">
    ){
        this.columns = columns.map(v=>v.name)
    }
    
}
export class Limit implements Queryable.LimitRecipe {
    
    table:string = ""
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return `LIMIT $${++valueCount}`
    }    

    constructor(
        private value:number
    ){
        this.values.push(value.toFixed())
    }
    
}

export class Token implements Queryable.TokenRecipe {
    table:string = ""
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()

    bake(valueCount:number):string {
        return this.token
    }
    constructor(public token:string){}
}
export class And extends Token implements Queryable.AndRecipe {
    
    table:string = ""
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()
    constructor(public token:string = 'AND'){super(token)}
}
export class Or extends Token implements Queryable.OrRecipe {
    
    table:string = ""
    columns:Array<string> = new Array<string>()
    values:Array<string> = new Array<string>()
    constructor(public token:string = 'OR'){super(token)}
}