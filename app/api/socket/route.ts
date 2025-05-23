import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Retourner les informations de connexion WebSocket
    return NextResponse.json({
      socketUrl: process.env.NEXTAUTH_URL || "http://localhost:3000",
      userId: session.user.id,
      userRole: session.user.role,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des infos WebSocket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
