import { Model, Column } from '../model'

/**
 * Operands supported by the query builder
 */
export enum OPERAND {
    EQUALS,
    NOT_EQUALS,
    GREATER_THAN,
    GREATER_THAN_EQUAL,
    LESS_THAN,
    LESS_THAN_EQUAL,
    IN,
    NOT_IN,
    BETWEEN,
    NOT_NULL,
    IS_NULL
}

export interface ConditionOperand {
    notNull(): ConditionExtension
    isNull(): ConditionExtension
    equals(value:any): ConditionExtension
    notEquals(value:any): ConditionExtension 
    gt(value:any): ConditionExtension 
    gte(value:any): ConditionExtension
    lt(value:any): ConditionExtension
    lte(value:any): ConditionExtension
    in(values:Array<any>): ConditionExtension
    notIn(values:Array<any>): ConditionExtension 
    between(greaterThan:number, lessThan:number): ConditionExtension
}

export interface ConditionExtension {
    and(condition:ConditionExtension): ConditionExtension
    or(condition:ConditionExtension): ConditionExtension
    andNot(condition:ConditionExtension): ConditionExtension
    orNot(condition:ConditionExtension): ConditionExtension
}

export interface ConditionColumn {
    model:string
    column:string
    operand:OPERAND
    value:any
    ands: Array<Condition>
    ors: Array<Condition>
    isNot: boolean
}

export type RoConditionColumn = Readonly<ConditionColumn>

/**
 * 
 */
export class Condition implements ConditionOperand, ConditionExtension, ConditionColumn {

    constructor(
        public model:string,
        public column:string,
        public operand:OPERAND = undefined,
        public value:any = undefined,
        public ands: Array<Condition> = [],
        public ors: Array<Condition> = [],
        public isNot: boolean = false
    ){}

    notNull(): ConditionExtension {
        this.operand = OPERAND.NOT_NULL
        return this
    }

    isNull(): ConditionExtension {
        this.operand = OPERAND.IS_NULL
        return this
    }

    equals(value:any): ConditionExtension {
        this.operand = OPERAND.EQUALS
        this.value = value
        return this
    }

    notEquals(value:any): ConditionExtension {
        this.operand = OPERAND.NOT_EQUALS
        this.value = value
        return this
    }

    gt(value:any): ConditionExtension {
        this.operand = OPERAND.GREATER_THAN
        this.value = value
        return this
    }

    gte(value:any): ConditionExtension {
        this.operand = OPERAND.GREATER_THAN_EQUAL
        this.value = value
        return this
    }

    lt(value:any): ConditionExtension {
        this.operand = OPERAND.LESS_THAN
        this.value = value
        return this
    }

    lte(value:any): ConditionExtension {
        this.operand = OPERAND.LESS_THAN_EQUAL
        this.value = value
        return this
    }

    in(values:Array<any>): ConditionExtension {
        this.operand = OPERAND.IN
        this.value = values
        return this
    }

    notIn(values:Array<any>): ConditionExtension {
        this.operand = OPERAND.NOT_IN
        this.value = values
        return this
    }

    between(greaterThan:number, lessThan:number): ConditionExtension {
        this.operand = OPERAND.BETWEEN
        this.value = [greaterThan, lessThan]
        return this
    }

    and(condition:ConditionExtension): ConditionExtension {
        this.ands.push(<Condition>condition)
        return this
    }
    or(condition:ConditionExtension): ConditionExtension {
        this.ors.push(<Condition>condition)
        return this
    }
    andNot(condition:ConditionExtension): ConditionExtension {
        let c:Condition = <Condition>condition
        c.isNot = true
        this.ands.push(c)
        return this
    }
    orNot(condition:ConditionExtension): ConditionExtension {
        let c:Condition = <Condition>condition
        c.isNot = true
        this.ors.push(c)
        return this
    }

}