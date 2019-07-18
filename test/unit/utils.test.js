'use strict'

const Test = require('tapes')(require('tape'))

const {
  parseDatabaseType,
  parseDatabaseSchema
} = require('../../src/utils')

Test('utils', utilsTest => {
  utilsTest.test('parseDatabaseType', parseDatabaseTypeTest => {
    parseDatabaseTypeTest.test('parses the database type', test => {
      // Arrange
      const input = 'mysql://central_ledger:password@mysql:3306/central_ledger'
      const expected = 'mysql'

      // Act
      const result = parseDatabaseType(input)

      // Assert
      test.equal(result, expected, 'The database type string should match')
      test.end()
    })

    parseDatabaseTypeTest.end()
  })

  utilsTest.test('parseDatabaseSchema', parseDatabaseSchemaTest => {
    parseDatabaseSchemaTest.test('Should pass the database schema url', test => {
      // Arrange
      const input = 'mysql://central_ledger:password@mysql:3306/central_ledger'
      const expected = 'central_ledger'

      // Act
      const result = parseDatabaseSchema(input)

      // Assert
      test.equal(result, expected, 'The database type string should match')
      test.end()
    })

    parseDatabaseSchemaTest.test('Should fail on an invalid database type', test => {
      // Arrange
      const input = 'mysql://some-data-uri'

      // Act
      try {
        parseDatabaseSchema(input)
        // Assert
        test.error('Should have thrown error')
      } catch (err) {
        test.pass()
      }

      test.end()
    })

    parseDatabaseSchemaTest.end()
  })

  utilsTest.end()
})
