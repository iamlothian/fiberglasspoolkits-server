import { Column, column, getColumns } from './column'
import { getTableName } from './table'
import { getFormat } from './formatter'

/**
 * The base abstract class for supporting ORM models, it provides metadata helpers used by the Query and Datastore abstractions
 * and the ability to serialize & deserialize or patch ORM models
 */
export abstract class Model {
    
    @column({
        name:"id", 
        isReadOnly:true, 
        isProtected:true,
        isPrivate:true,
        dbType:'serial', 
        dbIsPrimaryKey:true
    })
    /**
     * This private _id is designed to only allow deserialize models from the Datastore to provide a value
     */
    private _id: number = undefined
    /**
     * The most basic field required for ORM the numeric primary key
     */
    get id():number {
        return this._id
    }

    /**
     * get the columns metadata for this instance
     */
    get columns(): Array<Column> {
        return getColumns(this)
    }

    /**
     * get the metadata table name 
     */
    get tableName(): string {
        return getTableName(Object.getPrototypeOf(this).constructor)
    }

    protected constructor(){}

    /**
     * Create a new instance using the provided constructor type, and map the provided viewModel properties to it where supported on the constructor
     * @param type the constructor function to use for deserialization  
     * @param tableColumn the serializedModel to deserialize to a Model instance
     */
    static deserializeTableRow<T extends Model>(type: { new(): T; }, tableColumn: object): T {
        let inst: T = new type(),
        errors = new Array<string>()

        if (tableColumn['id'] === undefined){
            throw new Error("- deserialize expects tableColumn to contain the property [id]")
        }

        inst.columns.forEach(c => {

            if (tableColumn[c.name] != undefined){
                inst[c.property] = tableColumn[c.name]
            }
        })

        if (errors.length>0){
            throw new Error(errors.join('\n'))
        }
        

        return inst
    }
    /**
     * Create a new instance using the provided constructor type, and map the provided viewModel properties to it where supported on the constructor.
     * The created instance will be a shallow entity and not contain joins or relationships, as this method is designed to validate a vew model for use with a datastore 
     * @param type the constructor function to use for deserialization  
     * @param viewModel the serializedModel to deserialize to a Model instance
     */
    static deserializeViewModel<T extends Model>(type: { new(): T; }, viewModel: object, skipRequiredCheck:boolean = false): T {
       
        let inst: T = new type(),
            errors = new Array<string>()

        inst.columns.forEach(c => {
            if (!skipRequiredCheck && c.isRequired && viewModel[c.property] == undefined){
                errors.push('- Required property ['+c.property+'] of model ['+inst.tableName+'] not present in request')
            }
            if (c.isProtected && viewModel[c.property] != undefined){
                viewModel[c.property] = undefined
                errors.push('- Protected properties ['+c.property+'] of model ['+inst.tableName+'] can not be present in request')
            }
            if (viewModel[c.property] != undefined){
                inst[c.property] = viewModel[c.property]
            }
            
        })
        
        if (errors.length>0){
            throw new Error(errors.join('\n'))
        }

        return inst
    }

    /**
     * Patch and existing instance of a Model by mapping the viewModel properties to it, where supported on the constructor
     * @param model the model instance to patch
     * @param viewModel the viewModel to patch onto the instance
     */
    static patch<T extends Model>(model:T, viewModel: object): T {

        model.columns.forEach(c => {
            if (viewModel[c.property] != undefined){
                model[c.property] = viewModel[c.property]
            }
        })

        return model
    }

    /**
     * Take a model instance and return a POJO the represents it and complies with the column metadata and rules
     * @param model the model instance to deserialize
     */
    static async serialize<T extends Model>(model: T, depth:number = 1): Promise<object> {
        let viewModel = model.columns
            .filter(c => !c.isPrivate)
            .map(c => { 
                let fmttr = getFormat(model,c.property)
                c.value = !!fmttr ? fmttr(c.value) : c.value
                return c
            })
            .reduce((o,c) => {o[c.property] = c.value; return o}, {})
            
        return await viewModel
    }

}

/**
 * 
 * @param db 
 */
// export async function syncModels(syncDb:SyncDriver): Promise<Array<any>>{

//     console.log('======= Sync Models =======')

//     let modelList = new Array<Model>()
//     models.forEach(c=>{
//         let inst:Model = Injector.instantiate(c)
//         modelList.push(inst)
//     })

//     let deltaList = await Sync.syncModelDeltas(modelList)

//     deltaList.map(d=>syncDb.modelDeltaToQuery(d))

//     return modelList
// }
