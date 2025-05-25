import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification et les permissions admin
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier si l'utilisateur est admin (vous pouvez ajuster cette logique)
    const user = await db.users.findByEmail(session.user.email!);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    console.log(
      "🚀 Initialisation de la base de données demandée par:",
      session.user.email
    );

    // Initialiser la base de données
    await db.initialize();

    // Vérifier la santé de la base de données
    const health = await db.healthCheck();

    return NextResponse.json({
      success: true,
      message: "Base de données initialisée avec succès",
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation de la base de données:",
      error
    );

    return NextResponse.json(
      {
        error: "Erreur lors de l'initialisation de la base de données",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier la santé de la base de données
    const health = await db.healthCheck();
    const stats = await db.getGlobalStats();

    return NextResponse.json({
      health,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la vérification de la base de données:",
      error
    );

    return NextResponse.json(
      {
        error: "Erreur lors de la vérification de la base de données",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
