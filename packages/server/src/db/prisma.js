const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client instance
let prisma;
function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

module.exports = getPrisma();
