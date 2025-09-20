import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    console.log('🧪 Test achievements API called');
    
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Session found for user:', session.user.email);

    // Test basic database query
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount);

    const targetCount = await prisma.target.count();
    console.log('✅ Target count:', targetCount);

    const leadCount = await prisma.lead.count();
    console.log('✅ Lead count:', leadCount);

    // Test the specific query used in achievements API
    const monthlyTargets = await prisma.target.findMany({
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

    console.log('✅ Monthly targets found:', monthlyTargets.length);

    return NextResponse.json({
      success: true,
      counts: {
        users: userCount,
        targets: targetCount,
        leads: leadCount,
        monthlyTargets2025: monthlyTargets.length
      },
      targets: monthlyTargets.map(target => ({
        id: target.id,
        amount: target.amount,
        currency: target.currency,
        year: target.year,
        month: target.month,
        user: target.user ? `${target.user.firstName} ${target.user.lastName}` : 'No User'
      }))
    });

  } catch (error) {
    console.error('❌ Test API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: "Test API failed", 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
