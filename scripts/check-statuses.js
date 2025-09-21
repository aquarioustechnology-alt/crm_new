const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStatuses() {
  try {
    const statuses = await prisma.lead.findMany({
      select: { status: true },
      distinct: ['status']
    });
    
    console.log('Lead statuses in database:', statuses.map(s => s.status));
    
    // Also check the specific won lead
    const wonLead = await prisma.lead.findFirst({
      where: { status: "WON" },
      select: { id: true, name: true, status: true, projectValue: true, currency: true, createdAt: true }
    });
    
    if (wonLead) {
      console.log('\nWon lead details:', wonLead);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatuses();
