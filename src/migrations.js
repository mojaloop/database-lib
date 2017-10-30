'use strict'

const Knex = require('knex')

exports.migrate = function (config) {
  const knex = Knex(config)
  return knex.migrate.latest().then(() => knex.destroy())
}
