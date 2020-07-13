/**
 * (c) Phan Trung Nguyên <nguyenpl117@gmail.com>
 * User: nguyenpl117
 * Date: 4/9/2020
 * Time: 8:59 PM
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { FakeLogger as Logger } from '@adonisjs/logger/build/standalone'
import { Profiler } from '@adonisjs/profiler/build/standalone'
import { Filesystem } from '@poppinss/dev-utils'
import * as dotenv from 'dotenv'
import * as knex from 'knex';
import { join } from 'path'
import {ConnectionConfig} from "@tngraphql/lucid/build/src/Contracts/Connection/types";
import {Database} from "@tngraphql/lucid";
import {DatabaseContract} from "@tngraphql/lucid/build/src/Contracts/Database/DatabaseContract";
import {AdapterContract} from "@tngraphql/lucid/build/src/Contracts/Orm/AdapterContract";
import {BaseModel} from "@tngraphql/lucid/build/src/Orm/BaseModel";
import {LucidModel} from "@tngraphql/lucid/build/src/Contracts/Model/LucidModel";
import {Adapter} from "@tngraphql/lucid/build/src/Orm/Adapter";
export const fs = new Filesystem(join(__dirname, 'tmp'))
dotenv.config()

/**
 * Returns config based upon DB set in environment variables
 */
export function getConfig(): ConnectionConfig {
    switch (process.env.DB) {
    case 'sqlite':
        return {
            client: 'sqlite',
            connection: {
                filename: join(fs.basePath, 'db.sqlite')
            },
            useNullAsDefault: true,
            debug: false
        }
    case 'mysql':
        return {
            client: 'mysql',
            connection: {
                host: process.env.MYSQL_HOST as string,
                port: Number(process.env.MYSQL_PORT),
                database: process.env.DB_NAME as string,
                user: process.env.MYSQL_USER as string,
                password: process.env.MYSQL_PASSWORD as string
            },
            useNullAsDefault: true
        }
    case 'mysql2':
            return {
                client: 'mysql2',
                connection: {
                    host: process.env.MYSQL_HOST as string,
                    port: Number(process.env.MYSQL_PORT),
                    database: process.env.DB_NAME as string,
                    user: process.env.MYSQL_USER as string,
                    password: process.env.MYSQL_PASSWORD as string
                },
                useNullAsDefault: true
            }
    case 'pg':
        return {
            client: 'pg',
            connection: {
                host: process.env.PG_HOST as string,
                port: Number(process.env.PG_PORT),
                database: process.env.DB_NAME as string,
                user: process.env.PG_USER as string,
                password: process.env.PG_PASSWORD as string
            },
            useNullAsDefault: true
        }
    case 'mssql':
        return {
            client: 'mssql',
            connection: {
                user: process.env.MSSQL_USER as string,
                server: process.env.MSSQL_SERVER as string,
                password: process.env.MSSQL_PASSWORD as string,
                database: 'master',
                // options: {
                //     enableArithAbort: true
                // }
            },
            pool: {
                min: 0,
                idleTimeoutMillis: 300
            }
        }
    default:
        throw new Error(`Missing test config for ${ process.env.DB } connection`)
    }
}

/**
 * Does base setup by creating databases
 */
