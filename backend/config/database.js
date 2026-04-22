const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(client => {
    console.log('✅ Supabase connected');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

const db = {
  execute: async (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgSql, params);
    return [result.rows, result.fields];
  },
  getConnection: async () => {
    const client = await pool.connect();
    return {
      execute: async (sql, params = []) => {
        let i = 0;
        const pgSql = sql.replace(/\?/g, () => `$${++i}`);
        const result = await client.query(pgSql, params);
        return [result.rows, result.fields];
      },
      beginTransaction: async () => client.query('BEGIN'),
      commit:           async () => client.query('COMMIT'),
      rollback:         async () => client.query('ROLLBACK'),
      release:          ()        => client.release(),
    };
  },
};

module.exports = db;
