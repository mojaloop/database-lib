/*****
 License
 --------------
 Copyright © 2020-2026 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

*****/

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
