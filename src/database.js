'use strict'

const Knex = require('knex')
const P = require('bluebird')
const Table = require('./table')

class Database {
  constructor () {
    this._knex = null
    this._tables = []

    this._listTableQueries = {
      'pg': (k) => {
        return k('pg_catalog.pg_tables').where({ schemaname: 'public' }).select('tablename').then(rows => rows.map(r => r.tablename))
      }
    }
  }

  connect (connectionString) {
    if (!this._knex) {
      return configureKnex(connectionString).then(knex => {
        this._knex = knex

        return this._listTables().then(tables => {
          this._tables = tables
          this._setTableProperties()
        })
      })
    }
    return P.resolve()
  }

  disconnect () {
    if (this._knex) {
      this._removeTableProperties()
      this._tables = []

      this._knex.destroy()
      this._knex = null
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
}

const configureKnex = (connectionString) => {
  return new P((resolve, reject) => {
    const knexConfig = {
      postgres: { client: 'pg' }
    }

    const dbType = parseDatabaseType(connectionString)
    if (!knexConfig[dbType]) {
      reject(new Error('Invalid database type in database URI'))
    } else {
      const commonConfig = { connection: connectionString }
      resolve(Knex(Object.assign(commonConfig, knexConfig[dbType])))
    }
  })
}

const parseDatabaseType = (uri) => {
  return uri.split(':')[0]
}

module.exports = Database
