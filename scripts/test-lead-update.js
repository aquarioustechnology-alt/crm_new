const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLeadUpdate() {
  console.log('🧪 Testing lead update behavior...');

  try {
    // Find a lead to test with
    const testLead = await prisma.lead.findFirst({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        company: true,
        projectName: true,
        status: true,
        source: true,
      },
    });

    if (!testLead) {
      console.log('❌ No leads found to test with');
      return;
    }

    console.log(`📋 Testing with lead: ${testLead.name} (${testLead.id})`);
    console.log(`📧 Email: ${testLead.email}`);
    console.log(`📞 Phone: ${testLead.phone}`);
    console.log(`🏢 Company: ${testLead.company}`);
    console.log(`📋 Project: ${testLead.projectName}`);
    console.log(`📊 Status: ${testLead.status}`);
    console.log(`📍 Source: ${testLead.source}`);

    // Test partial update (like what happens with inline edits)
    console.log('\n🔄 Testing partial status update...');
    
    const newStatus = testLead.status === 'NEW_LEADS' ? 'CONTACTED' : 'NEW_LEADS';
    
    await prisma.lead.update({
      where: { id: testLead.id },
      data: { status: newStatus },
    });

    // Check if other fields are preserved
    const updatedLead = await prisma.lead.findUnique({
      where: { id: testLead.id },
      select: {
        name: true,
        email: true,
        phone: true,
        company: true,
        projectName: true,
        status: true,
        source: true,
      },
    });

    console.log('\n✅ After partial update:');
    console.log(`📧 Email: ${updatedLead.email} ${updatedLead.email === testLead.email ? '✅' : '❌'}`);
    console.log(`📞 Phone: ${updatedLead.phone} ${updatedLead.phone === testLead.phone ? '✅' : '❌'}`);
    console.log(`🏢 Company: ${updatedLead.company} ${updatedLead.company === testLead.company ? '✅' : '❌'}`);
    console.log(`📋 Project: ${updatedLead.projectName} ${updatedLead.projectName === testLead.projectName ? '✅' : '❌'}`);
    console.log(`📊 Status: ${updatedLead.status} ${updatedLead.status === newStatus ? '✅' : '❌'}`);
    console.log(`📍 Source: ${updatedLead.source} ${updatedLead.source === testLead.source ? '✅' : '❌'}`);

    // Restore original status
    await prisma.lead.update({
      where: { id: testLead.id },
      data: { status: testLead.status },
    });

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLeadUpdate();
