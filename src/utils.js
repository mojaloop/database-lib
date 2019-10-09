'use strict'

/**
 * @function buildDefaultConfig
 *
 * @desciption Converts a deprecated Database Connection URI based config to the newer, Knex compatible version
 *
 * @returns {Object} - Knex compatible config
 */
const buildDefaultConfig = (defaultConfig, configStr) => {
  const connectionRegex = /^(mysql|psql)(?::\/\/)(.*)(?::)(.*)@(.*)(?::)(\d*)(?:\/)(.*)$/
  const matches = configStr.match(connectionRegex)

  // Check that we got the expected amount: 6 capture groups + 1 js defaults = 7
  if (!matches || matches.length !== 7) {
    throw new Error(`Invalid database config string: ${configStr}`)
  }

  // skip the first, .match() puts the original string at index 0
  matches.shift()
  const [clientStr, user, password, host, port, database] = matches

  return {
    ...defaultConfig,
    client: clientStr,
    connection: {
      ...defaultConfig.connection,
      user,
      password,
      host,
      port,
      database
    }
  }
}

module.exports = {
  buildDefaultConfig
}
