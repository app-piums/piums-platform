const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function test() {
  // Try to find the user in piums_users
  const user = await prisma.user.findFirst({ where: { email: 'cliente@piums.com' } });
  if (!user) { console.log('User not found'); return; }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, status: user.status },
    process.env.JWT_SECRET || 'piums_super_secret_jwt_key_2024',
    { expiresIn: '1d' }
  );
  
  console.log("Generated Token:", token.substring(0, 20) + "...");
  
  const res = await fetch('http://localhost:3000/api/chat/conversations', {
    headers: { 'Cookie': `auth_token=${token}` }
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", JSON.stringify(data, null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
