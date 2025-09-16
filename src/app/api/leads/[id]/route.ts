import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ 
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        }
      }
    }
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json();
  const lead = await prisma.lead.update({
    where: { id },
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
        ? String(b.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
        : [],
      notes: b.notes ?? null,
      
      // User ownership
      ownerId: b.ownerId,
    },
  });
  return NextResponse.json(lead);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (typeof b.isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive boolean is required' }, { status: 400 });
  }
  const lead = await prisma.lead.update({ where: { id }, data: { isActive: b.isActive } });
  return NextResponse.json(lead);
}
