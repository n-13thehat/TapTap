import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'taptap_dev',
  user: 'postgres',
  password: 'password', // Using the password from docker-compose
});

try {
  console.log('Attempting to connect...');
  await client.connect();
  console.log('✅ Connected successfully!');
  
  const res = await client.query('SELECT version()');
  console.log('PostgreSQL version:', res.rows[0].version);
  
  await client.end();
  console.log('✅ Connection closed');
} catch (err) {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
}

