import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { updateCompetitionRules } from "@/lib/db-helpers";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const { rules } = await request.json();

    // Vérifier si l'utilisateur est l'organisateur de la compétition
    const competition = await prisma.competition.findUnique({
      where: {
        id,
      },
      select: {
        organizerId: true,
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    if (
      competition.organizerId !== session.user.id &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Non autorisé à modifier cette compétition" },
        { status: 403 }
      );
    }

    // Mettre à jour les règles
    const updatedCompetition = await updateCompetitionRules(id, rules);

    return NextResponse.json(updatedCompetition);
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour des règles:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const competition = await prisma.competition.findUnique({
      where: {
        id,
      },
      select: {
        rules: true,
      },
    });

    if (!competition) {
      return NextResponse.json(
        { error: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ rules: competition.rules });
  } catch (error: any) {
    console.error("Erreur lors de la récupération des règles:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
