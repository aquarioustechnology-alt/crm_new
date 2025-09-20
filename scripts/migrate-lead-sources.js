/**
 * Migration script to standardize lead source casing
 * Converts all lead sources to title case format
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapping of common source variations to title case
const sourceMapping = {
  // Uppercase variations
  'WEBSITE': 'Website',
  'LINKEDIN': 'LinkedIn', 
  'WHATSAPP': 'WhatsApp',
  'REFERRAL': 'Referral',
  'ADS': 'Ads',
  'IMPORT': 'Import',
  'OTHER': 'Other',
  'COLD CALL': 'Cold Call',
  'EMAIL': 'Email',
  'SOCIAL MEDIA': 'Social Media',
  'ADVERTISEMENT': 'Advertisement',
  'GOOGLE ADS': 'Google Ads',
  'META ADS': 'Meta Ads',
  
  // Lowercase variations
  'website': 'Website',
  'linkedin': 'LinkedIn',
  'whatsapp': 'WhatsApp', 
  'referral': 'Referral',
  'ads': 'Ads',
  'import': 'Import',
  'other': 'Other',
  'cold call': 'Cold Call',
  'email': 'Email',
  'social media': 'Social Media',
  'advertisement': 'Advertisement',
  'google ads': 'Google Ads',
  'meta ads': 'Meta Ads',
  
  // Mixed case variations
  'Website': 'Website',
  'LinkedIn': 'LinkedIn',
  'WhatsApp': 'WhatsApp',
  'Referral': 'Referral',
  'Ads': 'Ads',
  'Import': 'Import',
  'Other': 'Other',
  'Cold Call': 'Cold Call',
  'Email': 'Email',
  'Social Media': 'Social Media',
  'Advertisement': 'Advertisement',
  'Google Ads': 'Google Ads',
  'Meta Ads': 'Meta Ads',
};

async function migrateLeadSources() {
  try {
    console.log('🔄 Starting lead source migration...');
    
    // Get all unique lead sources from database
    const leads = await prisma.lead.findMany({
      select: { id: true, source: true },
      distinct: ['source']
    });
    
    console.log(`📊 Found ${leads.length} unique source values to check`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each unique source
    for (const lead of leads) {
      const originalSource = lead.source;
      const normalizedSource = sourceMapping[originalSource];
      
      if (normalizedSource && normalizedSource !== originalSource) {
        // Update all leads with this source
        const result = await prisma.lead.updateMany({
          where: { source: originalSource },
          data: { source: normalizedSource }
        });
        
        updatedCount += result.count;
        console.log(`✅ Updated "${originalSource}" → "${normalizedSource}" (${result.count} leads)`);
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped "${originalSource}" (already correct or unknown)`);
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Updated: ${updatedCount} leads`);
    console.log(`⏭️  Skipped: ${skippedCount} sources`);
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateLeadSources()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateLeadSources };
