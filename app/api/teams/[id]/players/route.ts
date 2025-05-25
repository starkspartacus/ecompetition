import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "PARTICIPANT") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les participants peuvent ajouter des joueurs.",
        },
        { status: 403 }
      );
    }

    const { id: teamId } = await params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      position,
      jerseyNumber,
      dateOfBirth,
      nationality,
      height,
      weight,
      photo,
    } = body;

    console.log(
      "👤 Ajout d'un nouveau joueur:",
      firstName,
      lastName,
      "à l'équipe:",
      teamId
    );

    // Validation des données requises
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Le prénom et le nom du joueur sont requis" },
        { status: 400 }
      );
    }

    // Validation de l'ObjectId
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

    // Vérifier que l'utilisateur est le capitaine de l'équipe
    if (team.captainId.toString() !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Vous n'êtes pas autorisé à ajouter des joueurs à cette équipe",
        },
        { status: 403 }
      );
    }

    // Vérifier que le numéro de maillot n'est pas déjà pris (si spécifié)
    if (jerseyNumber) {
      const existingPlayers = await db.players.findByTeam(teamId);
      const numberExists = existingPlayers.some(
        (p) => p.jerseyNumber === Number.parseInt(jerseyNumber)
      );

      if (numberExists) {
        return NextResponse.json(
          { error: "Ce numéro de maillot est déjà pris dans cette équipe" },
          { status: 400 }
        );
      }
    }

    // Créer le joueur avec les bonnes propriétés du modèle PlayerDocument
    const playerData = {
      firstName,
      lastName,
      teamId: new ObjectId(teamId),
      jerseyNumber: jerseyNumber
        ? Number.parseInt(jerseyNumber)
        : await db.players.getNextJerseyNumber(teamId),
      position: position || "OTHER",
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      nationality: nationality || undefined,
      height: height ? Number.parseFloat(height) : undefined,
      weight: weight ? Number.parseFloat(weight) : undefined,
      isActive: true,
      isCaptain: false,
      photo: photo || undefined,
    };

    const player = await db.players.createPlayer(playerData);

    if (!player) {
      return NextResponse.json(
        { error: "Erreur lors de la création du joueur" },
        { status: 500 }
      );
    }

    console.log("✅ Joueur ajouté avec succès:", player._id?.toString());

    // Retourner le joueur avec l'ID en string pour la compatibilité
    const responsePlayer = {
      id: player._id!.toString(),
      firstName: player.firstName,
      lastName: player.lastName,
      fullName: `${player.firstName} ${player.lastName}`,
      jerseyNumber: player.jerseyNumber,
      position: player.position,
      dateOfBirth: player.dateOfBirth,
      nationality: player.nationality,
      height: player.height,
      weight: player.weight,
      isActive: player.isActive,
      isCaptain: player.isCaptain,
      photo: player.photo,
      teamId: player.teamId.toString(),
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };

    return NextResponse.json({
      success: true,
      player: responsePlayer,
      message: "Joueur ajouté avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du joueur:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout du joueur" },
      { status: 500 }
    );
  }
}

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

    // Validation de l'ObjectId
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json(
        { error: "ID d'équipe invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'équipe existe
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
        {
          error: "Vous n'êtes pas autorisé à voir les joueurs de cette équipe",
        },
        { status: 403 }
      );
    }

    // Récupérer les joueurs
    const players = await db.players.findByTeam(teamId);

    // Formater les joueurs pour la réponse
    const formattedPlayers = players
      .filter((player: any) => player._id) // Filtrer les joueurs sans ID
      .map((player: any) => ({
        id: player._id!.toString(),
        firstName: player.firstName,
        lastName: player.lastName,
        fullName: `${player.firstName} ${player.lastName}`,
        jerseyNumber: player.jerseyNumber,
        position: player.position,
        dateOfBirth: player.dateOfBirth,
        nationality: player.nationality,
        height: player.height,
        weight: player.weight,
        isActive: player.isActive,
        isCaptain: player.isCaptain,
        photo: player.photo,
        teamId: player.teamId.toString(),
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
      }));

    return NextResponse.json({
      players: formattedPlayers,
      total: formattedPlayers.length,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des joueurs:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des joueurs" },
      { status: 500 }
    );
  }
}