export async function setup(destroyDb: boolean = true) {
    if ( process.env.DB === 'sqlite' ) {
        await fs.ensureRoot()
    }

    const db = knex(Object.assign({}, getConfig(), { debug: false }))

    const hasUsersTable = await db.schema.hasTable('users')
    if ( ! hasUsersTable ) {
        await db.schema.createTable('users', (table) => {
            table.increments()
            table.integer('country_id')
            table.integer('is_active')
            table.string('username', 100).unique()
            table.string('email', 100).unique()
            table.integer('points').defaultTo(0)
            table.dateTime('joined_at', { useTz: process.env.DB === 'mssql' })
            table.timestamp('created_at').defaultTo(db.fn.now())
            table.timestamp('updated_at').nullable()
        })
    }

    const hasFriendsTable = await db.schema.hasTable('friends')
    if ( ! hasFriendsTable ) {
        await db.schema.createTable('friends', (table) => {
            table.increments()
            table.string('username', 100).unique()
            table.timestamp('created_at').defaultTo(db.fn.now())
            table.timestamp('updated_at').nullable()
        })
    }

    const hasCountriesTable = await db.schema.hasTable('countries')
    if ( ! hasCountriesTable ) {
        await db.schema.createTable('countries', (table) => {
            table.increments()
            table.string('name')
            table.timestamps()
        })
    }

    const hasSkillsTable = await db.schema.hasTable('skills')
    if ( ! hasSkillsTable ) {
        await db.schema.createTable('skills', (table) => {
            table.increments()
            table.string('name').notNullable()
            table.integer('is_active').nullable()
            table.timestamps()
        })
    }

    const hasUserSkillsTable = await db.schema.hasTable('skill_user')
    if ( ! hasUserSkillsTable ) {
        await db.schema.createTable('skill_user', (table) => {
            table.increments()
            table.integer('user_id')
            table.integer('skill_id')
            table.string('proficiency')
            table.timestamps()
        })
    }

    const hasPostsTable = await db.schema.hasTable('posts')
    if ( ! hasPostsTable ) {
        await db.schema.createTable('posts', (table) => {
            table.increments()
            table.integer('user_id')
            table.string('title').notNullable()
            table.timestamps()
        })
    }

    const hasComments = await db.schema.hasTable('comments')
    if ( ! hasComments ) {
        await db.schema.createTable('comments', (table) => {
            table.increments()
            table.integer('post_id')
            table.string('body')
            table.timestamps()
        })
    }

    const hasProfilesTable = await db.schema.hasTable('profiles')
    if ( ! hasProfilesTable ) {
        await db.schema.createTable('profiles', (table) => {
            table.increments()
            table.integer('user_id')
            table.string('display_name').notNullable()
            table.string('type').nullable()
            table.timestamps()
        })
    }

    const hasIdentitiesTable = await db.schema.hasTable('identities')
    if ( ! hasIdentitiesTable ) {
        await db.schema.createTable('identities', (table) => {
            table.increments()
            table.integer('profile_id')
            table.string('identity_name')
            table.timestamps()
        })
    }

    if ( destroyDb ) {
        await db.destroy()
    }
}

/**
 * Does cleanup removes database
 */
export async function cleanup(customTables?: string[]) {
    const db = knex(Object.assign({}, getConfig(), { debug: false }))

    if ( customTables ) {
        await Promise.all(customTables.map((table) => db.schema.dropTableIfExists(table)))
        await db.destroy()
        return
    }

    await db.schema.dropTableIfExists('users')
    await db.schema.dropTableIfExists('friends')
    await db.schema.dropTableIfExists('countries')
    await db.schema.dropTableIfExists('skills')
    await db.schema.dropTableIfExists('skill_user')
    await db.schema.dropTableIfExists('profiles')
    await db.schema.dropTableIfExists('posts')
    await db.schema.dropTableIfExists('comments')
    await db.schema.dropTableIfExists('identities')
    await db.schema.dropTableIfExists('knex_migrations')

    await db.destroy()
}

/**
 * Reset database tables
 */
export async function resetTables() {
    const db = knex(Object.assign({}, getConfig(), { debug: false }))
    await db.table('users').truncate()
    await db.table('friends').truncate()
    await db.table('countries').truncate()
    await db.table('skills').truncate()
    await db.table('skill_user').truncate()
    await db.table('profiles').truncate()
    await db.table('posts').truncate()
    await db.table('comments').truncate()
    await db.table('identities').truncate()
    await db.destroy()
}

/**
 * Returns fake logger instance
 */
export function getLogger() {
    return new Logger({
        enabled: true,
        name: 'lucid',
        level: 'debug',
        prettyPrint: false
    })
}

/**
 * Returns emitter instance
 */
export function getEmitter() {
    return {emit: function () {

        }, hasListeners: function () {

        }} as any;
}

/**
 * Returns profiler instance
 */
export function getProfiler(enabled: boolean = false) {
    return new Profiler(__dirname, getLogger(), { enabled })
}

/**
 * Returns the database instance
 */
export function getDb(emitter?: any) {
    const config = {
        connection: 'primary',
        connections: {
            primary: getConfig(),
            secondary: getConfig()
        }
    }

    return new Database(config, getLogger(), getProfiler(), emitter || getEmitter()) as DatabaseContract
}

/**
 * Returns the orm adapter
 */
export function ormAdapter(db: DatabaseContract) {
    return new Adapter(db)
}

/**
 * Returns the base model with the adapter attached to it
 */
export function getBaseModel(adapter: AdapterContract, container?: any) {
    BaseModel.$adapter = adapter
    // BaseModel.$container = container || new Application()
    return BaseModel as unknown as LucidModel
}

/**
 * Converts a map to an object
 */
export function mapToObj<T extends any>(collection: Map<any, any>): T {
    let obj = {} as T
    collection.forEach((value, key) => {
        obj[key] = value
    })
    return obj
}

/**
 * Split string to an array using cross platform new lines
 */
export function toNewlineArray(contents: string): string[] {
    return contents.split(/\r?\n/)
}
