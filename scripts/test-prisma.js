const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPrisma() {
  try {
    console.log('🧪 Testing Prisma connection...\n');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // Test simple query
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    // Test targets query (the one used in achievements API)
    const targets = await prisma.target.findMany({
      where: {
        period: "MONTHLY",
        targetType: "USER",
        year: 2025
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
    
    console.log(`✅ Targets found: ${targets.length}`);
    targets.forEach(target => {
      const userInfo = target.user ? `${target.user.firstName} ${target.user.lastName}` : 'No User';
      console.log(`  - ${userInfo}: ${target.amount} ${target.currency}`);
    });
    
    // Test leads query
    const wonLeads = await prisma.lead.findMany({
      where: {
        status: "WON"
      }
    });
    
    console.log(`✅ Won leads found: ${wonLeads.length}`);
    wonLeads.forEach(lead => {
      console.log(`  - ${lead.name}: ${lead.projectValue} ${lead.currency}`);
    });
    
  } catch (error) {
    console.error('❌ Prisma error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
