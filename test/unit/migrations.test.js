'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

Test('migrations', migrationsTest => {
  let sandbox
  let knexStub
  let knexConnStub
  let Migrator

  migrationsTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()

    knexConnStub = sandbox.stub()
    knexStub = sandbox.stub().returns(knexConnStub)

    Migrator = Proxyquire('../../src/migrations', { knex: knexStub })

    t.end()
  })

  migrationsTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  migrationsTest.test('migrate should', migrateTest => {
    migrateTest.test('run migrations and destroy Knex connection on completion', test => {
      const latestStub = sandbox.stub().returns(Promise.resolve(null))
      const seedStub = sandbox.stub().returns(Promise.resolve(null))
      const destroyStub = sandbox.stub().returns(Promise.resolve(null))
      knexConnStub.migrate = { latest: latestStub }
      knexConnStub.seed = { run: seedStub }
      knexConnStub.destroy = destroyStub

      const config = { migrations: { directory: 'test' } }

      Migrator.migrate(config)
        .then(() => {
          test.ok(knexStub.calledWith(config))
          test.ok(latestStub.calledOnce)
          test.ok(seedStub.calledOnce)
          test.ok(destroyStub.calledOnce)
          test.ok(seedStub.calledAfter(latestStub))
          test.ok(destroyStub.calledAfter(seedStub))
          test.end()
        })
    })

    migrateTest.end()
  })

  migrationsTest.end()
})
