import * as fs from 'fs'
import { Model, Column, DBColumn } from './model'

const MODEL_VERSION_DIR = process.env.MODEL_VERSION_DIR || './_dbsync'
const PROP_WHITELIST: Array<keyof DBColumn> = ['name', 'dbType', 'dbNotNull', 'dbIsPrimaryKey', 'dbIsUnique', 'dbIsIndexed']

/**
 * pick a subset of properties from a class / interface into a new object
 * @param keys 
 * @param src 
 */
function pick<T>(keys: Array<keyof T>, src: T): T {
    return keys.reduceRight<any>((dest, key) => {
        dest[key] = src[key]; return dest
    }, {})
}

class ModelVersion {
    constructor(
        public createdAt: Date,
        public modified: Array<Column>,
        public ledger: Array<string> = []
    ) { }
}

enum LEDGER_OPERATION {ADD,REMOVE,MODIFY,RENAME}
type LedgerEntry = [LEDGER_OPERATION, string, DBColumn]

export class ModelDelta {
    constructor(
        public table:string,
        public version:number = 1,
        public hasDelta: boolean = false,
        public modified: Array<Column> = [],
        public ledger: Array<string> = []
    ) { }
}

/**
 * 
 * @param models 
 */
export function syncModelDeltas<T extends Model>(models: Array<T>): Promise<Array<ModelDelta>> {

    if (!fs.existsSync(MODEL_VERSION_DIR)) {
        fs.mkdirSync(MODEL_VERSION_DIR);
    }


    // touch all the expected entities
    models.forEach(m => {
        fs.open(MODEL_VERSION_DIR + '/' + m.tableName + '.json', 'a', (err, fd) => {
            if (err) throw err
        })
    })

    return new Promise<Array<ModelDelta>>((resolve, reject) => {

        // then loop through files in directory
        fs.readdir(MODEL_VERSION_DIR, 'utf8', (err, files) => {

            let promises = files.map(fn => {

                let model = models.find(m => m.tableName + '.json' === fn)

                if (model === undefined) {
                    console.log('Model ' + fn + ' no long er exists')
                } else {
                    return buildAndWriteModelDelta(model)
                }

            })

            return Promise.all(promises).then((modelDeltas)=>{
                resolve(modelDeltas)
            })

        })

    })


}

/**
 * 
 * @param model 
 * @param resolve 
 * @param reject 
 */
function buildAndWriteModelDelta<T extends Model>(model: T): Promise<ModelDelta> {

    let fileName = MODEL_VERSION_DIR + '/' + model.tableName + '.json'

    return new Promise<any>((resolve, reject) => {

        fs.readFile(fileName, { encoding: 'utf8' }, (err, data) => {
            if (err) throw err

            let dbColumns = model.columns.map(c => pick<DBColumn>(PROP_WHITELIST, c)),
                inData: Array<ModelVersion> = data ? JSON.parse(data) : undefined,
                outData: Array<ModelVersion> = [],
                delta: ModelDelta = new ModelDelta(model.tableName)

            // existing data
            if (inData) {
                // get aggregated version of changes
                let modelVersion = aggregateModelDeltas(inData)
                delta = buildModelDelta(model.tableName, dbColumns, modelVersion.modified)
                delta.version = inData.length
                outData = inData
            }

            // initial file data
            else {
                delta = new ModelDelta(model.tableName, 1, true, dbColumns)
            }

            // add ModelVersion to outDate
            if (delta.hasDelta) {
                outData.push(
                    new ModelVersion(new Date(), delta.modified, delta.ledger)
                )
            }

            resolve(delta)

            fs.truncate(fileName, 0, (err) => {
                if (err) throw err
                fs.writeFile(fileName, JSON.stringify(outData, null, '\t'), (err) => {
                    if (err) throw err
                })
            })

        });

    })

}

/**
 * Return the Outer union or delta of two tables
 * @param modelA 
 * @param modelB 
 */
function buildModelDelta(tablename: string, modelA: Array<Column>, modelB: Array<Column>): ModelDelta {


    let modelDelta = new ModelDelta(tablename)

    // for all the columns in modelB
    modelB.forEach(columnB => {
        // find the column on A
        let columnA: Column = modelA.find(cb => cb.name === columnB.name)

        // column has been removed
        if (columnA === undefined) {
            modelDelta.hasDelta = true
            modelDelta.ledger.push(columnB.name)
        }

    })

    // for all the columns in modelA
    modelA.forEach(columnA => {
        // find the column on B 
        let columnB: Column = modelB.find(cb => cb.name === columnA.name)

        // new column has been added
        if (columnB === undefined) {
            modelDelta.hasDelta = true
            modelDelta.modified.push(columnA)
        }
        // find column properties that dont match A and create a column that is the outer union of A & B
        else {
            let columnDelta: Column = { name: columnA.name, dbType: columnA.dbType },
                deltaProps = new Array<string>()
            Object.getOwnPropertyNames(columnA).forEach(p => {
                if (PROP_WHITELIST.find(v => v === p) && columnB[p] !== columnA[p]) {
                    deltaProps.push(p)
                }
            })

            // add a column contained the delta properties
            if (deltaProps.length > 0) {
                modelDelta.hasDelta = true
                deltaProps.forEach(p => columnDelta[p] = columnA[p])
                modelDelta.modified.push(columnDelta)
            }

        }
    })

    return modelDelta

}

/**
 * Build the current version of the model by applying the history of changes made to it
 * @param versions 
 */
function aggregateModelDeltas<T extends Model>(versions: Array<ModelVersion>): ModelVersion {

    return versions.reduce((agg: ModelVersion = undefined, cur: ModelVersion, idx: number) => {

        if (!agg) {
            return cur // start at the current version
        } else {
            // for all the columns in the current ModelVersion
            cur.modified.forEach(c => {
                // find the column on the aggregate ModelVersion
                let columnIdx = agg.modified.findIndex(mc => mc.name === c.name)

                // new column has been added
                if (columnIdx === -1) {
                    agg.modified.push(c)
                }
                // column exist in both versions
                // iterate through the properties of the current ModelVersion
                // and update the values onto the aggregate ModelVersion
                else {
                    let column = agg.modified[columnIdx]
                    Object.getOwnPropertyNames(c).forEach(p => column[p] = c[p])
                }

            })
            // for all the columns in the removed set
            cur.ledger.forEach(c => {
                // find the column index on the aggregate
                let columnIdx = agg.modified.findIndex(mc => mc.name === c)

                // remove column from aggregate
                if (columnIdx > 0) {
                    agg.modified.splice(columnIdx, 1)
                }
            })
            return agg // continue to build on top of the aggregate
        }

    })

}