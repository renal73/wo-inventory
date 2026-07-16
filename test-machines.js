const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.machine.findMany({take:10}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
}).catch(e => {
  console.log(e);
  p.$disconnect();
});