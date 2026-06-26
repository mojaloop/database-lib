module.exports = {
  reject: [
    // knex is the core runtime dependency of this library — the entire Table/Database
    // abstraction wraps the Knex query builder and migration API. A major bump (3.x -> 4.x)
    // can change query-builder behaviour, pool handling and migration semantics, so it needs a
    // deliberate, well-tested migration rather than a routine maintenance bump. Pin to 3.x.
    'knex',
    // mysql / mysql2 are the database drivers consumed directly by knex at runtime. Driver
    // major bumps can change connection/auth behaviour and SQL handling; upgrade only with a
    // dedicated integration-test pass against a live database. Keep within current majors.
    'mysql',
    'mysql2',
    // standard-version is deprecated and its last release is 9.5.0; there is no non-major
    // successor under the same name (the maintained fork is commit-and-tag-version). Pin to
    // avoid ncu offering a cross-package/major change as part of routine updates.
    'standard-version'
  ]
}
