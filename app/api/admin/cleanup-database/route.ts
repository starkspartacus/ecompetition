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

    // Vérifier si l'utilisateur est admin
    const user = await db.users.findByEmail(session.user.email!);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    console.log(
      "🧹 Nettoyage de la base de données demandé par:",
      session.user.email
    );

    // Nettoyer les données expirées
    await db.cleanup();

    return NextResponse.json({
      success: true,
      message: "Nettoyage de la base de données effectué avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage de la base de données:", error);

    return NextResponse.json(
      {
        error: "Erreur lors du nettoyage de la base de données",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
