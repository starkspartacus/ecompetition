import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb, toObjectId } from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Utiliser MongoDB directement pour éviter les problèmes de transaction
    const db = await getDb();
    const competitionsCollection = db.collection("Competition");

    // Récupérer la compétition par son ID
    const competition = await competitionsCollection.findOne({
      _id: toObjectId(id),
    });

    if (!competition) {
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Convertir les dates en chaînes pour la sérialisation JSON
    const serializedCompetition = {
      ...competition,
      _id: competition._id.toString(),
      id: competition._id.toString(),
      organizerId: competition.organizerId.toString(),
      startDate: competition.startDate.toISOString(),
      endDate: competition.endDate.toISOString(),
      registrationStartDate:
        competition.registrationStartDate?.toISOString() || null,
      registrationEndDate: competition.registrationEndDate.toISOString(),
      createdAt: competition.createdAt.toISOString(),
      updatedAt: competition.updatedAt.toISOString(),
    };

    return NextResponse.json({ competition: serializedCompetition });
  } catch (error) {
    console.error("Erreur lors de la récupération de la compétition:", error);
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors de la récupération de la compétition",
      },
      { status: 500 }
    );
  }
}
