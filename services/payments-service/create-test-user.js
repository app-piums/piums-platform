#!/usr/bin/env node

// Script para crear usuario de prueba en auth-service
const http = require('http');

const userData = {
  email: 'payments-test@example.com',
  password: 'payment123',
  phoneNumber: '+525555999999',
  fullName: 'Payments Test User'
};

const data = JSON.stringify(userData);

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🔧 Creando usuario de prueba para payments-service...\n');

const req = http.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Usuario creado exitosamente!\n');
        console.log('📧 Email:', userData.email);
        console.log('🔑 Password:', userData.password);
        console.log('\nPuedes usar estas credenciales para testing.');
      } else if (response.message && response.message.includes('ya existe')) {
        console.log('ℹ️  Usuario ya existe (esto está OK)');
        console.log('\n📧 Email:', userData.email);
        console.log('🔑 Password:', userData.password);
      } else {
        console.log('⚠️  Respuesta del servidor:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.error('❌ Error parseando respuesta:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error conectando con auth-service:', error.message);
  console.error('\nAsegúrate de que auth-service está corriendo en puerto 4001');
  process.exit(1);
});

req.write(data);
req.end();
