const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
});

async function createDatabase() {
  try {
    await client.connect();
    
    await client.query('CREATE DATABASE piums_payments');
    console.log('✅ Database piums_payments created successfully');
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Database piums_payments already exists');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

createDatabase();
