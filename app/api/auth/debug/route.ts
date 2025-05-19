import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Vérifier si l'utilisateur est connecté
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "Non authentifié",
      });
    }

    // Récupérer les informations de l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      authenticated: true,
      session,
      user,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors du débogage",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
