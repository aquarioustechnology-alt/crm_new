const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAchievements() {
  try {
    console.log('🧪 Testing achievements calculation...\n');
    
    // Get the won lead
    const wonLead = await prisma.lead.findFirst({
      where: { status: "WON" },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log('🏆 Won lead found:', {
      id: wonLead.id,
      name: wonLead.name,
      projectValue: wonLead.projectValue,
      currency: wonLead.currency,
      createdAt: wonLead.createdAt,
      owner: wonLead.owner ? `${wonLead.owner.firstName} ${wonLead.owner.lastName}` : 'No Owner'
    });
    
    // Get targets for 2025
    const targets2025 = await prisma.target.findMany({
      where: {
        year: 2025,
        period: "MONTHLY"
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`\n🎯 Targets for 2025: ${targets2025.length}`);
    targets2025.forEach(target => {
      const userInfo = target.user ? `${target.user.firstName} ${target.user.lastName}` : 'Company';
      console.log(`  - ${userInfo}: ${target.amount} ${target.currency} (${target.year}/${target.month})`);
    });
    
    // Check if the won lead falls within any target period
    const wonLeadDate = new Date(wonLead.createdAt);
    const wonLeadYear = wonLeadDate.getFullYear();
    const wonLeadMonth = wonLeadDate.getMonth() + 1;
    
    console.log(`\n📅 Won lead date: ${wonLeadYear}/${wonLeadMonth}`);
    
    const relevantTargets = targets2025.filter(target => {
      return target.year === wonLeadYear && target.month === wonLeadMonth;
    });
    
    console.log(`\n🎯 Relevant targets for ${wonLeadYear}/${wonLeadMonth}: ${relevantTargets.length}`);
    relevantTargets.forEach(target => {
      const userInfo = target.user ? `${target.user.firstName} ${target.user.lastName}` : 'Company';
      console.log(`  - ${userInfo}: ${target.amount} ${target.currency}`);
    });
    
    // Check if the won lead owner matches any target user
    if (wonLead.owner) {
      const ownerTargets = relevantTargets.filter(target => target.userId === wonLead.owner.id);
      console.log(`\n👤 Targets for lead owner (${wonLead.owner.firstName} ${wonLead.owner.lastName}): ${ownerTargets.length}`);
      
      if (ownerTargets.length > 0) {
        console.log('✅ This should generate achievements!');
        ownerTargets.forEach(target => {
          console.log(`  - Target: ${target.amount} ${target.currency}`);
          console.log(`  - Lead Value: ${wonLead.projectValue} ${wonLead.currency}`);
          console.log(`  - Achievement: ${wonLead.projectValue >= target.amount ? 'ACHIEVED' : 'NOT ACHIEVED'}`);
        });
      } else {
        console.log('❌ No targets for this lead owner in the relevant period');
      }
    } else {
      console.log('❌ Won lead has no owner assigned');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAchievements();
