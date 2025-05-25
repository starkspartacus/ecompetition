import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id: teamId } = await params;

    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "ID d'équipe invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'équipe
    const team = await db.teams.findById(teamId);

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier les autorisations
    if (
      session.user.role === "PARTICIPANT" &&
      team.captainId.toString() !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à voir cette équipe" },
        { status: 403 }
      );
    }

    // Enrichir les données de l'équipe
    let enrichedTeam;
    try {
      // Récupérer les joueurs
      const players = await db.players.findByTeam(teamId);

      // Récupérer les informations de la compétition
      const competition = await db.competitions.findById(
        team.competitionId.toString()
      );

      // Récupérer les informations du capitaine
      const captain = await db.users.findById(team.captainId.toString());

      enrichedTeam = {
        id: team._id?.toString(),
        name: team.name,
        description: team.description || "",
        logo: team.logo || null,
        colors: "#3B82F6", // Couleur par défaut
        competitionId: team.competitionId.toString(),
        competition: competition
          ? {
              id: competition._id?.toString(),
              name: competition.name,
              category: competition.category,
              status: competition.status,
            }
          : null,
        captainId: team.captainId.toString(),
        captain: captain
          ? {
              id: captain._id?.toString(),
              name: `${captain.firstName || ""} ${
                captain.lastName || ""
              }`.trim(),
              email: captain.email,
            }
          : null,
        players: players
          .filter((player: any) => player._id) // Filtrer les joueurs sans _id
          .map((player: any) => ({
            id: player._id!.toString(), // Assertion de non-nullité après filtrage
            name: player.name,
            age: player.age,
            position: player.position || "",
            number: player.number || null,
            photoUrl: player.photoUrl || null,
            stats: player.stats || {},
            createdAt: player.createdAt,
          })),
        playersCount: players.length,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    } catch (enrichError) {
      console.warn(
        "⚠️ Erreur lors de l'enrichissement des données:",
        enrichError
      );

      // Fallback : retourner les données de base
      enrichedTeam = {
        id: team._id?.toString(),
        name: team.name,
        description: team.description || "",
        logo: team.logo || null,
        colors: "#3B82F6",
        competitionId: team.competitionId.toString(),
        competition: null,
        captainId: team.captainId.toString(),
        captain: null,
        players: [],
        playersCount: 0,
        isActive: team.isActive,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      };
    }

    return NextResponse.json({ team: enrichedTeam });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'équipe" },
      { status: 500 }
    );
  }
}

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
            "Non autorisé. Seuls les participants peuvent modifier des équipes.",
        },
        { status: 403 }
      );
    }

    const { id: teamId } = await params;
    const body = await request.json();
    const { name, description, logo } = body;

    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "ID d'équipe invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'équipe existe et appartient à l'utilisateur
    const team = await db.teams.findById(teamId);

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    if (team.captainId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à modifier cette équipe" },
        { status: 403 }
      );
    }

    // Vérifier que le nouveau nom n'est pas déjà pris (si changé)
    if (name && name !== team.name) {
      const existingTeams = await db.teams.findByCompetition(
        team.competitionId.toString()
      );
      const nameExists = existingTeams.some(
        (t: any) =>
          t.name.toLowerCase() === name.toLowerCase() &&
          t._id.toString() !== teamId
      );

      if (nameExists) {
        return NextResponse.json(
          { error: "Ce nom d'équipe est déjà pris dans cette compétition" },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;

    // Mettre à jour l'équipe
    const updatedTeam = await db.teams.updateById(teamId, updateData);

    if (!updatedTeam) {
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour" },
        { status: 500 }
      );
    }

    console.log("✅ Équipe mise à jour:", teamId);

    return NextResponse.json({
      success: true,
      message: "Équipe mise à jour avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'équipe" },
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
            "Non autorisé. Seuls les participants peuvent supprimer des équipes.",
        },
        { status: 403 }
      );
    }

    const { id: teamId } = await params;

    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "ID d'équipe invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'équipe existe et appartient à l'utilisateur
    const team = await db.teams.findById(teamId);

    if (!team) {
      return NextResponse.json(
        { error: "Équipe non trouvée" },
        { status: 404 }
      );
    }

    if (team.captainId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer cette équipe" },
        { status: 403 }
      );
    }

    // Supprimer tous les joueurs de l'équipe
    try {
      const players = await db.players.findByTeam(teamId);
      for (const player of players) {
        if (player._id) {
          await db.players.deleteById(player._id.toString());
        }
      }
      console.log(
        `✅ ${players.length} joueurs supprimés de l'équipe ${teamId}`
      );
    } catch (playerError) {
      console.warn(
        "⚠️ Erreur lors de la suppression des joueurs:",
        playerError
      );
    }

    // Supprimer l'équipe
    const success = await db.teams.deleteById(teamId);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    console.log("✅ Équipe supprimée:", teamId);

    return NextResponse.json({
      success: true,
      message: "Équipe supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'équipe" },
      { status: 500 }
    );
  }
}
