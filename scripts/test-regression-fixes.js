const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRegressionFixes() {
  console.log('🔍 Testing Regression Fixes...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing Database Connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 2: Check if there are any targets in the database
    console.log('2️⃣ Checking Targets Data...');
    const targets = await prisma.target.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    console.log(`📊 Found ${targets.length} targets in database`);
    
    if (targets.length === 0) {
      console.log('⚠️  No targets found - this could explain dashboard regression');
    } else {
      console.log('✅ Targets data available');
      targets.forEach(target => {
        console.log(`   • ${target.targetType} target for ${target.user?.firstName} ${target.user?.lastName} - ${target.amount} ${target.currency} (${target.period})`);
      });
    }
    console.log('');

    // Test 3: Check if there are any leads
    console.log('3️⃣ Checking Leads Data...');
    const leads = await prisma.lead.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        projectValue: true,
        currency: true,
        ownerId: true,
        createdAt: true
      },
      take: 5
    });
    console.log(`📊 Found ${leads.length} leads (showing first 5)`);
    
    if (leads.length === 0) {
      console.log('⚠️  No leads found - this could explain dashboard regression');
    } else {
      console.log('✅ Leads data available');
      leads.forEach(lead => {
        console.log(`   • ${lead.name} - ${lead.status} - ${lead.projectValue} ${lead.currency}`);
      });
    }
    console.log('');

    // Test 4: Check for won leads specifically
    console.log('4️⃣ Checking Won Leads (for dashboard calculations)...');
    const wonLeads = await prisma.lead.findMany({
      where: {
        status: 'WON'
      },
      select: {
        id: true,
        name: true,
        projectValue: true,
        currency: true,
        ownerId: true,
        createdAt: true
      }
    });
    console.log(`📊 Found ${wonLeads.length} won leads`);
    
    if (wonLeads.length === 0) {
      console.log('⚠️  No won leads found - dashboard progress will be 0%');
    } else {
      console.log('✅ Won leads available for dashboard calculations');
    }
    console.log('');

    // Test 5: Check users
    console.log('5️⃣ Checking Users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });
    console.log(`📊 Found ${users.length} users`);
    users.forEach(user => {
      console.log(`   • ${user.firstName} ${user.lastName} (${user.role}) - ${user.email}`);
    });
    console.log('');

    // Test 6: Check comments (for notification system)
    console.log('6️⃣ Checking Comments (for notification system)...');
    const comments = await prisma.comment.findMany({
      select: {
        id: true,
        content: true,
        leadId: true,
        createdAt: true
      },
      take: 5
    });
    console.log(`📊 Found ${comments.length} comments (showing first 5)`);
    
    if (comments.length === 0) {
      console.log('⚠️  No comments found - all leads will show "first comment" notifications');
    } else {
      console.log('✅ Comments available');
      comments.forEach(comment => {
        console.log(`   • Lead ${comment.leadId} - "${comment.content.substring(0, 50)}..." - ${comment.createdAt}`);
      });
    }
    console.log('');

    // Test 7: Check leads without comments (for notification system)
    console.log('7️⃣ Checking Leads Without Comments...');
    const leadsWithoutComments = await prisma.lead.findMany({
      where: {
        comments: {
          none: {}
        },
        isActive: true,
        status: {
          notIn: ['CLOSED', 'WON', 'LOST']
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        ownerId: true
      }
    });
    console.log(`📊 Found ${leadsWithoutComments.length} leads without comments`);
    
    if (leadsWithoutComments.length > 0) {
      console.log('✅ These leads should trigger "first comment" notifications');
      leadsWithoutComments.slice(0, 3).forEach(lead => {
        const daysSince = Math.floor((new Date() - lead.createdAt) / (1000 * 60 * 60 * 24));
        console.log(`   • ${lead.name} - ${daysSince} days old`);
      });
    }
    console.log('');

    // Test 8: Check leads with stale comments
    console.log('8️⃣ Checking Leads With Stale Comments...');
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const leadsWithStaleComments = await prisma.lead.findMany({
      where: {
        isActive: true,
        status: {
          notIn: ['CLOSED', 'WON', 'LOST']
        },
        comments: {
          some: {
            createdAt: {
              lte: twoDaysAgo
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        ownerId: true,
        comments: {
          select: {
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    console.log(`📊 Found ${leadsWithStaleComments.length} leads with stale comments`);
    
    if (leadsWithStaleComments.length > 0) {
      console.log('✅ These leads should trigger "stale follow-up" notifications');
      leadsWithStaleComments.slice(0, 3).forEach(lead => {
        const lastComment = lead.comments[0];
        const daysSince = lastComment 
          ? Math.floor((new Date() - lastComment.createdAt) / (1000 * 60 * 60 * 24))
          : 0;
        console.log(`   • ${lead.name} - ${daysSince} days since last comment`);
      });
    }
    console.log('');

    console.log('🎯 Regression Test Summary:');
    console.log('==========================');
    console.log(`• Database Connection: ✅ Working`);
    console.log(`• Targets: ${targets.length > 0 ? '✅ Available' : '⚠️  None found'}`);
    console.log(`• Leads: ${leads.length > 0 ? '✅ Available' : '⚠️  None found'}`);
    console.log(`• Won Leads: ${wonLeads.length > 0 ? '✅ Available' : '⚠️  None found'}`);
    console.log(`• Users: ✅ ${users.length} found`);
    console.log(`• Comments: ${comments.length > 0 ? '✅ Available' : '⚠️  None found'}`);
    console.log(`• First Comment Notifications: ${leadsWithoutComments.length} leads`);
    console.log(`• Stale Follow-up Notifications: ${leadsWithStaleComments.length} leads`);
    
    if (targets.length === 0 || wonLeads.length === 0) {
      console.log('\n⚠️  Dashboard regression likely due to missing targets or won leads');
    } else {
      console.log('\n✅ Dashboard should be working - check API endpoint for other issues');
    }
    
    if (leadsWithoutComments.length > 0 || leadsWithStaleComments.length > 0) {
      console.log('✅ Notification system should have data to display');
    } else {
      console.log('⚠️  No notifications expected - all leads have recent comments');
    }

  } catch (error) {
    console.error('❌ Error during regression testing:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n✅ Regression testing completed');
  }
}

testRegressionFixes();
