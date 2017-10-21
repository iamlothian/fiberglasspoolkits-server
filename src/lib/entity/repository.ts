// import "reflect-metadata"

// import * as Injector from 'typescript-injector-lite'
// import * as API from "../api"
// import { DTO, Datastore, Queryable } from "../orm"
// import { Query, QueryColumn } from '../drivers/psql'

// import { Model } from './model'
// import { Entity } from './entity'
// import { ENTITY_STATE, normalizeEntityState } from './state'

// @Injector.service()
// class Repository<E extends Model> {

//     /**
//      * insert a new deserialized entity into the Datastore
//      * @param entityType the constructor of the entity to use for deserialize
//      * @param json the object to try deserialized into the entity type
//      */
//     async create(entityType: { new (): E; }, json:object): Promise<E> {
        
//         let entity:E 
        
//         try {
//             entity = Entity.deserializeViewModel(entityType, json)
//         } catch (error) {
//             throw new API.BadRequest(error.message)
//         }

//         let query = Query.insert<E>(entity),
//             db:Datastore.Driver = Injector.instantiate('DB'),
//             result = await db.execute(query)

//         return await Entity.deserializeTableRow(entityType, result.rows[0])
//     }

//     /**
//      * create a new version of an active entity in the Datastore
//      * @param entityType the constructor of the entity to use for deserialize
//      * @param json the object to try deserialized into the entity type
//      * @param state the state of the active version to update
//      */
//     async updateVersion(entityType: { new (): E; }, json:object, state:ENTITY_STATE=ENTITY_STATE.PUBLIC): Promise<E> {
//         state = normalizeEntityState(state)
//         let newEntity

//         try {
//             newEntity = Entity.deserializeViewModel(entityType, json, true)
//         } catch (error) {
//             throw new API.BadRequest(error.message)
//         }

//         let versions:Array<E> = await Entity.getVersions(entityType, newEntity.entityId),
//             now = new Date()

//         if (versions.length === 0){
//             return undefined
//         }

//         // find the current active version 
//         let currentVersion = versions.find(e => 
//             e.state == state && 
//             e.activateAt <= now && 
//             (e.deactivateAt === undefined || e.deactivateAt >= now)
//         )
        
//         // set version of new entity
//         newEntity.state = currentVersion.state
//         newEntity.version = versions.length+1
//         let insertQuery = Query.insert<E>(newEntity),
//             db:Datastore.Driver = Injector.instantiate('DB'),
//             result = await db.execute(insertQuery)

//         // update deactivateAt date of current version
//         currentVersion.deactivateAt = newEntity.activateAt
//         await Entity.updateReplace(currentVersion)

//         return await Entity.deserializeTableRow(entityType, result.rows[0])
//     }

//     /**
//      * update the value of an existing entity in the Datastore
//      * @param entitye the constructor of the entity to use for deserialize
//      */
//     static async updateReplace<E extends Entity>(entity:E): Promise<E> {

//         let query = Query.update<E>(entity)
//                     .where(e=>e.column('id').equals(entity.id)),

//             db:Datastore.Driver = Injector.instantiate('DB'),
//             result = await db.execute(query)

//         return await entity
//     }
    
//     /**
//      * get all rows and versions of an entity type from the Datastore, allows custom query conditions to be supplied
//      * @param entityType the constructor of the entity to use for deserialize
//      * @param state the minimum state of the entities to return
//      * @param and any extra condition to apply to the selected set
//      */
//     static async getAll<E extends Entity>(entityType: { new (): E; }, state:ENTITY_STATE=ENTITY_STATE.PUBLIC, and:(query:Queryable.Queryable<E>) => Queryable.Queryable<E> = q=>q) : Promise<Array<E>> {
//         state = normalizeEntityState(state)
//         let query = and(Query.select(entityType).where(e=>e.column('state').gte(state))),
//             db:Datastore.Driver = Injector.instantiate('DB'),

//         result = await db.execute(query)
        
//         return await result.rows.map(row=>Entity.deserializeTableRow(entityType, row))
//     }

//     /**
//      * get the current active versions of an entity in the Datastore
//      * @param entityType the constructor of the entity to use for deserialize
//      * @param entityId the entity id to search 
//      * @param state the state of the active version required
//      */
//     static async getByEntityId<E extends Entity>(entityType: { new (): E; }, entityId:string, state:ENTITY_STATE=ENTITY_STATE.PUBLIC): Promise<E> {
//         state = normalizeEntityState(state)
//         let now = new Date().toUTCString(),

