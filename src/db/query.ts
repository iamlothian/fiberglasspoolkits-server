import * as Injector from 'typescript-injector-lite'
import { Model, Column, Queryable, QueryableColunms, QueryableOperands, QueryableConditionsStack, QueryableCondition  } from '../lib'

/**
 * 
 */
class QueryColunms implements QueryableColunms{
    constructor(
        private columns: Array<Column>, 
        private queryStack:Array<QueryableCondition> = []
    ){}
    column(columnName:string): QueryableOperands {
        let column:Column = this.columns.find((c) => c.name === columnName) 
        return new QueryOperands(
            column, 
            this.columns, 
            this.queryStack
        )
    }
}

/**
 * 
 */
class QueryOperands implements QueryableOperands {
    constructor(
        private column:Column, 
        private columns: Array<Column>,
        private queryStack:Array<QueryableCondition>
    ){}

    construct(operand:string, value:string|number|Array<string|number>): QueryableConditionsStack {
        this.queryStack.push(
            new QueryCondition(operand, this.column.name, value)
        )
        return new QueryConditionsStack(
            this.columns,
            this.queryStack
        )
    }
    notEqals(value:string|number): QueryableConditionsStack { return this.construct("!=",value) }
    equals(value:string|number): QueryableConditionsStack { return this.construct("=",value) }
    gt(value:string|number): QueryableConditionsStack { return this.construct(">",value) }
    gte(value:string|number): QueryableConditionsStack { return this.construct(">=",value) }
    lt(value:string|number): QueryableConditionsStack { return this.construct("<",value) }
    lte(value:string|number): QueryableConditionsStack { return this.construct("<=",value) }
    in(values:Array<string|number>): QueryableConditionsStack { return this.construct("IN",values) }
}

/**
 * 
 */
class QueryConditionsStack implements QueryableConditionsStack {

    constructor(
        private columns: Array<Column> = [],
        private queryStack:Array<QueryableCondition> = [],
    ){}
    and(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack){
        this.queryStack.push(new QueryCondition("AND"))
        return conditionFunction(
            new QueryColunms(this.columns, this.queryStack)
        )
    }
    or(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack){
        this.queryStack.push(new QueryCondition("OR"))
        return conditionFunction(
            new QueryColunms(this.columns, this.queryStack)
        )
    }
    getStack(): Array<QueryableCondition> {
        return this.queryStack
    }
}

class QueryCondition implements QueryableCondition {
    constructor(
        public operand: string,
        public column: string = undefined,
        public value: any = undefined
    ){}

    toString(){
        return !!this.column ?
            this.column +' '+ this.operand +' '+ this.value :
            this.operand
    }
}

/**
 * 
 */
export class Query<T extends Model> implements Queryable<T> {

    private query:string
    private modelInst: T
    private table: string
    private columns: Array<Column>
    private conditionStack: Array<QueryCondition>

    constructor(
        private modelType: { new (): T; }
    ){
        this.modelInst = new this.modelType()
        this.table = this.modelInst.tableName
        this.columns = this.modelInst.columns

        let columns:Array<string> = this.columns.map(v => v.name)
        this.query = `SELECT ${columns.join(',')} FROM ${this.table}`

        this.conditionStack = new Array<QueryCondition>();
        
    }
    
    where(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack){
        return this.condition('WHERE', conditionFunction)
    }
    and(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack){
        return this.condition('AND', conditionFunction)
    }
    or(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack){
        return this.condition('OR', conditionFunction)
    }
    not(conditionFunction:(table:QueryableColunms) => QueryableConditionsStack){
        return this.condition('NOT', conditionFunction)
    }
    condition(logic:'WHERE'|'AND'|'OR'|'NOT', conditionFunction:(table:QueryableColunms) => QueryableConditionsStack): Query<T> {

        this.conditionStack.push(new QueryCondition(logic))
        this.conditionStack.push(new QueryCondition('('))

        let conditionStack:Array<QueryCondition> = conditionFunction(
            new QueryColunms(this.columns)
        ).getStack();

        this.conditionStack = this.conditionStack.concat(conditionStack);
        this.conditionStack.push(new QueryCondition(')'))

        return this 
    }

    /**
     * 
     */
    toQuery(): {queryText:string, value:Array<any>} { 

        let qText:string = ""
        let qValues:Array<any> = new Array<any>()
        this.conditionStack.forEach(v => {
            if(!!v.column){
                qValues.push(v.value)
                qText += v.column +' '+ v.operand +' $'+ qValues.length +' '
            }else{
                qText += v.operand +' '
            }
        })

        return {
            queryText: this.query +' '+ qText,
            value: qValues
        }
    }

}

