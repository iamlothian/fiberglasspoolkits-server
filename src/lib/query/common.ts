import { Model } from '../model'

export type Diff<T extends string, U extends string> = (
    {[P in T]: P } & 
    {[P in U]: never } & 
    { [x: string]: never }
)[T];    

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export type Overwrite<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] } & U;

export type OmitModelMeta<T extends Model> = Omit<T, 'columns'|'tableName'>