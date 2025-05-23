import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { connectDB, findOne, updateOne } from "@/lib/mongodb-client";

// GET: Récupérer une compétition par ID ou code unique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Établir la connexion à MongoDB
    await connectDB();

    // Vérifier si l'ID est un ObjectId valide
    let query = {};
    try {
      // Essayer de convertir en ObjectId
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch (error) {
      // Si ce n'est pas un ObjectId valide, chercher par uniqueCode
      query = { uniqueCode: id };
    }

    const competition = await findOne("competitions", query);

    if (!competition) {
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ competition });
  } catch (error) {
    console.error("Erreur lors de la récupération de la compétition:", error);
    return NextResponse.json(
      {
        message: `Erreur: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour une compétition
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Établir la connexion à MongoDB
    await connectDB();

    const data = await request.json();

    // Vérifier si l'ID est un ObjectId valide
    let query = {};
    try {
      // Essayer de convertir en ObjectId
      const objectId = new ObjectId(id);
      query = { _id: objectId };
    } catch (error) {
      // Si ce n'est pas un ObjectId valide, chercher par uniqueCode
      query = { uniqueCode: id };
    }

    // Vérifier si la compétition existe et appartient à l'organisateur
    const existingCompetition = await findOne("competitions", {
      ...query,
      organizerId: session.user.id,
    });

    if (!existingCompetition) {
      return NextResponse.json(
        {
          message:
            "Compétition non trouvée ou vous n'êtes pas autorisé à la modifier",
        },
        { status: 404 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData: any = {};

    // Si nous avons reçu un seul champ (comme status), ne mettre à jour que ce champ
    if (Object.keys(data).length === 1 && data.status) {
      updateData.status = data.status;
    } else {
      // Sinon, mettre à jour tous les champs fournis
      const allowedFields = [
        "name",
        "description",
        "category",
        "location",
        "startDate",
        "endDate",
        "registrationStartDate",
        "registrationEndDate",
        "maxParticipants",
        "status",
        "isPublic",
        "rules",
      ];

      allowedFields.forEach((field) => {
        if (data[field] !== undefined) {
          // Convertir les dates en objets Date
          if (
            [
              "startDate",
              "endDate",
              "registrationStartDate",
              "registrationEndDate",
            ].includes(field) &&
            data[field]
          ) {
            updateData[field] = new Date(data[field]);
          } else {
            updateData[field] = data[field];
          }
        }
      });
    }

    // Ajouter la date de mise à jour
    updateData.updatedAt = new Date();

    // Mettre à jour la compétition
    const result = await updateOne("competitions", query, updateData);

    if (!result) {
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Compétition mise à jour avec succès",
      competition: result,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la compétition:", error);
    return NextResponse.json(
      {
        message: `Erreur: ${
          error instanceof Error ? error.message : "Erreur inconnue"
        }`,
      },
      { status: 500 }
    );
  }
}
