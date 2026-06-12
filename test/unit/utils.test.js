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

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Utils = require(`${src}/utils`)

Test('utils', utilsTest => {
  utilsTest.test('buildDefaultConfig should', defaultTest => {
    defaultTest.test('handle a mysql connection string', test => {
      // Arrange
      const defaultConfig = {
        connection: {
          host: 'localhost',
          port: 3306
        },
        pool: {
          field1: true
        }
      }
      const URI = 'mysql://central_ledger:password@mysql-cl:3307/central_ledger_db'
      const expected = {
        client: 'mysql',
        connection: {
          host: 'mysql-cl',
          port: '3307',
          user: 'central_ledger',
          password: 'password',
          database: 'central_ledger_db'
        },
        pool: {
          field1: true
        }
      }
      // Act
      const config = Utils.buildDefaultConfig(defaultConfig, URI)

      // Assert
      test.deepEqual(config, expected)
      test.end()
    })

    defaultTest.test('not override all values in defaultConfig.connection', test => {
      // Arrange
      const defaultConfig = {
        connection: {
          newFieldNotOverriden: true
        },
        pool: {
          field1: true
        }
      }
      const URI = 'mysql://central_ledger:password@mysql-cl:3307/central_ledger_db'
      const expected = {
        client: 'mysql',
        connection: {
          newFieldNotOverriden: true,
          host: 'mysql-cl',
          port: '3307',
          user: 'central_ledger',
          password: 'password',
          database: 'central_ledger_db'
        },
        pool: {
          field1: true
        }
      }
      // Act
      const config = Utils.buildDefaultConfig(defaultConfig, URI)

      // Assert
      test.deepEqual(config, expected)
      test.end()
    })

    defaultTest.test('fails when connections string does not use mysql or psql', test => {
      // Arrange
      const defaultConfig = {}
      const URI = 'mssql://central_ledger:password@mysql-cl:3307/central_ledger_db'

      // Act
      try {
        Utils.buildDefaultConfig(defaultConfig, URI)
        test.fail('Should have thrown error')
      } catch (err) {
        // Assert
        test.equal(err.message, 'Invalid database config string: mssql://central_ledger:password@mysql-cl:3307/central_ledger_db')
      }

      test.end()
    })

    defaultTest.test('fail when the connection string is invalid', test => {
      // Arrange
      const defaultConfig = {}
      // Missing a `:`
      const URI = 'mssql://central_ledgerpassword@mysql-cl:3307/central_ledger_db'

      // Act
      try {
        Utils.buildDefaultConfig(defaultConfig, URI)
        test.fail('Should have thrown error')
      } catch (err) {
        // Assert
        test.equal(err.message, 'Invalid database config string: mssql://central_ledgerpassword@mysql-cl:3307/central_ledger_db')
      }

      test.end()
    })

    defaultTest.end()
  })

  utilsTest.end()
})
