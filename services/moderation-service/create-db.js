// Script para crear la base de datos piums_moderation si no existe
const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USER || 'piums',
    password: process.env.DB_PASSWORD || 'piums_dev_password',
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'piums_moderation'"
    );

    if (res.rows.length === 0) {
      await client.query('CREATE DATABASE piums_moderation');
      console.log('✅ Base de datos piums_moderation creada');
    } else {
      console.log('ℹ️  Base de datos piums_moderation ya existe');
    }
  } catch (err) {
    console.error('❌ Error al crear la base de datos:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createDatabase();
