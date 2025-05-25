import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { uploadImage } from "@/lib/blob";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Début de la requête GET /api/competitions");

    const session = await getServerSession(authOptions);
    console.log("🔍 Session récupérée:", {
      exists: !!session,
      user: session?.user
        ? {
            id: session.user.id,
            role: session.user.role,
            email: session.user.email,
            name: session.user.name,
          }
        : null,
    });

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    console.log(
      "🔍 Récupération des compétitions pour:",
      session?.user?.role,
      session?.user?.id
    );

    if (!session) {
      console.error("❌ Aucune session trouvée");
      return NextResponse.json(
        { error: "Session non trouvée" },
        { status: 401 }
      );
    }

    if (!session.user) {
      console.error("❌ Aucun utilisateur dans la session");
      return NextResponse.json(
        { error: "Utilisateur non trouvé dans la session" },
        { status: 401 }
      );
    }

    if (!session.user.id) {
      console.error("❌ ID utilisateur manquant dans la session");
      return NextResponse.json(
        { error: "ID utilisateur manquant" },
        { status: 401 }
      );
    }

    // Si un code est fourni (pour les participants)
    if (code) {
      console.log("🔍 Recherche par code:", code);

      const competition = await db.competitions.findByUniqueCode(code);

      if (!competition) {
        return NextResponse.json(
          { error: "Compétition non trouvée avec ce code" },
          { status: 404 }
        );
      }

      console.log(
        "✅ Compétition trouvée:",
        competition.title,
        "- Statut:",
        competition.status
      );

      return NextResponse.json({
        competitions: [competition],
        total: 1,
      });
    }

    // Pour les organisateurs, récupérer leurs compétitions
    if (session.user.role === "ORGANIZER") {
      const competitions = await db.competitions.findByOrganizer(
        session.user.id
      );

      return NextResponse.json({
        competitions,
        total: competitions.length,
      });
    }

    // Pour les participants, récupérer toutes les compétitions publiques
    const { competitions, total } =
      await db.competitions.findPublicCompetitions({});

    return NextResponse.json({
      competitions,
      total,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des compétitions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ORGANIZER") {
      return NextResponse.json(
        {
          error:
            "Non autorisé. Seuls les organisateurs peuvent créer des compétitions.",
        },
        { status: 403 }
      );
    }

    console.log("🏆 Création d'une nouvelle compétition par:", session.user.id);

    // Traitement des FormData (avec fichiers)
    const formData = await request.formData();
    const data: any = {};

    // Extraire tous les champs du FormData
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        // Gérer les fichiers
        data[key] = value;
      } else if (typeof value === "string") {
        data[key] = value;
      }
    }

    console.log("📝 Données reçues:", Object.keys(data));

    const {
      title,
      description,
      category,
      startDate,
      endDate,
      registrationStartDate,
      registrationDeadline,
      maxParticipants,
      venue,
      address,
      city,
      commune,
      country,
      rules,
      prizes,
      isPublic,
      status,
      image,
      banner,
    } = data;

    // Validation des champs requis
    if (!title || !category || !startDate || !venue) {
      return NextResponse.json(
        {
          error:
            "Champs requis manquants (titre, catégorie, date de début, lieu)",
        },
        { status: 400 }
      );
    }

    // Upload des images vers Vercel Blob
    let imageUrl: string | null = null;
    let bannerUrl: string | null = null;

    try {
      if (image && image instanceof File && image.size > 0) {
        console.log("📤 Upload de l'image principale:", image.name, image.size);
        imageUrl = await uploadImage(image);
        console.log("✅ Image uploadée:", imageUrl);
      }

      if (banner && banner instanceof File && banner.size > 0) {
        console.log("📤 Upload de la bannière:", banner.name, banner.size);
        bannerUrl = await uploadImage(banner);
        console.log("✅ Bannière uploadée:", bannerUrl);
      }
    } catch (uploadError) {
      console.error("❌ Erreur lors de l'upload des images:", uploadError);
      // Continuer sans les images plutôt que d'échouer complètement
    }

    // Créer la compétition avec le service MongoDB
    const competition = await db.competitions.create({
      title,
      description: description || "",
      category,
      status: status || "DRAFT",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      registrationStartDate: registrationStartDate
        ? new Date(registrationStartDate)
        : new Date(),
      registrationDeadline: registrationDeadline
        ? new Date(registrationDeadline)
        : new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000), // 1 jour avant par défaut
      maxParticipants: Number.parseInt(maxParticipants) || 50,
      venue,
      address: address || "",
      city: city || "",
      commune: commune || "",
      country: country || "",
      imageUrl,
      bannerUrl,
      rules: Array.isArray(rules) ? rules : rules ? [rules] : [],
      prizes: Array.isArray(prizes) ? prizes : prizes ? [prizes] : [],
      isPublic: Boolean(isPublic),
      organizerId: session.user.id,
    });

    console.log(
      "✅ Compétition créée avec succès:",
      competition.id,
      "- Code:",
      competition.uniqueCode
    );
    console.log("🖼️ Images:", { imageUrl, bannerUrl });

    return NextResponse.json({
      success: true,
      competition,
      message: "Compétition créée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la compétition" },
      { status: 500 }
    );
  }
}
