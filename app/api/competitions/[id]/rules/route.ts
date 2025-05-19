import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, toObjectId } from "@/lib/mongodb";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        { message: "Seuls les organisateurs peuvent modifier les règles" },
        { status: 403 }
      );
    }

    const competitionId = params.id;

    // Utiliser directement MongoDB pour éviter les problèmes de transaction
    const db = await getDb();
    const competitionsCollection = db.collection("Competition");

    // Vérifier si la compétition existe et appartient à l'organisateur
    const competition = await competitionsCollection.findOne({
      _id: toObjectId(competitionId),
      organizerId: toObjectId(session.user.id),
    });

    if (!competition) {
      return NextResponse.json(
        {
          message:
            "Compétition non trouvée ou vous n'êtes pas autorisé à la modifier",
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      offsideRule,
      substitutionRule,
      yellowCardRule,
      matchDuration,
      customRules,
    } = body;

    // Mettre à jour les règles de la compétition
    const result = await competitionsCollection.updateOne(
      { _id: toObjectId(competitionId) },
      {
        $set: {
          offsideRule,
          substitutionRule,
          yellowCardRule,
          matchDuration,
          customRules,
          updatedAt: new Date(),
        },
      }
    );

    if (result.acknowledged) {
      // Récupérer la compétition mise à jour
      const updatedCompetition = await competitionsCollection.findOne({
        _id: toObjectId(competitionId),
      });

      return NextResponse.json({
        message: "Règles mises à jour avec succès",
        competition: {
          id: updatedCompetition?._id.toString(),
          title: updatedCompetition?.title,
          offsideRule: updatedCompetition?.offsideRule,
          substitutionRule: updatedCompetition?.substitutionRule,
          yellowCardRule: updatedCompetition?.yellowCardRule,
          matchDuration: updatedCompetition?.matchDuration,
          customRules: updatedCompetition?.customRules,
        },
      });
    } else {
      throw new Error("Échec de la mise à jour des règles");
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des règles:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la mise à jour des règles" },
      { status: 500 }
    );
  }
}
