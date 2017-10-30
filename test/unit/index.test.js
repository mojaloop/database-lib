'use strict'

const Test = require('tape')
const Index = require('../../src')

Test('Index', indexTest => {
  indexTest.test('exporting should', exportingTest => {
    exportingTest.test('export convenience methods', assert => {
      assert.ok(Index.Db)
      assert.ok(Index.Migrations)
      assert.end()
    })

    exportingTest.end()
  })

  indexTest.end()
})
