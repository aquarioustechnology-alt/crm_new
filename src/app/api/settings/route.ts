import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const whereClause = category ? { category } : {};
    
    const settings = await prisma.systemSetting.findMany({
      where: whereClause,
      orderBy: { key: 'asc' }
    });

    // Convert to key-value object for easier frontend consumption
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: "Invalid settings data" }, { status: 400 });
    }

    // Update or create settings
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      const category = getCategoryFromKey(key);
      
      return prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { 
          key, 
          value: String(value), 
          category 
        }
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

function getCategoryFromKey(key: string): string {
  if (key.startsWith('company_')) return 'company';
  if (key.startsWith('crm_')) return 'crm';
  if (key.startsWith('target_')) return 'targets';
  return 'system';
}
