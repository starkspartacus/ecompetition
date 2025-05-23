import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb-client";

// GET: Récupérer une compétition par ID ou code unique
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = context.params;

    console.log(`🔍 Recherche de la compétition avec ID/code: ${id}`);

    // Établir la connexion à MongoDB
    const db = await connectDB();

    // Vérifier si l'ID est un ObjectId valide
    let query = {};
    let isObjectId = false;
    try {
      // Essayer de convertir en ObjectId
      const objectId = new ObjectId(id);
      query = { _id: objectId };
      isObjectId = true;
      console.log(`✅ ID valide comme ObjectId: ${id}`);
    } catch (error) {
      // Si ce n'est pas un ObjectId valide, chercher par uniqueCode
      query = { uniqueCode: id };
      console.log(
        `ℹ️ ID non valide comme ObjectId, recherche par uniqueCode: ${id}`
      );
    }

    // Rechercher dans la collection "Competition"
    let competition = await db.collection("Competition").findOne(query);

    // Si non trouvé et que c'était un ObjectId, essayer avec la collection "competitions" (minuscule)
    if (!competition && isObjectId) {
      console.log(
        `ℹ️ Compétition non trouvée dans "Competition", essai dans "competitions"`
      );
      competition = await db.collection("competitions").findOne(query);
    }

    // Si non trouvé et que c'était un code unique, essayer avec la collection "competitions" (minuscule)
    if (!competition && !isObjectId) {
      console.log(
        `ℹ️ Compétition non trouvée dans "Competition", essai dans "competitions"`
      );
      competition = await db.collection("competitions").findOne(query);
    }

    if (!competition) {
      console.log(`❌ Compétition non trouvée avec ID/code: ${id}`);
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    console.log(
      `✅ Compétition trouvée: ${
        competition.title || competition.name || "Sans titre"
      }`
    );

    return NextResponse.json(competition);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la compétition:",
      error
    );
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
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { id } = context.params;

    // Établir la connexion à MongoDB
    const db = await connectDB();

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

    // Récupérer l'ID de l'utilisateur
    let userId = session.user.id;
    if (!userId && session.user.email) {
      // Si l'ID n'est pas dans la session, essayer de le récupérer par email
      const user = await db
        .collection("User")
        .findOne({ email: session.user.email });
      if (user && user._id) {
        userId = user._id.toString();
      }
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Impossible de déterminer l'ID de l'utilisateur" },
        { status: 400 }
      );
    }

    // Vérifier si la compétition existe et appartient à l'organisateur
    const existingCompetition = await db.collection("Competition").findOne({
      ...query,
      organizerId: userId,
    });

    if (!existingCompetition) {
      // Essayer dans la collection "competitions" (minuscule)
      const altCompetition = await db.collection("competitions").findOne({
        ...query,
        organizerId: userId,
      });

      if (!altCompetition) {
        return NextResponse.json(
          {
            message:
              "Compétition non trouvée ou vous n'êtes pas autorisé à la modifier",
          },
          { status: 404 }
        );
      }
    }

    // Déterminer la collection à utiliser
    const collection = existingCompetition ? "Competition" : "competitions";

    // Préparer les données à mettre à jour
    const updateData: any = {};

    // Si nous avons reçu un seul champ (comme status), ne mettre à jour que ce champ
    if (Object.keys(data).length === 1 && data.status) {
      updateData.status = data.status;
    } else {
      // Sinon, mettre à jour tous les champs fournis
      const allowedFields = [
        "title",
        "name",
        "description",
        "category",
        "country",
        "city",
        "commune",
        "address",
        "venue",
        "location",
        "startDate",
        "endDate",
        "registrationStartDate",
        "registrationEndDate",
        "registrationDeadline",
        "maxParticipants",
        "status",
        "isPublic",
        "rules",
        "imageUrl",
        "bannerUrl",
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
              "registrationDeadline",
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
    const result = await db
      .collection(collection)
      .updateOne(query, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer la compétition mise à jour
    const updatedCompetition = await db.collection(collection).findOne(query);

    return NextResponse.json({
      message: "Compétition mise à jour avec succès",
      competition: updatedCompetition,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la compétition:", error);
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
