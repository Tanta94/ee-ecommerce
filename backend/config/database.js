// backend/config/database.js
// Works with Supabase (PostgreSQL) using the 'pg' package
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }   // Required for Supabase / Railway
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.connect()
  .then(client => {
    console.log('✅ Supabase/PostgreSQL connected');
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// Wrap pool so it works like mysql2 (returns [rows])
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
