'use strict'

const Knex = require('knex')
const Table = require('./table')

class Database {
  constructor () {
    this._knex = null
    this._tables = []
    this._schema = null

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

  async connect (config) {
    if (!this._knex) {
      if (config.connection.database) {
        this._schema = config.connection.database
        return configureKnex(config).then(knex => {
          this._knex = knex
          return this._listTables().then(tables => {
            this._tables = tables
            this._setTableProperties()
          })
        })
      } else {
        throw new Error('Invalid database schema in database config')
      }
    }
    return null
  }

  async disconnect () {
    if (this._knex) {
      this._removeTableProperties()
      this._tables = []
      await this._knex.destroy()
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

const configureKnex = async (config) => {
  return Knex(config)
}

module.exports = Database
