'use strict'

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')
const lodash = require('lodash')

Test('database', databaseTest => {
  let sandbox
  let knexStub
  let tableStub
  let knexConnStub
  let Database
  let dbInstance
  let exitHookStub

  const connectionConfig = {
    client: 'mysql',
    connection: {
      host: 'some-data-uri',
      port: '9999',
      user: 'user',
      password: 'password',
      database: 'databaseSchema'
    },
    pool: {
      // minimum size
      min: 2,
      // maximum size
      max: 10,
      // acquire promises are rejected after this many milliseconds
      // if a resource cannot be acquired
      acquireTimeoutMillis: 30000,
      // create operations are cancelled after this many milliseconds
      // if a resource cannot be acquired
      createTimeoutMillis: 3000,
      // destroy operations are awaited for at most this many milliseconds
      // new resources will be created after this timeout
      destroyTimeoutMillis: 5000,
      // free resouces are destroyed after this many milliseconds
      idleTimeoutMillis: 30000,
      // how often to check for idle resources to destroy
      reapIntervalMillis: 1000,
      // long long to idle after failed create before trying again
      createRetryIntervalMillis: 200
      // ping: function (conn, cb) { conn.query('SELECT 1', cb) }
    },
    debug: false
  }
  const tableNames = [{ TABLE_NAME: 'accounts' }, { TABLE_NAME: 'users' }, { TABLE_NAME: 'tokens' }]

  databaseTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()

    exitHookStub = sandbox.stub()

    knexConnStub = sandbox.stub()
    knexConnStub.destroy = sandbox.stub()
    knexConnStub.client = { config: { client: 'mysql' }, pool: { numPendingAcquires () {} } }
    knexConnStub.withArgs('information_schema.tables').returns({ where: sandbox.stub().withArgs('TABLE_SCHEMA', 'databaseSchema').returns({ select: sandbox.stub().withArgs('TABLE_NAME').returns(Promise.resolve(tableNames)) }) })
    knexConnStub.withArgs('pg_catalog.pg_tables').returns({ where: sandbox.stub().withArgs({ schemaname: 'public' }).returns({ select: sandbox.stub().withArgs('tablename').returns(Promise.resolve(tableNames)) }) })

    knexStub = sandbox.stub().returns(knexConnStub)

    tableStub = sandbox.stub()

    Database = Proxyquire(`${src}/database`, { knex: knexStub, './table': tableStub, 'async-exit-hook': exitHookStub })
    dbInstance = new Database()

    t.end()
  })

  databaseTest.afterEach(async t => {
    sandbox.restore()
    await dbInstance.disconnect()
    t.end()
  })

  databaseTest.test('connect should', getKnexTest => {
    getKnexTest.test('return the knex database object', async (test) => {
      try {
        await dbInstance.connect(connectionConfig)
        const knex = await dbInstance.getKnex()
        test.ok(knex)
        test.end()
      } catch (e) {
        test.fail('Error thrown')
        test.end()
      }
    })

    getKnexTest.test('handle connection with a deprecated URI', async test => {
      // Arrange
      const URI = 'mysql://central_ledger:password@mysql-cl:3307/central_ledger_db'

      // Act
      try {
        await dbInstance.connect(URI)
        const knex = await dbInstance.getKnex()

        // Assert
        test.ok(knex)
      } catch (e) {
        test.fail('Error thrown')
      }

      test.end()
    })

    getKnexTest.test('should fail if the config.connection object is undefined', async test => {
      // Arrange
      const config = {}

      // Act
      try {
        await dbInstance.connect(config)

        test.fail('Should have thrown error')
      } catch (e) {
        // Assert
        test.equal(e.message, 'Invalid database schema in database config')
      }

      test.end()
    })

    getKnexTest.test('throw error when database is not connected', test => {
      try {
        dbInstance.getKnex()
        test.fail('No Error thrown')
        test.end()
      } catch (e) {
        test.pass('Error thrown')
        test.end()
      }
    })
    getKnexTest.end()
  })

  databaseTest.test('connect should', connectTest => {
    connectTest.test('connect using connection string and setup table properties', async test => {
      await dbInstance.connect(connectionConfig)
        .then(() => {
          test.ok(knexStub.calledOnce)
          test.equal(knexStub.firstCall.args[0].client, 'mysql')

          test.equal(dbInstance._tables.length, tableNames.length)
          tableNames.forEach(tbl => {
            test.ok(dbInstance[tbl.TABLE_NAME])
          })
          test.notOk(dbInstance.tableNotExists)

          test.end()
        })
    })

    connectTest.test('throw error for invalid database schema', async (test) => {
      try {
        const connectionConfigDuplicate = lodash.cloneDeep(connectionConfig)
        connectionConfigDuplicate.connection.database = undefined
        await dbInstance.connect(connectionConfigDuplicate)
        test.fail('Should have thrown error')
        test.end()
      } catch (e) {
        test.notOk(knexStub.called)
        test.equal(e.message, 'Invalid database schema in database config')
        test.end()
      }
    })

    connectTest.test('connect using connection config pg and setup table properties', async test => {
      const connectionConfigDuplicate = lodash.cloneDeep(connectionConfig)
      connectionConfigDuplicate.client = 'pg'
      knexConnStub.client = { config: { client: 'pg' } }
      await dbInstance.connect(connectionConfigDuplicate)
        .then(() => {
          test.ok(knexStub.calledOnce)
          test.equal(knexStub.firstCall.args[0].client, 'pg')

          test.equal(dbInstance._tables.length, tableNames.length)
          tableNames.forEach(tbl => {
            test.ok(dbInstance[tbl.tablename])
          })
          test.notOk(dbInstance.tableNotExists)

          test.end()
        })
    })

    connectTest.test('throw error if database type not supported for listing tables', async test => {
      delete dbInstance._listTableQueries.mysql
      await dbInstance.connect(connectionConfig)
        .then(() => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.equal(err.message, 'Listing tables is not supported for database type mysql')
          test.end()
        })
    })

    connectTest.test('only create connection once on multiple connect calls', async test => {
      await dbInstance.connect(connectionConfig)
        .then(async () => {
          await dbInstance.connect(connectionConfig)
            .then(() => {
              test.ok(knexStub.calledOnce)
              test.end()
            })
        })
    })

    connectTest.end()
  })

  databaseTest.test('known table property should', tablePropTest => {
    tablePropTest.test('create new query object for known table', async test => {
      const tableName = tableNames[0].TABLE_NAME

      const obj = {}
      tableStub.returns(obj)

      await dbInstance.connect(connectionConfig)
        .then(() => {
          const table = dbInstance[tableName]
          test.equal(table, obj)
          test.ok(tableStub.calledWith(tableName, knexConnStub))
          test.end()
        })
    })

    tablePropTest.end()
  })

  databaseTest.test('disconnect should', disconnectTest => {
    disconnectTest.test('call destroy and reset connection', async test => {
      await dbInstance.connect(connectionConfig)
        .then(async () => {
          test.ok(dbInstance._knex)

          await dbInstance.disconnect()
          test.ok(knexConnStub.destroy.calledOnce)
          test.notOk(dbInstance._knex)

          test.end()
        })
    })

    disconnectTest.test('remove table properties and reset table list to empty', async test => {
      await dbInstance.connect(connectionConfig)
        .then(async () => {
          test.ok(dbInstance[tableNames[0].TABLE_NAME])
          test.equal(dbInstance._tables.length, tableNames.length)

          await dbInstance.disconnect()
          test.notOk(dbInstance[tableNames[0].TABLE_NAME])
          test.equal(dbInstance._tables.length, 0)

          test.end()
        })
    })

    disconnectTest.test('do nothing if not connected', async test => {
      await dbInstance.connect(connectionConfig)
        .then(async () => {
          test.ok(dbInstance._knex)

          await dbInstance.disconnect()
          test.equal(knexConnStub.destroy.callCount, 1)
          test.notOk(dbInstance._knex)

          await dbInstance.disconnect()
          test.equal(knexConnStub.destroy.callCount, 1)
          test.notOk(dbInstance._knex)

          test.end()
        })
    })

    disconnectTest.end()
  })

  databaseTest.test('from should', fromTest => {
    fromTest.test('create a new knex object for specified table', async test => {
      const tableName = 'table'

      const obj = {}
      tableStub.returns(obj)

      await dbInstance.connect(connectionConfig)
        .then(() => {
          const fromTable = dbInstance.from(tableName)
          test.equal(fromTable, obj)
          test.ok(tableStub.calledWith(tableName, knexConnStub))
          test.end()
        })
    })

    fromTest.test('throw error if database not connected', test => {
      const tableName = 'table'

      const obj = {}
      tableStub.returns(obj)

      try {
        dbInstance.from(tableName)
        test.fail('Should have thrown error')
      } catch (err) {
        test.equal(err.message, 'The database must be connected to get a table object')
        test.end()
      }
    })

    fromTest.end()
  })

  databaseTest.test('assertPendingAcquires should', assertPendingAcquiresTest => {
    assertPendingAcquiresTest.test('throw error if pending acquires exceed maxPendingAcquire', async test => {
      // Arrange
      const maxPendingAcquire = 5
      const config = { ...connectionConfig, maxPendingAcquire }
      await dbInstance.connect(config)
      sandbox.stub(dbInstance._knex.client.pool, 'numPendingAcquires').returns(6)

      // Act & Assert
      try {
        dbInstance.assertPendingAcquires()
        test.fail('Should have thrown error')
      } catch (err) {
        test.equal(err.httpStatusCode, 503, 'Max pending acquires exceeded http status code 503')
        test.equal(err.message, `DB Pool pending acquires 6 > ${maxPendingAcquire}`)
      }

      test.end()
    })

    assertPendingAcquiresTest.test('not throw error if pending acquires are within limit', async test => {
      // Arrange
      const maxPendingAcquire = 5
      const config = { ...connectionConfig, maxPendingAcquire }
      await dbInstance.connect(config)
      sandbox.stub(dbInstance._knex.client.pool, 'numPendingAcquires').returns(4)

      // Act & Assert
      try {
        dbInstance.assertPendingAcquires()
        test.pass('No error thrown')
      } catch (err) {
        test.fail('Should not have thrown error')
      }

      test.end()
    })

    assertPendingAcquiresTest.end()
  })

  databaseTest.test('getPendingAcquires should', getPendingAcquiresTest => {
    getPendingAcquiresTest.test('return the number of pending acquires', async test => {
      // Arrange
      const pendingAcquires = 3
      await dbInstance.connect(connectionConfig)
      sandbox.stub(dbInstance._knex.client.pool, 'numPendingAcquires').returns(pendingAcquires)

      // Act
      const result = dbInstance.getPendingAcquires()

      // Assert
      test.equal(result, pendingAcquires)
      test.end()
    })

    getPendingAcquiresTest.test('throw error if database is not connected', test => {
      try {
        dbInstance.getPendingAcquires()
        test.fail('Should have thrown error')
      } catch (err) {
        test.equal(err.message, 'The database must be connected to get the number of pending acquires')
        test.end()
      }
    })

    getPendingAcquiresTest.end()
  })

  databaseTest.test('connect should', connectTest => {
    connectTest.test('register exit hook', async test => {
      // Act
      await dbInstance.connect(connectionConfig)

      // Assert
      test.ok(exitHookStub.calledOnce)
      test.ok(exitHookStub.calledWith(Sinon.match.func))

      // Cleanup
      test.end()
    })

    connectTest.test('call disconnect on process exit', async test => {
      // Arrange
      // Simulate process exit by manually calling the registered function
      await dbInstance.connect(connectionConfig)
      const exitCallback = exitHookStub.firstCall.args[0] // Get the first function registered
      const disconnectStub = sandbox.stub(dbInstance, 'disconnect').resolves()

      // Act
      exitCallback() // Simulate process exit

      // Assert
      test.ok(exitHookStub.calledOnce)
      test.ok(disconnectStub.calledOnce)

      // Cleanup
      disconnectStub.restore()
      test.end()
    })

    connectTest.end()
  })

  databaseTest.test('listTableQueries should', listTableQueriesTest => {
    listTableQueriesTest.test('list tables for mysql2 client', async test => {
      // Arrange
      const mysql2TableNames = [{ TABLE_NAME: 'products' }, { TABLE_NAME: 'orders' }]
      // Patch knexConnStub to simulate mysql2
      knexConnStub.client = { config: { client: 'mysql2' } }
      // Patch the stub to return mysql2TableNames for mysql2
      knexConnStub.withArgs('information_schema.tables').returns({
        where: sandbox.stub().withArgs('TABLE_SCHEMA', 'databaseSchema').returns({
          select: sandbox.stub().withArgs('TABLE_NAME').returns(Promise.resolve(mysql2TableNames))
        })
      })

      // Patch knexStub to return the patched knexConnStub
      knexStub.returns(knexConnStub)

      // Act
      await dbInstance.connect({ ...connectionConfig, client: 'mysql2' })

      // Assert
      test.ok(knexStub.calledOnce)
      test.equal(knexStub.firstCall.args[0].client, 'mysql2')
      test.equal(dbInstance._tables.length, mysql2TableNames.length)
      mysql2TableNames.forEach(tbl => {
        test.ok(dbInstance[tbl.TABLE_NAME])
      })
      test.end()
    })

    listTableQueriesTest.test('throw error for unsupported db type', async test => {
      // Arrange
      const unsupportedClient = 'sqlite3'
      knexConnStub.client = { config: { client: unsupportedClient } }
      knexStub.returns(knexConnStub)

      // Remove sqlite3 from _listTableQueries if present
      dbInstance._listTableQueries[unsupportedClient] = undefined

      // Act & Assert
      try {
        await dbInstance.connect({ ...connectionConfig, client: unsupportedClient })
        test.fail('Should have thrown error')
      } catch (err) {
        test.equal(err.message, `Listing tables is not supported for database type ${unsupportedClient}`)
      }
      test.end()
    })

    listTableQueriesTest.end()
  })

  databaseTest.end()
})
