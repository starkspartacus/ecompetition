import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent créer des équipes.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, competitionId, description, logoUrl, colors } = body;

    console.log(
      "🏆 Création d'une nouvelle équipe:",
      name,
      "pour la compétition:",
      competitionId
    );

    if (!name || !competitionId) {
      return NextResponse.json(
        { error: "Le nom de l'équipe et l'ID de la compétition sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que la compétition existe
    const competition = await db.competitions.findById(competitionId);

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur participe à cette compétition
    const participations = await db.participations.findByCompetition(
      competitionId
    );
    const userParticipation = participations.find(
      (p) =>
        p.participantId.toString() === session.user.id &&
        p.status === ("APPROVED" as any)
    );

    if (!userParticipation) {
      return NextResponse.json(
        {
          error:
            "Vous devez être accepté dans cette compétition pour créer une équipe",
        },
        { status: 403 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà une équipe dans cette compétition
    const existingTeams = await db.teams.findByCompetition(competitionId);
    const userTeam = existingTeams.find(
      (team) => team.captainId.toString() === session.user.id
    );

    if (userTeam) {
      return NextResponse.json(
        { error: "Vous avez déjà une équipe dans cette compétition" },
        { status: 400 }
      );
    }

    // Vérifier que le nom de l'équipe n'est pas déjà pris dans cette compétition
    const nameExists = existingTeams.find(
      (team) => team.name.toLowerCase() === name.toLowerCase()
    );

    if (nameExists) {
      return NextResponse.json(
        { error: "Ce nom d'équipe est déjà pris dans cette compétition" },
        { status: 400 }
      );
    }

    // Créer l'équipe avec les bons types
    const team = await db.teams.create({
      name,
      competitionId: new ObjectId(competitionId),
      captainId: new ObjectId(session.user.id),
      description: description || "",
      logo: logoUrl || undefined,
      isActive: true,
    });

    console.log("✅ Équipe créée avec succès:", team?.id);

    return NextResponse.json({
      success: true,
      team: {
        id: team?.id,
        name: team?.name,
        description: team?.description,
        logo: team?.logo,
        colors: colors || "#3B82F6",
        competitionId: competitionId,
        captainId: session.user.id,
        isActive: team?.isActive,
        createdAt: team?.createdAt,
        updatedAt: team?.updatedAt,
      },
      message: "Équipe créée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'équipe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'équipe" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const competitionId = searchParams.get("competitionId");

    let teams: any[];

    if (competitionId) {
      // Récupérer les équipes d'une compétition spécifique
      teams = await db.teams.findByCompetition(competitionId);
    } else if (session.user.role === "PARTICIPANT") {
      // Récupérer les équipes du participant connecté
      teams = await db.teams.findByCaptain(session.user.id);
    } else {
      // Pour les admins/organisateurs, récupérer toutes les équipes
      const allTeams = await db.teams.findMany({});
      teams = allTeams;
    }

    // Enrichir les données des équipes avec les informations supplémentaires
    const enrichedTeams = await Promise.all(
      teams.map(async (team: any) => {
        try {
          // Récupérer les joueurs de l'équipe
          const players = await db.players.findByTeam(team.id);

          // Récupérer les informations de la compétition
          const competition = await db.competitions.findById(
            team.competitionId.toString()
          );

          // Récupérer les informations du capitaine
          const captain = await db.users.findById(team.captainId.toString());

          return {
            id: team.id,
            name: team.name,
            description: team.description || "",
            logo: team.logo,
            colors: "#3B82F6", // Valeur par défaut
            competitionId: team.competitionId.toString(),
            competitionName: competition?.name || "Compétition inconnue",
            captainId: team.captainId.toString(),
            captainName: captain
              ? `${captain.firstName || ""} ${captain.lastName || ""}`.trim()
              : "Capitaine",
            playersCount: players.length,
            players: players.map((player: any) => ({
              id: player.id,
              name: player.name,
              age: player.age,
              position: player.position || "",
              jerseyNumber: player.jerseyNumber || null,
              photoUrl: player.photoUrl || null,
            })),
            isActive: team.isActive,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
          };
        } catch (error) {
          console.error(
            "❌ Erreur lors de l'enrichissement de l'équipe:",
            team.id,
            error
          );
          return {
            id: team.id,
            name: team.name,
            description: team.description || "",
            logo: team.logo,
            colors: "#3B82F6",
            competitionId: team.competitionId.toString(),
            competitionName: "Compétition inconnue",
            captainId: team.captainId.toString(),
            captainName: "Capitaine",
            playersCount: 0,
            players: [],
            isActive: team.isActive,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
          };
        }
      })
    );

    return NextResponse.json({
      teams: enrichedTeams,
      total: enrichedTeams.length,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des équipes:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des équipes" },
      { status: 500 }
    );
  }
}
