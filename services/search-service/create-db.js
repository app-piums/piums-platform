const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Create database
    await client.query('CREATE DATABASE piums_search');
    console.log('✅ Base de datos "piums_search" creada exitosamente');
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️  La base de datos "piums_search" ya existe');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
