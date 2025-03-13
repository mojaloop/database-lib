'use strict'

const Knex = require('knex')
const ErrorHandler = require('@mojaloop/central-services-error-handling')
const Table = require('./table')
const Utils = require('./utils.js')
const exitHook = require('async-exit-hook')

/* Default config to fall back to when using deprecated URI connection string */
const defaultConfig = {
  connection: {
    host: 'localhost',
    port: 3306
  },
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 3000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },
  debug: false
}

class Database {
  constructor () {
    this._knex = null
    this._tables = []
    this._schema = null
    this._signalHandlersRegistered = false // Track if signal handlers are already registered

    this._listTableQueries = {
      mysql: (knex) => {
        return knex('information_schema.tables').where('TABLE_SCHEMA', this._schema).select('TABLE_NAME').then(rows => rows.map(r => r.TABLE_NAME))
      },
      pg: (knex) => {
        return knex('pg_catalog.pg_tables').where({ schemaname: 'public' }).select('tablename').then(rows => rows.map(r => r.tablename))
      }
    }
  }

  getKnex () {
    if (!this._knex) {
      throw new Error('The database must be connected to get the database object')
    }
    return this._knex
  }

  /**
   * @function connect
   *
   * @description Connect to the database given the config object. Returns null if database is already connected.
   *
   * @params {Object} config - The knex connection object. For more information see: http://knexjs.org/#Installation-client
   *
   * @returns null - if database is already connected.
   * @returns void
   *
   * @throws {Error} - if Database scheme is invalid
   */
  async connect (config) {
    if (this._knex) {
      return null
    }

    if (typeof config === 'string') {
      console.warn('`Database.connect()` called using deprecated string config. Please ugrade this to use the knex config object.')
      config = Utils.buildDefaultConfig(defaultConfig, config)
    }

    if (!config || !config.connection || !config.connection.database) {
      throw new Error('Invalid database schema in database config')
    }

    this._schema = config.connection.database
    this._maxPendingAcquire = config.maxPendingAcquire
    this._knex = await configureKnex(config)
    this._tables = await this._listTables()
    await this._setTableProperties()

    exitHook(() => this.disconnect())
  }

  async disconnect () {
    if (this._knex) {
      console.log('Closing database connection...')
      this._removeTableProperties()
      this._tables = []
      await this._knex.destroy()
      this._knex = null
      console.log('Database connection closed.')
    }
  }

  from (tableName) {
    if (!this._knex) {
      throw new Error('The database must be connected to get a table object')
    }
    return new Table(tableName, this._knex)
  }

  _setTableProperties () {
    this._tables.forEach(t => {
      Object.defineProperty(this, t, {
        get: () => {
          return new Table(t, this._knex)
        },
        configurable: true,
        enumerable: true
      })
    })
  }

  _removeTableProperties () {
    this._tables.forEach(t => delete this[t])
  }

  _listTables () {
    const dbType = this._knex.client.config.client
    if (!this._listTableQueries[dbType]) {
      throw new Error(`Listing tables is not supported for database type ${dbType}`)
    }
    return this._listTableQueries[dbType](this._knex)
  }

  assertPendingAcquires () {
    if (this._maxPendingAcquire && this._maxPendingAcquire < this._knex.client.pool.numPendingAcquires()) {
      throw ErrorHandler.CreateFSPIOPError(
        ErrorHandler.Enums.FSPIOPErrorCodes.SERVICE_CURRENTLY_UNAVAILABLE,
        `DB Pool pending acquires ${this._knex.client.pool.numPendingAcquires()} > ${this._maxPendingAcquire}`
      )
    }
  }

  getPendingAcquires () {
    if (!this._knex) {
      throw new Error('The database must be connected to get the number of pending acquires')
    }
    return this._knex.client.pool.numPendingAcquires()
  }
}

const configureKnex = async ({ maxPendingAcquire, ...config }) => {
  return Knex(config)
}

module.exports = Database
