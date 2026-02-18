'use strict'

const src = '../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Table = require(`${src}/table`)

Test('table', tableTest => {
  const tableName = 'users'
  let table
  let sandbox
  let knexStub
  let builderStub

  tableTest.beforeEach(t => {
    sandbox = Sinon.createSandbox()
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
      const fields = { id: 1 }
      const inserted = { id: 1, accountId: 1 }

      builderStub.insert = sandbox.stub().returns(Promise.resolve([inserted]))

      table.insert(fields)
        .then(record => {
          test.equal(record, inserted)
          test.ok(builderStub.insert.calledWith(fields))
          test.end()
        })
    })

    insertTest.test('throw error if no record returned from insert', test => {
      const fields = { id: 1 }

      builderStub.insert = sandbox.stub().returns(Promise.resolve([]))

      table.insert(fields)
        .then(record => {
          test.fail('Should have thrown error')
          test.end()
        })
        .catch(err => {
          test.equal(err.message, `There was an error inserting the record to ${tableName}`)
          test.ok(builderStub.insert.calledWith(fields))
          test.end()
        })
    })

    insertTest.end()
  })

  tableTest.test('update should', updateTest => {
    updateTest.test('return updated record', test => {
      const criteria = { id: 1 }
      const fields = { name: 'test' }
      const updated = { id: 1, name: 'test' }

      const updateStub = sandbox.stub()
      updateStub.returns(Promise.resolve([updated]))
      builderStub.where = sandbox.stub().returns({ update: updateStub })

      table.update(criteria, fields)
        .then(record => {
          test.equal(record, updated)
          test.ok(builderStub.where.calledWith('id', 1))
          test.ok(updateStub.calledWith(fields))
          test.end()
        })
    })

    updateTest.test('return multiple updated records', test => {
      const criteria = { accountId: 3 }
      const fields = { name: 'test' }
      const updated = [{ id: 1, accountId: 3, name: 'test' }, { id: 2, accountId: 3, name: 'test' }]

      const updateStub = sandbox.stub()
      updateStub.returns(Promise.resolve(updated))
      builderStub.where = sandbox.stub().returns({ update: updateStub })

      table.update(criteria, fields)
        .then(records => {
          test.equal(records, updated)
          test.ok(builderStub.where.calledWith('accountId', 3))
          test.ok(updateStub.calledWith(fields))
          test.end()
        })
    })

    updateTest.test('return null if no record updated', test => {
      const criteria = { id: 1 }
      const fields = { name: 'test' }

      const updateStub = sandbox.stub()
      updateStub.returns(Promise.resolve([]))
      builderStub.where = sandbox.stub().returns({ update: updateStub })

      table.update(criteria, fields)
        .then(record => {
          test.notOk(record)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    updateTest.test('handle empty criteria', test => {
      const fields = { name: 'test' }
      const updated = [{ id: 1, name: 'test' }, { id: 2, name: 'test' }]

      builderStub.update = sandbox.stub().returns(Promise.resolve(updated))

      table.update({}, fields)
        .then(records => {
          test.equal(records, updated)
          test.ok(builderStub.update.calledWith(fields))
          test.end()
        })
    })

    updateTest.test('handle null criteria', test => {
      const fields = { name: 'test' }
      const updated = [{ id: 1, name: 'test' }, { id: 2, name: 'test' }]

      builderStub.update = sandbox.stub().returns(Promise.resolve(updated))

      table.update(null, fields)
        .then(records => {
          test.equal(records, updated)
          test.ok(builderStub.update.calledWith(fields))
          test.end()
        })
    })

    updateTest.end()
  })

  tableTest.test('find should', findTest => {
    findTest.test('return matching records', test => {
      const criteria = { name: 'test' }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.where = sandbox.stub().returns(Promise.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.end()
        })
    })

    findTest.test('return matching record using order by', test => {
      const options = { order: 'name asc' }
      const criteria = { name: 'test' }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      const orderByStub = sandbox.stub().returns(Promise.resolve(found))
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
      const criteria = { 'id >=': 1 }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.where = sandbox.stub().returns(Promise.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('id', '>=', 1))
          test.end()
        })
    })

    findTest.test('handle empty condition key', test => {
      const criteria = { '': 1 }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.where = sandbox.stub().returns(Promise.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('', 1))
          test.end()
        })
    })

    findTest.test('ignore unknown condition', test => {
      const criteria = { 'id !=': 1 }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.where = sandbox.stub().returns(Promise.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    findTest.test('handle criteria with array', test => {
      const criteria = { id: [1, 2] }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.whereIn = sandbox.stub().returns(Promise.resolve(found))

      table.find(criteria)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.whereIn.calledWith('id', [1, 2]))
          test.end()
        })
    })

    findTest.test('handle multiple criteria', test => {
      const criteria = { id: [1, 2], 'num >': 5 }
      const found = [{ id: 1, name: 'test', num: 6 }, { id: 2, name: 'test2', num: 10 }]

      const whereStub = sandbox.stub()
      whereStub.returns(Promise.resolve(found))
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
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      knexStub.withArgs(tableName).returns(Promise.resolve(found))

      table.find({})
        .then(records => {
          test.equal(records, found)
          test.end()
        })
    })

    findTest.test('handle null criteria', test => {
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      knexStub.withArgs(tableName).returns(Promise.resolve(found))

      table.find(null)
        .then(records => {
          test.equal(records, found)
          test.end()
        })
    })

    findTest.test('default to ascending order if not provided', test => {
      const options = { order: 'id' }
      const criteria = { name: 'test' }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      const orderByStub = sandbox.stub().returns(Promise.resolve(found))
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
      const options = { order: 'name asc, id desc' }
      const criteria = { name: 'test' }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.where = sandbox.stub().returns(Promise.resolve(found))

      table.find(criteria, options)
        .then(records => {
          test.equal(records, found)
          test.ok(builderStub.where.calledWith('name', 'test'))
          test.end()
        })
    })

    findTest.test('handle order with no field value', test => {
      const options = { order: ' ' }
      const criteria = { name: 'test' }
      const found = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }]

      builderStub.where = sandbox.stub().returns(Promise.resolve(found))

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
      const criteria = { id: 1 }
      const found = { id: 1, name: 'test' }

      builderStub.where = sandbox.stub().returns(Promise.resolve([found]))

      table.findOne(criteria)
        .then(record => {
          test.equal(record, found)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    findOneTest.test('return null if no record found', test => {
      const criteria = { id: 1 }

      builderStub.where = sandbox.stub().returns(Promise.resolve([]))

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
      const criteria = { id: 1 }
      const deleted = { id: 1, name: 'test' }

      const delStub = sandbox.stub()
      delStub.returns(Promise.resolve([deleted]))
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
      const criteria = { accountId: 3 }
      const deleted = [{ id: 1, accountId: 3, name: 'test' }, { id: 2, accountId: 3, name: 'test' }]

      const delStub = sandbox.stub()
      delStub.returns(Promise.resolve(deleted))
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
      const criteria = { id: 1 }

      const delStub = sandbox.stub()
      delStub.returns(Promise.resolve([]))
      builderStub.where = sandbox.stub().returns({ del: delStub })

      table.destroy(criteria)
        .then(record => {
          test.notOk(record)
          test.ok(builderStub.where.calledWith('id', 1))
          test.end()
        })
    })

    destroyTest.test('handle empty criteria', test => {
      const deleted = [{ id: 1, name: 'test' }, { id: 2, name: 'test' }]

      builderStub.del = sandbox.stub().returns(Promise.resolve(deleted))

      table.destroy({})
        .then(records => {
          test.equal(records, deleted)
          test.ok(builderStub.del.calledWith('*'))
          test.end()
        })
    })

    destroyTest.test('handle null criteria', test => {
      const deleted = [{ id: 1, name: 'test' }, { id: 2, name: 'test' }]

      builderStub.del = sandbox.stub().returns(Promise.resolve(deleted))

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
      builderStub.truncate = sandbox.stub().returns(Promise.resolve(null))

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
      const countRecords = [{ count: '5' }]

      const countStub = sandbox.stub()
      countStub.returns(Promise.resolve(countRecords))
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
      const countRecords = [{ count: '5' }]

      builderStub.count = sandbox.stub().returns(Promise.resolve(countRecords))

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
      const maxRecords = [{ max: 5 }]

      const maxStub = sandbox.stub()
      maxStub.returns(Promise.resolve(maxRecords))
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
      const maxRecords = [{ max: 5 }]

      builderStub.max = sandbox.stub().returns(Promise.resolve(maxRecords))

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
      const found = { id: 1 }
      const cbStub = sandbox.stub().returns(Promise.resolve(found))

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
