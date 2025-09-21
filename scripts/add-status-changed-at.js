const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addStatusChangedAt() {
  console.log('🔄 Adding statusChangedAt field to existing leads...');

  try {
    // Get all leads that don't have statusChangedAt set
    const leads = await prisma.lead.findMany({
      where: {
        statusChangedAt: null
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`📊 Found ${leads.length} leads to update`);

    // Update each lead to set statusChangedAt to createdAt (when they were first created)
    let updatedCount = 0;
    for (const lead of leads) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { statusChangedAt: lead.createdAt }
      });
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} leads`);
    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addStatusChangedAt()
  .catch(e => {
    console.error('Migration error:', e);
    process.exit(1);
  });
