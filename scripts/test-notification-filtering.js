const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationFiltering() {
  try {
    console.log('🧪 Testing Notification Filtering Logic...\n');

    // Test 1: Get all users and their roles
    console.log('1. Fetching all users and their roles:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    users.forEach(user => {
      console.log(`   - ${user.name || user.email} (${user.role})`);
    });

    // Test 2: Get all leads with their owners
    console.log('\n2. Fetching all leads with their owners:');
    const leads = await prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        ownerId: true,
        status: true,
        isActive: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    leads.forEach(lead => {
      console.log(`   - ${lead.name} (Owner: ${lead.user?.name || lead.user?.email || 'Unknown'}) [${lead.status}]`);
    });

    // Test 3: Test filtering logic for each user
    console.log('\n3. Testing notification filtering for each user:');
    
    for (const user of users) {
      console.log(`\n   Testing for: ${user.name || user.email} (${user.role})`);
      
      // This mimics the API logic
      const whereClause = user.role === 'ADMIN' ? {} : { ownerId: user.id };
      
      const userLeads = await prisma.lead.findMany({
        where: {
          ...whereClause,
          isActive: true,
          status: {
            notIn: ['CLOSED', 'WON', 'LOST']
          }
        },
        select: {
          id: true,
          name: true,
          status: true
        }
      });

      console.log(`     Would see notifications for ${userLeads.length} leads:`);
      userLeads.forEach(lead => {
        console.log(`       - ${lead.name} [${lead.status}]`);
      });
    }

    // Test 4: Check dismissed notifications
    console.log('\n4. Checking dismissed notifications:');
    const dismissedNotifications = await prisma.dismissedNotification.findMany({
      select: {
        userId: true,
        leadId: true,
        type: true,
        dismissedAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        lead: {
          select: {
            name: true
          }
        }
      }
    });

    if (dismissedNotifications.length === 0) {
      console.log('   No dismissed notifications found.');
    } else {
      dismissedNotifications.forEach(dismissed => {
        console.log(`   - ${dismissed.user?.name || dismissed.user?.email} dismissed ${dismissed.type} for ${dismissed.lead?.name}`);
      });
    }

    console.log('\n✅ Notification filtering test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Regular users should only see notifications for leads they own');
    console.log('   - Admins should see notifications for all leads');
    console.log('   - Dismissed notifications are user-specific');

  } catch (error) {
    console.error('❌ Error testing notification filtering:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotificationFiltering();
