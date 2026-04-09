const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.update({
    where: { email: 'artista@piums.com' },
    data: { password: hash }
  });
  console.log('Password reset successfully.');
}
run().catch(console.error).finally(() => prisma.$disconnect());
