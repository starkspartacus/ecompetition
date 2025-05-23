import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";
import { uploadImage } from "@/lib/blob";

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier le rôle de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ORGANIZER") {
      return NextResponse.json(
        { error: "Accès refusé. Vous devez être un organisateur." },
        { status: 403 }
      );
    }

    // Vérifier si la requête est multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    let data: any;

    if (contentType.includes("multipart/form-data")) {
      // Traiter les données du formulaire multipart
      const formData = await request.formData();

      // Extraire les fichiers
      const imageFile = formData.get("image") as File | null;
      const bannerFile = formData.get("banner") as File | null;

      // Extraire les autres données
      data = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        country: formData.get("country") as string,
        city: formData.get("city") as string,
        commune: (formData.get("commune") as string) || null,
        address: formData.get("address") as string,
        venue: formData.get("venue") as string,
        registrationStartDate: new Date(
          formData.get("registrationStartDate") as string
        ),
        registrationDeadline: new Date(
          formData.get("registrationDeadline") as string
        ),
        startDate: new Date(formData.get("startDate") as string),
        endDate: new Date(formData.get("endDate") as string),
        maxParticipants: Number.parseInt(
          formData.get("maxParticipants") as string
        ),
        status: formData.get("status") as string,
        tournamentFormat: (formData.get("tournamentFormat") as string) || null,
        isPublic: formData.get("isPublic") === "true",
        rules: (formData.get("rules") as string) || null,
      };

      // Télécharger les images si elles existent
      if (imageFile && imageFile.size > 0) {
        const imageUrl = await uploadImage(imageFile);
        data.imageUrl = imageUrl;
      }

      if (bannerFile && bannerFile.size > 0) {
        const bannerUrl = await uploadImage(bannerFile);
        data.bannerUrl = bannerUrl;
      }
    } else {
      // Traiter les données JSON
      data = await request.json();
    }

    // Valider les données requises
    const requiredFields = [
      "title",
      "category",
      "address",
      "venue",
      "maxParticipants",
      "registrationStartDate",
      "registrationDeadline",
      "startDate",
      "endDate",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Générer un code unique pour la compétition
    const uniqueCode = nanoid(8).toUpperCase();

    // Créer la compétition
    const competition = await prisma.competition.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        country: data.country,
        city: data.city,
        commune: data.commune,
        address: data.address,
        venue: data.venue,
        imageUrl: data.imageUrl,
        bannerUrl: data.bannerUrl,
        registrationStartDate: new Date(data.registrationStartDate),
        registrationDeadline: new Date(data.registrationDeadline),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxParticipants: data.maxParticipants,
        status: data.status || "DRAFT",
        tournamentFormat: data.tournamentFormat,
        isPublic: data.isPublic,
        rules: data.rules,
        uniqueCode,
        organizer: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return NextResponse.json({ success: true, competition }, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    return NextResponse.json(
      {
        error: "Une erreur est survenue lors de la création de la compétition",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les compétitions de l'organisateur
    const competitions = await prisma.competition.findMany({
      where: {
        organizerId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ competitions });
  } catch (error) {
    console.error("Erreur lors de la récupération des compétitions:", error);
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de la récupération des compétitions",
      },
      { status: 500 }
    );
  }
}
