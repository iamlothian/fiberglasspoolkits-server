import { Model, Column } from '../model'
import { Queryable } from './queryable'


export interface QueryableRunner {

    run<T extends Model>(query:Queryable<T>): any

}