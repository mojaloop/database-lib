# central-services-database
[![Git Commit](https://img.shields.io/github/last-commit/mojaloop/central-services-database.svg?style=flat)](https://github.com/mojaloop/central-services-database/commits/master)
[![Git Releases](https://img.shields.io/github/release/mojaloop/central-services-database.svg?style=flat)](https://github.com/mojaloop/central-services-database/releases)
[![Npm Version](https://img.shields.io/npm/v/@mojaloop/central-services-database.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-base)
[![NPM Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/@mojaloop/central-services-database.svg?style=flat)](https://www.npmjs.com/package/@mojaloop/central-services-database)
[![CircleCI](https://circleci.com/gh/mojaloop/central-services-database.svg?style=svg)](https://circleci.com/gh/mojaloop/central-services-database)

Shared database code for central services

Contents:

- [Deployment](#deployment)
- [Logging](#logging)
- [Tests](#tests)

## Deployment

TBA

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
