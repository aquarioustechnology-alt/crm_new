import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, canViewAllLeads } from "@/lib/auth-utils";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status")?.trim() || undefined;
  const source = searchParams.get("source")?.trim() || undefined;
  const isActive = searchParams.get("isActive")?.trim();

  // Build where clause
  const whereClause: any = {
    AND: [
      status ? { status } : {},
      source ? { source } : {},
      // Filter by active status - default to active only
      isActive === "false" ? { isActive: false } : 
      isActive === "all" ? {} : { isActive: true },
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
              { company: { contains: q, mode: "insensitive" } },
              { projectName: { contains: q, mode: "insensitive" } },
              { industry: { contains: q, mode: "insensitive" } },
              { projectType: { contains: q, mode: "insensitive" } },
              { country: { contains: q, mode: "insensitive" } },
              { currency: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

    // Add user isolation - admins see all leads, users see only their own
    if (!canViewAllLeads(user)) {
      whereClause.AND.push({ ownerId: user.id });
    }

    // Include owner information for admins
const includeOwner = canViewAllLeads(user) ? {
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    }
  }
} : {};

const leads = await prisma.lead.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        middleName: true,
        lastName: true,
        email: true,
        phone: true,
        designation: true,
        department: true,
        industry: true,
        country: true,
        photo: true,
        company: true,
        website: true,
        projectName: true,
        projectType: true,
        projectValue: true,
        currency: true,
        timeline: true,
        status: true,
        source: true,
        tags: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        ...(canViewAllLeads(user) && {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        })
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Reasonable limit
    });

    const response = NextResponse.json(leads);
    
    // Add optimized caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    response.headers.set('CDN-Cache-Control', 'public, max-age=60');
    response.headers.set('Vary', 'Authorization');
    
    return response;
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const b = await req.json();
    if (!b?.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    const lead = await prisma.lead.create({
      data: {
        // Personal Information
        name: b.name,
        middleName: b.middleName || null,
        lastName: b.lastName || null,
        email: b.email || null,
        phone: b.phone || null,
        designation: b.designation || null,
        department: b.department || null,
        industry: b.industry || null,
        country: b.country || null,
        photo: b.photo || null,

        // Company Information
        company: b.company || null,
        website: b.website || null,
        companyDescription: b.companyDescription || null,

        // Project Information
        projectName: b.projectName || null,
        projectDescription: b.projectDescription || null,
        projectType: b.projectType || null,
        budget: b.budget || null,
        projectValue: b.projectValue || null,
        currency: b.currency || null,
        timeline: b.timeline || null,

        // Lead Management
        status: b.status || "NEW",
        source: b.source || "OTHER",
        tags: Array.isArray(b.tags)
          ? b.tags
          : b.tags
          ? String(b.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
        notes: b.notes || null,
        isActive: true, // New leads are active by default

        // Assign to current user
        ownerId: user.id,
      },
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (e: any) {
    // handle duplicate email nicely (Prisma P2002)
    if (e?.code === "P2002" && e?.meta?.target?.includes("email")) {
      return NextResponse.json({ error: "Email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
