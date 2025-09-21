const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if we can query leads
    const leadCount = await prisma.lead.count();
    console.log(`📊 Found ${leadCount} leads in database`);
    
    // Test if statusChangedAt field exists
    try {
      const testLead = await prisma.lead.findFirst({
        select: {
          id: true,
          statusChangedAt: true
        }
      });
      console.log('✅ statusChangedAt field exists in database');
      console.log('📅 Sample statusChangedAt:', testLead?.statusChangedAt);
    } catch (error) {
      console.log('❌ statusChangedAt field does not exist yet');
      console.log('💡 You need to run the database migration first');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Check your DATABASE_URL environment variable');
  } finally {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  }
}

testConnection();
