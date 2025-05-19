import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "Utilisateur sans mot de passe" },
        { status: 400 }
      );
    }

    const isPasswordValid = await compare(password, user.password);

    return NextResponse.json({
      success: isPasswordValid,
      role: user.role,
      message: isPasswordValid
        ? "Mot de passe valide"
        : "Mot de passe invalide",
    });
  } catch (error) {
    console.error("Test password error:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne" },
      { status: 500 }
    );
  }
}
