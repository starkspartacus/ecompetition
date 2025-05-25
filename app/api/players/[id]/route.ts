import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent modifier des joueurs.",
        },
        { status: 403 }
      );
    }

    const { id: playerId } = await params;
    const body = await request.json();

    // Récupérer le joueur et vérifier les autorisations
    const player = await db.players.findById(playerId);

    if (!player) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    const team = await db.teams.findById(player.teamId.toString());

    if (!team || team.captainId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier ce joueur" },
        { status: 403 }
      );
    }

    // Mettre à jour le joueur
    const updatedPlayer = await db.players.updateById(playerId, body);

    if (!updatedPlayer) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    console.log("✅ Joueur mis à jour:", playerId);

    return NextResponse.json({
      success: true,
      message: "Joueur mis à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du joueur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du joueur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent supprimer des joueurs.",
        },
        { status: 403 }
      );
    }

    const { id: playerId } = await params;

    // Récupérer le joueur et vérifier les autorisations
    const player = await db.players.findById(playerId);

    if (!player) {
      return NextResponse.json({ error: "Joueur non trouvé" }, { status: 404 });
    }

    const team = await db.teams.findById(player.teamId.toString());

    if (!team || team.captainId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer ce joueur" },
        { status: 403 }
      );
    }

    // Supprimer le joueur
    const success = await db.players.deleteById(playerId);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    console.log("✅ Joueur supprimé:", playerId);

    return NextResponse.json({
      success: true,
      message: "Joueur supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du joueur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du joueur" },
      { status: 500 }
    );
  }
}
