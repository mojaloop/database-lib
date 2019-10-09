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
          port: 3306,
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
        },
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
      //Missing a `:`
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