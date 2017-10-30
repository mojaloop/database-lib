'use strict'

const Database = require('./database')
const Migrations = require('./migrations')

exports.Db = new Database()
exports.Migrations = Migrations
