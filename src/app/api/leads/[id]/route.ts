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
  
  // Build update data object with only provided fields
  const updateData: any = {};

  // Personal Information - only update if provided
  if (b.name !== undefined) updateData.name = b.name;
  if (b.middleName !== undefined) updateData.middleName = b.middleName;
  if (b.lastName !== undefined) updateData.lastName = b.lastName;
  if (b.email !== undefined) updateData.email = b.email;
  if (b.phone !== undefined) updateData.phone = b.phone;
  if (b.designation !== undefined) updateData.designation = b.designation;
  if (b.department !== undefined) updateData.department = b.department;
  if (b.industry !== undefined) updateData.industry = b.industry;
  if (b.country !== undefined) updateData.country = b.country;
  if (b.photo !== undefined) updateData.photo = b.photo;

  // Company Information - only update if provided
  if (b.company !== undefined) updateData.company = b.company;
  if (b.website !== undefined) updateData.website = b.website;
  if (b.companyDescription !== undefined) updateData.companyDescription = b.companyDescription;

  // Project Information - only update if provided
  if (b.projectName !== undefined) updateData.projectName = b.projectName;
  if (b.projectDescription !== undefined) updateData.projectDescription = b.projectDescription;
  if (b.projectType !== undefined) updateData.projectType = b.projectType;
  if (b.budget !== undefined) updateData.budget = b.budget;
  if (b.projectValue !== undefined) updateData.projectValue = b.projectValue;
  if (b.currency !== undefined) updateData.currency = b.currency;
  if (b.timeline !== undefined) updateData.timeline = b.timeline;

  // Lead Management - only update if provided
  if (b.status !== undefined) updateData.status = b.status;
  if (b.source !== undefined) updateData.source = b.source;
  if (b.notes !== undefined) updateData.notes = b.notes;
  if (b.ownerId !== undefined) updateData.ownerId = b.ownerId;

  // Handle tags if provided
  if (b.tags !== undefined) {
    updateData.tags = Array.isArray(b.tags)
      ? b.tags
      : b.tags
      ? String(b.tags)
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];
  }

  // Reset aging counter if status changed
  if (statusChanged) {
    updateData.statusChangedAt = new Date();
  }

  const result = await prisma.lead.updateMany({
    where: scopedWhere(user, id),
    data: updateData,
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
