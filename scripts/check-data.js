/**
 * Script to check what data exists in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Checking database data...\n');
    
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      }
    });
    
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Check targets
    const targets = await prisma.target.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    console.log(`\n🎯 Targets: ${targets.length}`);
    targets.forEach(target => {
      const userInfo = target.user ? `${target.user.firstName} ${target.user.lastName}` : 'Company';
      console.log(`  - ${target.targetType} target for ${userInfo} - ${target.amount} ${target.currency} - ${target.period} ${target.year}${target.month ? `/${target.month}` : ''}`);
    });
    
    // Check leads with "Won" status
    const wonLeads = await prisma.lead.findMany({
      where: {
        status: "Won"
      },
      select: {
        id: true,
        name: true,
        projectValue: true,
        currency: true,
        status: true,
        createdAt: true,
        owner: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`\n🏆 Won Leads: ${wonLeads.length}`);
    wonLeads.forEach(lead => {
      const ownerInfo = lead.owner ? `${lead.owner.firstName} ${lead.owner.lastName}` : 'No Owner';
      console.log(`  - ${lead.name} - ${lead.projectValue} ${lead.currency} - Owner: ${ownerInfo} - Created: ${lead.createdAt.toISOString().split('T')[0]}`);
    });
    
    // Check all leads by status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });
    
    console.log(`\n📊 Leads by Status:`);
    leadsByStatus.forEach(group => {
      console.log(`  - ${group.status}: ${group._count.status}`);
    });
    
    console.log('\n✅ Data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkData()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { checkData };
