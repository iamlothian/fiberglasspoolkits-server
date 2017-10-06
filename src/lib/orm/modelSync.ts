import * as fs from 'fs'
import { Model, Column } from './model'

const MODEL_VERSION_DIR = process.env.MODEL_VERSION_DIR || './_dbsync'

class ModelVersion {
    constructor(
        public createdAt:Date,
        public columns:Array<Column>,
        public removed:Array<string> = []
    ){}
}

export function writeModels<T extends Model>(models:Array<T>): Promise<any> {

    if (!fs.existsSync(MODEL_VERSION_DIR)){
        fs.mkdirSync(MODEL_VERSION_DIR);
    }

    return new Promise<any>((resolve, reject) => {

        // touch all the expected entities
        models.forEach(m=>{
            fs.open(MODEL_VERSION_DIR+'/'+m.tableName+'.json', 'a', (err, fd)=>{
                if (err) throw err}
            )
        })

        // then loop through files in directory
        fs.readdir(MODEL_VERSION_DIR, 'utf8', (err, files)=>{

            files.forEach(fn=>{

                let model = models.find(m=>m.tableName+'.json' === fn)

                if (model === undefined){
                    console.log('Model '+fn+' no long er exists')
                } else {

                    checkAndWriteModel(model, resolve, reject)

                }

            })

        })

    })

}


function checkAndWriteModel<T extends Model>(model:T, resolve, reject):void {

    let fileName = MODEL_VERSION_DIR+'/'+model.tableName+'.json'

    fs.readFile(fileName, { encoding: 'utf8' }, (err, data) => {
        if (err) throw err

        let inData:Array<ModelVersion> = data ? JSON.parse(data) : undefined, 
            outData:Array<ModelVersion>
        
        // existing data
        if (inData){
            // get aggregated version of changes
            let version = aggregateModelDeltas(inData),
                delta:ModelDelta = getModelDelta(model.columns, version.columns)
            // add delta if exists
            if (delta.hasDelta){
                inData.push(
                    new ModelVersion( new Date(), delta.changed, delta.removed)
                )
            }
            outData = inData
        } 
        // initial file data
        else {
            outData = [
                new ModelVersion(
                    new Date(),
                    model.columns.map(c=>{ 
                        // strip value
                        c.value = undefined; return c
                    })
                )
            ]
        }

        fs.truncate(fileName, 0, (err) => {
            if (err) throw err
            fs.writeFile(fileName, JSON.stringify(outData, null, '\t'), (err) => {
                if (err) throw err
                resolve(inData)
            })
        })
            
    });

}

interface ModelDelta {
    hasDelta: boolean,
    changed: Array<Column>
    removed: Array<string>
}

/**
 * Return the Outer union or delta of two tables
 * @param modelA 
 * @param modelB 
 */
function getModelDelta(modelA:Array<Column>, modelB:Array<Column>): ModelDelta {

    
    let ModelDelta = {
        changed: new Array<Column>(),
        removed: new Array<string>(), 
        hasDelta: false
    }

    // for all the columns in modelB
    modelB.forEach(columnB=>{
        // find the column on A
        let columnA:Column = modelA.find(cb=> cb.name === columnB.name)

        // column has been removed
        if (columnA === undefined){
            ModelDelta.hasDelta = true
            ModelDelta.removed.push(columnB.name)
        }
        
    })

    // for all the columns in modelA
    modelA.forEach(columnA=>{
        // find the column on B 
        let columnB:Column = modelB.find(cb=> cb.name === columnA.name)

        // new column has been added
        if (columnB === undefined){
            ModelDelta.hasDelta = true
            ModelDelta.changed.push(columnA)
        } 
        // find column properties that dont match A and create a column that is the outer union of A & B
        else { 
            let columnDelta:Column = { name:columnA.name, dbType:columnA.dbType },
                deltaProps = new Array<string>()
                Object.getOwnPropertyNames(columnA).forEach(p=>{ 
                    if (p != 'value' && columnB[p] !== columnA[p]) {
                        deltaProps.push(p)
                    }
                })
                
            // add a column contained the delta properties
            if (deltaProps.length > 0){
                ModelDelta.hasDelta = true
                deltaProps.forEach(p=>columnDelta[p] = columnA[p])
                ModelDelta.changed.push(columnDelta)
            }

        }
    })

    return ModelDelta

}

/**
 * Build the current version of the model by applying the history of changes made to it
 * @param versions 
 */
function aggregateModelDeltas<T extends Model>(versions:Array<ModelVersion>): ModelVersion{
    
        return versions.reduce((agg:ModelVersion=undefined, cur:ModelVersion, idx:number)=>{
            
            if (!agg){
                return cur // start at the current version
            }else{
                // for all the columns in the current ModelVersion
                cur.columns.forEach(c=>{
                    // find the column on the aggregate ModelVersion
                    let columnIdx = agg.columns.findIndex(mc=> mc.name === c.name)

                    // new column has been added
                    if (columnIdx === -1){
                        agg.columns.push(c)
                    } 
                    // column exist in both versions
                    // iterate through the properties of the current ModelVersion
                    // and update the values onto the aggregate ModelVersion
                    else {
                        let column = agg.columns[columnIdx]
                        Object.getOwnPropertyNames(c).forEach(p=>column[p] = c[p])
                    }
 
                })
                // for all the columns in the removed set
                cur.removed.forEach(c=>{
                    // find the column index on the aggregate
                    let columnIdx = agg.columns.findIndex(mc=> mc.name === c)

                    if (columnIdx>0){
                        agg.columns.splice(columnIdx,1)
                    }
                })
                return agg // continue to build on top of the aggregate
            }
    
        })
        
    }

export function syncToDatastore<T extends Model>(model:T): string {
    let script:string = ''+
            `CREATE TABLE IF NOT EXISTS ${model.tableName} (\n`+
                `${model.columns.map(c=>{
                    let column = [c.name, typeof c.dbType === 'string' ? c.dbType : c.dbType[0]+'('+c.dbType[1]+')']
                        
                    !c.dbNotNull && column.push('NOT NUL')
                    c.dbIsPrimaryKey && column.push('CONSTRAINT '+c.name+'_pk PRIMARY KEY')

                    return '\t'+column.join('\t')
                }).join(',\n')}`+
            '\n);'

    return script
}