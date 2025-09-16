import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRandomPassword, hashPassword, generateUsername } from "@/lib/password";
import { getCurrentUser, canManageUsers } from "@/lib/auth-utils";

// GET /api/users - List all users
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const role = searchParams.get("role");
    const isActive = searchParams.get("isActive");

    let where: any = {};

    // Search by name or email
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ];
    }

    // Filter by role
    if (role && role !== "all") {
      where.role = role;
    }

    // Filter by active status
    if (isActive !== null && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        _count: {
          select: {
            leads: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create new user
export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !canManageUsers(currentUser)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { firstName, lastName, email, role = "USER" } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate username and password
    let username = generateUsername(firstName, lastName);
    
    // Ensure username is unique
    let usernameExists = await prisma.user.findUnique({ where: { username } });
    let attempt = 1;
    while (usernameExists && attempt < 10) {
      username = generateUsername(firstName, lastName) + attempt;
      usernameExists = await prisma.user.findUnique({ where: { username } });
      attempt++;
    }

    const password = generateRandomPassword(12);
    const hashedPassword = await hashPassword(password);

    // Create user with the current admin as createdBy
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword,
        role: role as "ADMIN" | "USER",
        createdBy: currentUser.id, // Use the current admin's ID
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Return user with temporary password (only for initial response)
    return NextResponse.json({
      user,
      temporaryPassword: password, // This should be communicated securely to admin
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
