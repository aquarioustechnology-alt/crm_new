import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRandomPassword, hashPassword } from "@/lib/password";

// POST /api/users/[id]/reset-password - Reset user password
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate new password
    const newPassword = generateRandomPassword(12);
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: "Password reset successfully",
      temporaryPassword: newPassword, // This should be communicated securely to admin
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
