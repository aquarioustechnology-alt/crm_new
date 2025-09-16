import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Ensure Prisma runs on Node.js runtime
export const runtime = 'nodejs'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const url = process.env.NEXTAUTH_URL
    const db = process.env.DATABASE_URL
    const now = await prisma.$queryRawUnsafe<any>('select now(), current_user')
    const user = await prisma.user.findUnique({
      where: { email: 'admin@crm.com' },
      select: { id: true, email: true }
    })
    
    return NextResponse.json({
      ok: true,
      url,
      dbHost: db?.split('@')[1]?.split('/')[0],
      now,
      userExists: !!user
    })
  } catch (e: any) {
    return NextResponse.json({ 
      ok: false, 
      error: String(e),
      stack: e.stack 
    }, { status: 500 })
  }
}
