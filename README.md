# central-services-database
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/central-services-database.svg?style=flat)](https://github.com/mojaloop/central-services-database/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/central-services-database.svg?style=flat)](https://github.com/mojaloop/central-services-database/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/central-services-database.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-database)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/central-services-database.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-database)
[![CircleCI](https://circleci.com/gh/mojaloop/central-services-database.svg?style=svg)](https://circleci.com/gh/mojaloop/central-services-database)

Shared database code for central services

Contents:

- [Usage](#usage)
- [Logging](#logging)
- [Tests](#tests)

## Usage
The library supports both MySQL and Postgres.
To use the library you can use the following configurations:
```javascript 1.8
const connectionConfig = {
    client: 'mysql', //or 'pg' for postgres
    connection: {
      host: 'some-data-uri',
      port: '9999',
      user: 'user',
      password: 'password',
      database: 'databaseSchema'
    },
    pool: {
      // minimum size
      min: 2,
      // maximum size
      max: 10,
      // acquire promises are rejected after this many milliseconds
      // if a resource cannot be acquired
      acquireTimeoutMillis: 30000,
      // create operations are cancelled after this many milliseconds
      // if a resource cannot be acquired
      createTimeoutMillis: 3000,
      // destroy operations are awaited for at most this many milliseconds
      // new resources will be created after this timeout
      destroyTimeoutMillis: 5000,
      // free resouces are destroyed after this many milliseconds
      idleTimeoutMillis: 30000,
      // how often to check for idle resources to destroy
      reapIntervalMillis: 1000,
      // long long to idle after failed create before trying again
      createRetryIntervalMillis: 200
      // ping: function (conn, cb) { conn.query('SELECT 1', cb) }
    },
    debug: false
  }
```

## Environmental variables

Currently all is set into the config.

## Logging

Logs are sent to standard output by default.

## Tests

Running the tests:

    npm run test
    npm run test:unit
    npm run test:xunit
    npm run test:coverage
    npm run test:coverage-check
        
Tests include code coverage via istanbul. See the test/unit/ folder for testing scripts.

## Auditing Dependencies

We use `npm-audit-resolver` along with `npm audit` to check dependencies for vulnerabilities, and keep track of resolved dependencies with an `audit-resolv.json` file.

To start a new resolution process, run:
```bash
npm run audit:resolve
```

You can then check to see if the CI will pass based on the current dependencies with:
```bash
npm run audit:check
```

And commit the changed `audit-resolv.json` to ensure that CircleCI will build correctly.
