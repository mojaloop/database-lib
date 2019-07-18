'use strict'

const parseDatabaseType = (uri) => {
  return uri.split(':')[0]
}

const parseDatabaseSchema = (uri) => {
  let schema
  try {
    schema = new URL(uri)
  } catch (err) {
    // Do nothing, as crappy bluebird promises will break tests
  }

  if (schema && schema.pathname) {
    return schema.pathname.replace('/', '')
  } else {
    throw new Error('Invalid database type in database URI')
  }
}

module.exports = {
  parseDatabaseType,
  parseDatabaseSchema
}
