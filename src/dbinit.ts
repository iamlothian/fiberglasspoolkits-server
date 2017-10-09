import { Drivers, ORM } from './lib'

// Import controllers entry point
import './controllers'

// connect using admin connection
const adminDB = new Drivers.Postgres.Driver(
    'postgresql://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost:5432/fpkdb', 'ADMIN'
)

/**
 * Does a user name exist in the DB already
 * @param username 
 */
async function userExists(username: string): Promise<boolean> {
    let result = await adminDB.query(
        `SELECT COUNT(*) != 0 as exists FROM pg_roles WHERE rolname = '${username}'`
    )
    return await result.rows[0].exists
}

/**
 * Create a user name on the database and grant it privileges
 * @param username 
 * @param password 
 * @param privileges 
 * @param schema 
 */
async function createUser(username: string, password: string, privileges: Array<string>, schema: string = 'public'): Promise<void> {
    await adminDB.query(`
        CREATE ROLE ${username} WITH LOGIN PASSWORD '${password}';
        GRANT ${privileges.join(', ')} ON ALL TABLES IN SCHEMA ${schema} TO ${username};
        ALTER DEFAULT PRIVILEGES IN SCHEMA  ${schema} GRANT ${privileges.join(', ')} ON TABLES TO ${username};
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${username};
        ALTER DEFAULT PRIVILEGES IN SCHEMA  public GRANT USAGE, SELECT ON SEQUENCES TO ${username};
    `)
}

// try init DB
(async () => {

    // let models = ORM.DTO.syncModels(
    //     new Drivers.Postgres.SyncDriver(adminDB)
    // )

    let exists = true
    exists = await userExists(process.env.POSTGRES_RO_USER)
    if (!exists) {
        await createUser(process.env.POSTGRES_RO_USER, process.env.POSTGRES_RO_PASSWORD, ['SELECT'])
    }

    exists = await userExists(process.env.POSTGRES_RW_USER)
    if (!exists) {
        await createUser(process.env.POSTGRES_RW_USER, process.env.POSTGRES_RW_PASSWORD, ['SELECT', 'UPDATE', 'INSERT'])
    }

    // close admin connection
    await adminDB.end()
})()

// export drivers
export const RO_DB = new Drivers.Postgres.Driver(
    'postgresql://' + process.env.POSTGRES_RO_USER + ':' + process.env.POSTGRES_RO_PASSWORD + '@localhost:5432/fpkdb', 'DB_POOL_READ_ONLY'
)

export const RW_DB = new Drivers.Postgres.Driver(
    'postgresql://' + process.env.POSTGRES_RW_USER + ':' + process.env.POSTGRES_RW_PASSWORD + '@localhost:5432/fpkdb', 'DB_POOL_READ_WRITE'
)

