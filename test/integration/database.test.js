const Database = require('../../src/database')

;(async () => {
  const db = new Database()
  try {
    await db.connect({
      client: 'mysql2',
      connection: {
        host: '127.0.0.1',
        port: 3306,
        user: 'example_user',
        password: 'example_password',
        database: 'example_db',
        multipleStatements: true,
        namedPlaceholders: true,
        ssl: {
          minVersion: 'TLSv1.3',
          rejectUnauthorized: false // Allow self-signed certificates for testing
        }
      }
    })

    await db._knex.schema.dropTableIfExists('accounts')
    await db._knex.schema.dropTableIfExists('users')

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

    await db._knex.raw(
      'INSERT INTO users (name, email) VALUES (:name, :email)',
      { name: 'Charlie', email: 'charlie@example.com' }
    )
    console.log('✅ Inserted using named placeholders (mysql2 exclusive)')

    const multiRes = await db._knex.raw('SELECT * FROM users; SELECT * FROM accounts;')
    const [users, accounts] = multiRes[0]
    console.log('✅ Multiple statements result:', { users, accounts })

    console.log('✅ Streaming users table (mysql2 exclusive):')
    const stream = db._knex('users').select('*').stream()
    for await (const row of stream) {
      console.log('User row:', row)
    }

    await db._knex.schema.dropTableIfExists('accounts')
    await db._knex.schema.dropTableIfExists('users')
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message)
    process.exit(1)
  } finally {
    await db.disconnect()
    process.exit(0)
  }
})()
