/* global describe, beforeEach, afterEach, test, expect */
const Database = require('../../src/database')
const fs = require('fs')
const path = require('path')

describe('Database Integration Tests with SSL', () => {
  let db

  beforeEach(() => {
    db = new Database()
  })

  afterEach(async () => {
    if (db && db._knex) {
      await db.disconnect()
    }
  })

  test('should connect to MySQL with SSL using mysql2 client and perform database operations', async () => {
    // Read the CA certificate for SSL verification
    const caCertPath = path.join(__dirname, '../../certs/ca.pem')
    expect(fs.existsSync(caCertPath)).toBe(true)

    const caCert = fs.readFileSync(caCertPath)

    await db.connect({
      client: 'mysql2',
      connection: {
        host: 'localhost',
        port: 3306,
        user: 'example_user',
        password: 'example_password',
        database: 'example_db',
        multipleStatements: true,
        namedPlaceholders: true,
        ssl: {
          minVersion: 'TLSv1.3',
          rejectUnauthorized: true, // Enable certificate validation
          ca: caCert // Provide CA certificate for validating self-signed cert
        }
      }
    })

    // Verify connection is established
    expect(db._knex).toBeDefined()

    // Clean up any existing tables
    await db._knex.schema.dropTableIfExists('accounts')
    await db._knex.schema.dropTableIfExists('users')

    // Create test tables
    await db._knex.schema.createTable('users', (table) => {
      table.increments('id').primary()
      table.string('name')
      table.string('email')
    })

    await db._knex.schema.createTable('accounts', (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.decimal('balance', 14, 2)
    })

    // Test data insertion with named placeholders
    await db._knex.raw(
      'INSERT INTO users (name, email) VALUES (:name, :email)',
      { name: 'Charlie', email: 'charlie@example.com' }
    )

    // Test multiple statements
    const multiRes = await db._knex.raw('SELECT * FROM users; SELECT * FROM accounts;')
    const [users, accounts] = multiRes[0]

    expect(users).toHaveLength(1)
    expect(users[0]).toMatchObject({
      id: 1,
      name: 'Charlie',
      email: 'charlie@example.com'
    })
    expect(accounts).toHaveLength(0)

    // Test streaming functionality
    const streamResults = []
    const stream = db._knex('users').select('*').stream()
    for await (const row of stream) {
      streamResults.push(row)
    }

    expect(streamResults).toHaveLength(1)
    expect(streamResults[0]).toMatchObject({
      id: 1,
      name: 'Charlie',
      email: 'charlie@example.com'
    })

    // Test server connection and time query
    const result = await db._knex.raw('SELECT NOW() as currentTime;')
    expect(result[0][0].currentTime).toBeDefined()
    expect(result[0][0].currentTime).toBeInstanceOf(Date)

    // Clean up test tables
    await db._knex.schema.dropTableIfExists('accounts')
    await db._knex.schema.dropTableIfExists('users')
  })

  test('should handle mysql client authentication incompatibility with MySQL 8.0', async () => {
    // Read the CA certificate for SSL verification
    const caCertPath = path.join(__dirname, '../../certs/ca.pem')
    expect(fs.existsSync(caCertPath)).toBe(true)

    const caCert = fs.readFileSync(caCertPath)

    // The legacy mysql client doesn't support MySQL 8.0's default caching_sha2_password
    await expect(db.connect({
      client: 'mysql',
      connection: {
        host: 'localhost',
        port: 3306,
        user: 'example_user',
        password: 'example_password',
        database: 'example_db',
        multipleStatements: true,
        ssl: {
          minVersion: 'TLSv1.3',
          rejectUnauthorized: true,
          ca: caCert
        }
      }
    })).rejects.toThrow('Client does not support authentication protocol requested by server')
  })

  test('should fail when CA certificate is missing (mysql2)', async () => {
    const invalidCaCert = Buffer.from('invalid-certificate')

    await expect(db.connect({
      client: 'mysql2',
      connection: {
        host: 'localhost',
        port: 3306,
        user: 'example_user',
        password: 'example_password',
        database: 'example_db',
        ssl: {
          minVersion: 'TLSv1.3',
          rejectUnauthorized: true,
          ca: invalidCaCert
        }
      }
    })).rejects.toThrow()
  })
})
