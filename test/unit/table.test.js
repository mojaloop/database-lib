'use strict'

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Table = require(`${src}/table`)

Test('table', tableTest => {
  let tableName = 'users'
  let table
  let sandbox
  let knexStub
  let builderStub

  tableTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    knexStub = sandbox.stub()
    builderStub = sandbox.stub()
    knexStub.withArgs(tableName).returns(builderStub)
    table = new Table(tableName, knexStub)
    t.end()
  })

  tableTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  tableTest.test('insert should', insertTest => {
    insertTest.test('return inserted record', test => {
      let fields = { id: 1 }
      let inserted = { id: 1, accountId: 1 }

      builderStub.insert = sandbox.stub().returns(P.resolve([inserted]))

      table.insert(fields)
        .then(record => {
          test.equal(record, inserted)
          test.ok(builderStub.insert.calledWith(fields, '*'))
          test.end()
        })
    })

    insertTest.test('throw error if no record returned from insert', test => {
      let fields = { id: 1 }

      builderStub.insert = sandbox.stub().returns(P.resolve([]))

      table.insert(fields)
        .then(record => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.equal(err.message, `There was an error inserting the record to ${tableName}`)
          test.ok(builderStub.insert.calledWith(fields, '*'))
          test.end()
        })
    })

    insertTest.end()
  })

  tableTest.test('update should', updateTest => {
    updateTest.test('return updated record', test => {
      let criteria = { id: 1 }
      let fields = { name: 'test' }
      let updated = { id: 1, name: 'test' }

      let updateStub = sandbox.stub()
      updateStub.returns(P.resolve([updated]))
      builderStub.where = sandbox.stub().returns({ update: updateStub })

      table.update(criteria, fields)
        .then(record => {
          test.equal(record, updated)
          test.ok(builderStub.where.calledWith('id', 1))
          test.ok(updateStub.calledWith(fields, '*'))
          test.end()
        })
    })

    updateTest.test('return multiple updated records', test => {
      let criteria = { accountId: 3 }
      let fields = { name: 'test' }
      let updated = [ { id: 1, accountId: 3, name: 'test' }, { id: 2, accountId: 3, name: 'test' } ]

      let updateStub = sandbox.stub()
      updateStub.returns(P.resolve(updated))
      builderStub.where = sandbox.stub().returns({ update: updateStub })

      table.update(criteria, fields)
        .then(records => {
          test.equal(records, updated)
          test.ok(builderStub.where.calledWith('accountId', 3))
          test.ok(updateStub.calledWith(fields, '*'))
          test.end()
        })
    })

    updateTest.test('return null if no record updated', test => {
      let criteria = { id: 1 }
      let fields = { name: 'test' }

      let updateStub = sandbox.stub()
      updateStub.returns(P.resolve([]))
      builderStub.where = sandbox.stub().returns({ update: updateStub })

      table.update(criteria, fields)
        .then(record => {
          test.notOk(record)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    updateTest.test('handle empty criteria', test => {
      let fields = { name: 'test' }
      let updated = [ { id: 1, name: 'test' }, { id: 2, name: 'test' } ]

      builderStub.update = sandbox.stub().returns(P.resolve(updated))

      table.update({}, fields)
        .then(records => {
          test.equal(records, updated)
          test.ok(builderStub.update.calledWith(fields, '*'))
          test.end()
        })
    })

    updateTest.test('handle null criteria', test => {
      let fields = { name: 'test' }
      let updated = [ { id: 1, name: 'test' }, { id: 2, name: 'test' } ]

      builderStub.update = sandbox.stub().returns(P.resolve(updated))

      table.update(null, fields)
        .then(records => {
          test.equal(records, updated)
          test.ok(builderStub.update.calledWith(fields, '*'))
          test.end()
        })
    })

    updateTest.end()
  })

  tableTest.test('find should', findTest => {
    findTest.test('return matching records', test => {
      let criteria = { name: 'test' }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.where = sandbox.stub().returns(P.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.end()
        })
    })

    findTest.test('return matching record using order by', test => {
      let options = { order: 'name asc' }
      let criteria = { name: 'test' }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      let orderByStub = sandbox.stub().returns(P.resolve(found))
      builderStub.where = sandbox.stub().returns({ orderBy: orderByStub })

      table.find(criteria, options)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.ok(orderByStub.calledWith('name', 'asc'))
          test.end()
        })
    })

    findTest.test('handle criteria with conditions', test => {
      let criteria = { 'id >=': 1 }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.where = sandbox.stub().returns(P.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('id', '>=', 1))
          test.end()
        })
    })

    findTest.test('handle empty condition key', test => {
      let criteria = { '': 1 }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.where = sandbox.stub().returns(P.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('', 1))
          test.end()
        })
    })

    findTest.test('ignore unknown condition', test => {
      let criteria = { 'id !=': 1 }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.where = sandbox.stub().returns(P.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    findTest.test('handle criteria with array', test => {
      let criteria = { 'id': [1, 2] }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.whereIn = sandbox.stub().returns(P.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.whereIn.calledWith('id', [1, 2]))
          test.end()
        })
    })

    findTest.test('handle multiple criteria', test => {
      let criteria = { 'id': [1, 2], 'num >': 5 }
      let found = [ { id: 1, name: 'test', num: 6 }, { id: 2, name: 'test2', num: 10 } ]

      let whereStub = sandbox.stub()
      whereStub.returns(P.resolve(found))
      builderStub.whereIn = sandbox.stub().returns({ where: whereStub })

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.whereIn.calledWith('id', [1, 2]))
          test.ok(whereStub.calledWith('num', '>', 5))
          test.end()
        })
    })

    findTest.test('handle empty criteria', test => {
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      knexStub.withArgs(tableName).returns(P.resolve(found))

      table.find({})
        .then(records => {
          test.equal(records, found)
          test.end()
        })
    })

    findTest.test('handle null criteria', test => {
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      knexStub.withArgs(tableName).returns(P.resolve(found))

      table.find(null)
        .then(records => {
          test.equal(records, found)
          test.end()
        })
    })

    findTest.test('default to ascending order if not provided', test => {
      let options = { order: 'id' }
      let criteria = { name: 'test' }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      let orderByStub = sandbox.stub().returns(P.resolve(found))
      builderStub.where = sandbox.stub().returns({ orderBy: orderByStub })

      table.find(criteria, options)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.ok(orderByStub.calledWith('id', 'asc'))
          test.end()
        })
    })

    findTest.test('ignore order by with too many fields', test => {
      let options = { order: 'name asc, id desc' }
      let criteria = { name: 'test' }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.where = sandbox.stub().returns(P.resolve(found))

      table.find(criteria, options)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.end()
        })
    })

    findTest.test('handle order with no field value', test => {
      let options = { order: ' ' }
      let criteria = { name: 'test' }
      let found = [ { id: 1, name: 'test' }, { id: 2, name: 'test2' } ]

      builderStub.where = sandbox.stub().returns(P.resolve(found))

      table.find(criteria, options)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.end()
        })
    })

    findTest.end()
  })

  tableTest.test('findOne should', findOneTest => {
    findOneTest.test('return first matching record', test => {
      let criteria = { id: 1 }
      let found = { id: 1, name: 'test' }

      builderStub.where = sandbox.stub().returns(P.resolve([found]))

      table.findOne(criteria)
        .then(record => {
          test.equal(record, found)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    findOneTest.test('return null if no record found', test => {
      let criteria = { id: 1 }

      builderStub.where = sandbox.stub().returns(P.resolve([]))

      table.findOne(criteria)
        .then(record => {
          test.notOk(record)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    findOneTest.end()
  })

  tableTest.test('destroy should', destroyTest => {
    destroyTest.test('return deleted record', test => {
      let criteria = { id: 1 }
      let deleted = { id: 1, name: 'test' }

      let delStub = sandbox.stub()
      delStub.returns(P.resolve([deleted]))
      builderStub.where = sandbox.stub().returns({ del: delStub })

      table.destroy(criteria)
        .then(record => {
          test.equal(record, deleted)
          test.ok(builderStub.where.calledWith('id', 1))
          test.ok(delStub.calledWith('*'))
          test.end()
        })
    })

    destroyTest.test('return multiple deleted records', test => {
      let criteria = { accountId: 3 }
      let deleted = [ { id: 1, accountId: 3, name: 'test' }, { id: 2, accountId: 3, name: 'test' } ]

      let delStub = sandbox.stub()
      delStub.returns(P.resolve(deleted))
      builderStub.where = sandbox.stub().returns({ del: delStub })

      table.destroy(criteria)
        .then(records => {
          test.equal(records, deleted)
          test.ok(builderStub.where.calledWith('accountId', 3))
          test.ok(delStub.calledWith('*'))
          test.end()
        })
    })

    destroyTest.test('return null if no record deleted', test => {
      let criteria = { id: 1 }

      let delStub = sandbox.stub()
      delStub.returns(P.resolve([]))
      builderStub.where = sandbox.stub().returns({ del: delStub })

      table.destroy(criteria)
        .then(record => {
          test.notOk(record)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    destroyTest.test('handle empty criteria', test => {
      let deleted = [ { id: 1, name: 'test' }, { id: 2, name: 'test' } ]

      builderStub.del = sandbox.stub().returns(P.resolve(deleted))

      table.destroy({})
        .then(records => {
          test.equal(records, deleted)
          test.ok(builderStub.del.calledWith('*'))
          test.end()
        })
    })

    destroyTest.test('handle null criteria', test => {
      let deleted = [ { id: 1, name: 'test' }, { id: 2, name: 'test' } ]

      builderStub.del = sandbox.stub().returns(P.resolve(deleted))

      table.destroy(null)
        .then(records => {
          test.equal(records, deleted)
          test.ok(builderStub.del.calledWith('*'))
          test.end()
        })
    })

    destroyTest.end()
  })

  tableTest.test('truncate should', truncateTest => {
    truncateTest.test('call truncate method on builder', test => {
      builderStub.truncate = sandbox.stub().returns(P.resolve(null))

      table.truncate()
        .then(() => {
          test.ok(builderStub.truncate.calledOnce)
          test.end()
        })
    })

    truncateTest.end()
  })

  tableTest.test('count should', countTest => {
    countTest.test('return integer count', test => {
      let countRecords = [{ count: '5' }]

      let countStub = sandbox.stub()
      countStub.returns(P.resolve(countRecords))
      builderStub.where = sandbox.stub().returns({ count: countStub })

      table.count({ 'id >': 1 }, '*')
        .then(count => {
          test.equal(count, parseInt(countRecords[0].count))
          test.ok(builderStub.where.calledWith('id', '>', 1))
          test.ok(countStub.calledWith('*'))
          test.end()
        })
    })

    countTest.test('handle empty criteria', test => {
      let countRecords = [{ count: '5' }]

      builderStub.count = sandbox.stub().returns(P.resolve(countRecords))

      table.count({}, '*')
        .then(count => {
          test.equal(count, parseInt(countRecords[0].count))
          test.ok(builderStub.count.calledWith('*'))
          test.end()
        })
    })

    countTest.end()
  })

  tableTest.test('max should', maxTest => {
    maxTest.test('return integer max', test => {
      let maxRecords = [{ max: 5 }]

      let maxStub = sandbox.stub()
      maxStub.returns(P.resolve(maxRecords))
      builderStub.where = sandbox.stub().returns({ max: maxStub })

      table.max({ 'id >': 1 }, 'col')
        .then(max => {
          test.equal(max, maxRecords[0].max)
          test.ok(builderStub.where.calledWith('id', '>', 1))
          test.ok(maxStub.calledWith('col'))
          test.end()
        })
    })

    maxTest.test('handle empty criteria', test => {
      let maxRecords = [{ max: 5 }]

      builderStub.max = sandbox.stub().returns(P.resolve(maxRecords))

      table.max({}, 'col')
        .then(max => {
          test.equal(max, maxRecords[0].max)
          test.ok(builderStub.max.calledWith('col'))
          test.end()
        })
    })

    maxTest.end()
  })

  tableTest.test('query function should', queryFuncTest => {
    queryFuncTest.test('pass builder object to callback', test => {
      let found = { id: 1 }
      let cbStub = sandbox.stub().returns(P.resolve(found))

      table.query(cbStub)
        .then(result => {
          test.equal(result, found)
          test.ok(cbStub.calledWith(builderStub))
          test.end()
        })
    })

    queryFuncTest.end()
  })

  tableTest.end()
})
