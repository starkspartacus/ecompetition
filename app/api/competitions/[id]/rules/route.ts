import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb-client";
import { ObjectId } from "mongodb";

export async function PUT(req: Request, context: { params: { id: string } }) {
  try {
    console.log(
      "Mise à jour des règles pour la compétition:",
      context.params.id
    );

    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("Session non trouvée, accès non autorisé");
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    if (session.user.role !== "ORGANIZER") {
      console.log("L'utilisateur n'est pas un organisateur, accès refusé");
      return NextResponse.json(
        { message: "Seuls les organisateurs peuvent modifier les règles" },
        { status: 403 }
      );
    }

    const competitionId = context.params.id;
    console.log("ID de compétition:", competitionId);

    // Connexion à MongoDB
    console.log("Connexion à MongoDB...");
    const db = await connectDB();
    console.log("Connexion établie");

    // Récupérer l'ID de l'utilisateur
    let userId = session.user.id;

    // Si l'ID n'est pas disponible dans la session, rechercher par email
    if (!userId && session.user.email) {
      console.log(
        "ID utilisateur non trouvé dans la session, recherche par email:",
        session.user.email
      );
      const userCollection = db.collection("User");
      const user = await userCollection.findOne({ email: session.user.email });

      if (user && user._id) {
        userId = user._id.toString();
        console.log("Utilisateur trouvé par email, ID:", userId);
      } else {
        console.log("Utilisateur non trouvé avec l'email:", session.user.email);
        return NextResponse.json(
          { message: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }
    }

    if (!userId) {
      console.log("Impossible de déterminer l'ID de l'utilisateur");
      return NextResponse.json(
        { message: "ID utilisateur non trouvé" },
        { status: 400 }
      );
    }

    const competitionsCollection = db.collection("Competition");

    // Vérifier si la compétition existe et appartient à l'organisateur
    console.log("Recherche de la compétition...");
    const competition = await competitionsCollection.findOne({
      _id: new ObjectId(competitionId),
      organizerId: new ObjectId(userId),
    });

    if (!competition) {
      console.log(
        "Compétition non trouvée ou n'appartient pas à l'organisateur"
      );
      return NextResponse.json(
        {
          message:
            "Compétition non trouvée ou vous n'êtes pas autorisé à la modifier",
        },
        { status: 404 }
      );
    }

    console.log("Compétition trouvée:", competition.title);

    const body = await req.json();
    console.log("Données reçues:", body);

    const {
      offsideRule,
      substitutionRule,
      yellowCardRule,
      matchDuration,
      customRules,
    } = body;

    // Mettre à jour les règles de la compétition
    console.log("Mise à jour des règles...");
    const result = await competitionsCollection.updateOne(
      { _id: new ObjectId(competitionId) },
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
      console.log("Règles mises à jour avec succès");

      // Récupérer la compétition mise à jour
      const updatedCompetition = await competitionsCollection.findOne({
        _id: new ObjectId(competitionId),
      });
      console.log("Compétition mise à jour:", updatedCompetition);

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
      console.log("Échec de la mise à jour des règles");
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

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    console.log(
      "Récupération des règles pour la compétition:",
      context.params.id
    );

    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("Session non trouvée, accès non autorisé");
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const competitionId = context.params.id;
    console.log("ID de compétition:", competitionId);

    // Connexion à MongoDB
    console.log("Connexion à MongoDB...");
    const db = await connectDB();
    console.log("Connexion établie");

    const competitionsCollection = db.collection("Competition");

    // Récupérer la compétition
    console.log("Recherche de la compétition...");
    const competition = await competitionsCollection.findOne({
      _id: new ObjectId(competitionId),
    });

    if (!competition) {
      console.log("Compétition non trouvée");
      return NextResponse.json(
        { message: "Compétition non trouvée" },
        { status: 404 }
      );
    }

    console.log("Compétition trouvée:", competition.title);

    // Vérifier si l'utilisateur est l'organisateur ou un participant
    const isOrganizer =
      session.user.role === "ORGANIZER" &&
      competition.organizerId &&
      competition.organizerId.toString() === session.user.id;

    // Si l'utilisateur n'est pas l'organisateur, vérifier s'il est un participant
    if (!isOrganizer && session.user.role !== "ADMIN") {
      // Ici, vous pourriez ajouter une vérification pour voir si l'utilisateur est un participant
      // Pour simplifier, nous permettons à tous les utilisateurs authentifiés de voir les règles
      console.log(
        "L'utilisateur n'est pas l'organisateur, mais peut voir les règles"
      );
    }

    return NextResponse.json({
      rules: {
        id: competition._id.toString(),
        title: competition.title,
        offsideRule: competition.offsideRule || "ENABLED",
        substitutionRule: competition.substitutionRule || "LIMITED",
        yellowCardRule: competition.yellowCardRule || "STANDARD",
        matchDuration: competition.matchDuration || "STANDARD",
        customRules: competition.customRules || "",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des règles:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la récupération des règles" },
      { status: 500 }
    );
  }
}
