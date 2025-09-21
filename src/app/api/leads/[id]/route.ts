import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";

type Ctx = { params: Promise<{ id: string }> };
type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

const ownerInclude = {
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
};

function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function scopedWhere(user: CurrentUser, id: string) {
  if (user?.role === "ADMIN") {
    return { id };
  }
  return { id, ownerId: user?.id ?? "" };
}

async function handleMissingLead(id: string) {
  const leadExists = await prisma.lead.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!leadExists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return forbiddenResponse();
}

export async function GET(_: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return forbiddenResponse();
  }

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: scopedWhere(user, id),
    include: ownerInclude,
  });

  if (!lead) {
    return handleMissingLead(id);
  }

  return NextResponse.json(lead);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return forbiddenResponse();
  }

  const { id } = await params;
  const b = await req.json();

  // First, get the current lead to check if status is changing
  const currentLead = await prisma.lead.findFirst({
    where: scopedWhere(user, id),
    select: { status: true }
  });

  if (!currentLead) {
    return handleMissingLead(id);
  }

  // Check if status is changing to reset aging counter
  const statusChanged = currentLead.status !== b.status;
  
  const result = await prisma.lead.updateMany({
    where: scopedWhere(user, id),
    data: {
      // Personal Information
      name: b.name,
      middleName: b.middleName ?? null,
      lastName: b.lastName ?? null,
      email: b.email ?? null,
      phone: b.phone ?? null,
      designation: b.designation ?? null,
      department: b.department ?? null,
      industry: b.industry ?? null,
      country: b.country ?? null,
      photo: b.photo ?? null,

      // Company Information
      company: b.company ?? null,
      website: b.website ?? null,
      companyDescription: b.companyDescription ?? null,

      // Project Information
      projectName: b.projectName ?? null,
      projectDescription: b.projectDescription ?? null,
      projectType: b.projectType ?? null,
      budget: b.budget ?? null,
      projectValue: b.projectValue ?? null,
      currency: b.currency ?? null,
      timeline: b.timeline ?? null,

      // Lead Management
      status: b.status,
      source: b.source,
      tags: Array.isArray(b.tags)
        ? b.tags
        : b.tags
        ? String(b.tags)
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [],
      notes: b.notes ?? null,

      // User ownership
      ownerId: b.ownerId,

      // Reset aging counter if status changed
      ...(statusChanged && { statusChangedAt: new Date() }),
    },
  });

  if (!result.count) {
    return handleMissingLead(id);
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  return NextResponse.json(lead);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) {
    return forbiddenResponse();
  }

  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (typeof b.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive boolean is required" }, { status: 400 });
  }

  const result = await prisma.lead.updateMany({
    where: scopedWhere(user, id),
    data: { isActive: b.isActive },
  });

  if (!result.count) {
    return handleMissingLead(id);
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  return NextResponse.json(lead);
}