//             query = Query.select(entityType)
//                     .where(e=>e.column('entityId').equals(entityId))
//                     .and(e=>e.column('state').gte(state))
//                     .and(e=>e.column('activateAt').lte(now))
//                     .and(
//                         e=>e.column('deactivateAt').isNull()
//                         .or(e=>e.column('deactivateAt').gte(now))
//                     )
//                     .orderBy([['activateAt','DESC']])
//                     .limit(1),

//             db:Datastore.Driver = Injector.instantiate('DB'),
//             result = await db.execute(query)

//         return await result.rowCount !== 0 ? 
//             Entity.deserializeTableRow(entityType, result.rows[0]) :
//             undefined
//     }

//     /**
//      * get all active entities from the Datastore, allows custom query conditions to be supplied
//      * @param entityType the constructor of the entity to use for deserialize
//      * @param state the minimum state of the entities to return
//      * @param and any extra condition to apply to the selected set
//      */
//     static async getAllActive<E extends Entity>(entityType: { new (): E; }, state:ENTITY_STATE=ENTITY_STATE.PUBLIC, and:(query:Queryable.Queryable<E>) => Queryable.Queryable<E> = q=>q) : Promise<Array<E>> {
//         state = normalizeEntityState(state)
//         let now = new Date().toUTCString(),
//             query = and(
//                 Query.select(entityType, ['entityId'])
//                     .where(e=>e.column('state').gte(state))
//                     .and(e=>e.column('activateAt').lte(now))
//                     .and(
//                         e=>e.column('deactivateAt').isNull()
//                         .or(e=>e.column('deactivateAt').gte(now))
//                     )
//             ).orderBy([['entityId'],['activateAt','DESC']]),
//         db:Datastore.Driver = Injector.instantiate('DB'),

//         result = await db.execute(query)
        
//         return await result.rows.map(row=>Entity.deserializeTableRow(entityType, row))
//     }

//     /**
//      * get a specific entity by its row ID from the Datastore
//      * @param entityType the constructor of the entity to use for deserialize
//      * @param id the row id to use for the search
//      */
//     static async getByRowID<E extends Entity>(entityType: { new (): E; }, id:number): Promise<E> {
//         let query = Query.select(entityType).where(
//                 e=>e.column('id').equals(id)
//             ),

//             db:Datastore.Driver = Injector.instantiate('DB'),
//             result = await db.execute(query)
            
//         return await result.rowCount !== 0 ? 
//             Entity.deserializeTableRow(entityType, result.rows[0]) :
//             undefined
//     }
//     /**
//      * 
//      * @param entityType 
//      * @param entityId 
//      */
//     static async getVersions<E extends Entity>(entityType: { new (): E; }, entityId: string): Promise<Array<E>> {
//         let query = Query.select(entityType)
//                     .where(e=>e.column('entityId').equals(entityId))
//                     .orderBy([['version','DESC']]),

//         db:Datastore.Driver = Injector.instantiate('DB'),
//         result = await db.execute(query)
        
//         return await result.rows.map(row=>Entity.deserializeTableRow(entityType, row))
//     }

//     /**
//      * 
//      * @param type 
//      * @param tableColumn 
//      */
//     static deserializeTableRow<T extends Model>(type: { new(): T; }, tableColumn: object): T {
//         let inst:T = super.deserializeTableRow(type, tableColumn)

//         getRelationships(inst).forEach(rel=>{

//             let target = <{ new(): Entity }>rel.mappedByCtor

//             switch(rel.type){

//                 case "oneToMany":
//                     inst[rel.property] = new LazyLoad(async loader=>{
//                         return await Entity.getAllActive(target, inst['state'], 
//                             q=>q.and(c=>c.column(rel.joinColumn).equals(inst[rel.joinColumn]))
//                         )
//                     })
//                     break

//                 case "manyToOne":
//                     inst[rel.property] = new LazyLoad(async loader=>{
//                         return await Entity.getByEntityId(target, inst[rel.joinColumn])
//                     })
//                     break

//                 case "manyToMany":
//                     break
//             }

//         })

//         return inst
//     }

//         /**
//      * Take a model instance and return a POJO the represents it and complies with the column metadata and rules
//      * @param model the model instance to deserialize
//      */
//     static async serialize<T extends DTO.Model>(model: T, depth:number = 1): Promise<object> {
//         let viewModel = await super.serialize(model, depth)

//         // load lazy loaded values
//         let lazyValues = await Promise.all(
//             getRelationships(model).map(async r => {
//                 return {
//                     property: r.property,
//                     value: await (<LazyLoad<any>>model[r.property]).load()
//                 }
//             })
//         )

//         // copy values to view model
//         lazyValues.forEach(l => {
//             viewModel[l.property] = l.value
//         })

//         return await viewModel
//     }

// }