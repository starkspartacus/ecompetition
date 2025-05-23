import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateAllCompetitionStatuses } from "@/lib/competition-status-manager";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Seuls les administrateurs peuvent déclencher manuellement
    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    console.log(
      "🔄 Mise à jour manuelle des statuts déclenchée par:",
      session.user.id
    );

    const updates = await updateAllCompetitionStatuses();

    return NextResponse.json({
      message: "Mise à jour des statuts terminée",
      updatesCount: updates.length,
      updates,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des statuts:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour" },
      { status: 500 }
    );
  }
}
