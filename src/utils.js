'use strict'

/**
 * @function buildDefaultConfig
 * 
 * @desciption Converts a deprecated Database Connection URI based config to the newer, Knex compatible version
 * 
 * @returns {Object} - Knex compatible config
 */
const buildDefaultConfig = (defaultConfig, configStr) => {
  const connectionRegex = /^(mysql|psql)(?::\/\/)(.*)(?:\:)(.*)@(.*)(?:\:)(\d*)(?:\/)(.*)$/

  // Set the possible default values that may get overriden by the URI
  let clientStr = defaultConfig.client || null
  let user = defaultConfig.connection && defaultConfig.connection.user || null
  let password = defaultConfig.connection && defaultConfig.connection.password || null
  let host = defaultConfig.connection && defaultConfig.connection.host || null
  let port = defaultConfig.connection && defaultConfig.connection.port || null
  let database = defaultConfig.connection && defaultConfig.connection.database || null

  const matches = configStr.match(connectionRegex)
  
  //Check that we got the expected amount: 6 capture groups + 1 js defaults = 7
  if (!matches || matches.length !== 7) {
    throw new Error(`Invalid database config string: ${configStr}`)
  }

  // skip the first, nodejs puts the original string at index 0
  clientStr = matches[1]
  user = matches[2]
  password = matches[3]
  host = matches[4]
  port = matches[5]
  database = matches[6]


  return {
    ...defaultConfig,
    client: clientStr,
    connection: {
      user,
      password,
      host,
      port,
      database
    }
  }
}

module.exports = {
  buildDefaultConfig,
}