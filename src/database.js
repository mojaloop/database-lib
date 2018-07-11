'use strict'

const Knex = require('knex')
const P = require('bluebird')
const Table = require('./table')
const url = require('url')

class Database {
  constructor () {
    this._knex = null
    this._tables = []
    this._schema = null

    this._listTableQueries = {
      'mysql': (k) => {
        return k('information_schema.tables').where('TABLE_SCHEMA', this._schema).select('TABLE_NAME').then(rows => rows.map(r => r.TABLE_NAME))
      }
    }
  }

  getKnex () {
    if (!this._knex) {
      throw new Error('The database must be connected to get the database object')
    }
    return this._knex
  }

  connect (connectionString) {
    if (!this._knex) {
      this._schema = parseDatabaseSchema(connectionString)
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
      mysql: { client: 'mysql' }
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

const parseDatabaseSchema = (uri) => {
  const schema = url.parse(uri, true, false)
  if (schema.pathname) {
    return schema.pathname.replace('/', '')
  } else {
    throw new Error('Invalid database type in database URI')
  }
}

module.exports = Database
