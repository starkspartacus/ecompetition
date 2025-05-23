import { nanoid } from "nanoid";
import { CompetitionStatus } from "@/lib/prisma-schema";
import { insertOne, find, findOne } from "@/lib/mongodb-client";

// Interface pour les paramètres de création de compétition
interface CreateCompetitionParams {
  title: string;
  description?: string;
  category: string;
  country: string;
  city: string;
  commune?: string;
  address: string;
  venue: string;
  registrationStartDate: Date;
  registrationDeadline: Date;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  organizerId: string;
  status?: CompetitionStatus;
  tournamentFormat?: string;
  isPublic?: boolean;
  rules?: string[];
}

// Interface pour la compétition
export interface Competition {
  id: string;
  _id?: any;
  title: string;
  description: string;
  category: string;
  country: string;
  city: string;
  commune?: string | null;
  address: string;
  venue: string;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  registrationStartDate: Date;
  registrationDeadline: Date;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  status: CompetitionStatus;
  tournamentFormat?: string | null;
  isPublic: boolean;
  rules: string[];
  uniqueCode: string;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  participants: number;
  teams: number;
  matches: number;
}

/**
 * Crée une nouvelle compétition
 */
export async function createCompetition(
  params: CreateCompetitionParams
): Promise<Competition> {
  try {
    console.log("Création d'une compétition avec les paramètres:", {
      title: params.title,
      description: params.description ? "défini" : "non défini",
      category: params.category,
      country: params.country,
      city: params.city,
      commune: params.commune,
      address: params.address,
      venue: params.venue,
      registrationStartDate: params.registrationStartDate,
      registrationDeadline: params.registrationDeadline,
      startDate: params.startDate,
      endDate: params.endDate,
      maxParticipants: params.maxParticipants,
      imageUrl: params.imageUrl ? "défini" : "non défini",
      bannerUrl: params.bannerUrl ? "défini" : "non défini",
      organizerId: params.organizerId,
      status: params.status || CompetitionStatus.DRAFT,
      tournamentFormat: params.tournamentFormat,
      isPublic: params.isPublic,
      rules: params.rules,
    });

    // Vérifier les paramètres requis
    if (
      !params.title ||
      !params.category ||
      !params.country ||
      !params.city ||
      !params.address ||
      !params.venue
    ) {
      throw new Error("Données manquantes");
    }

    if (
      !params.registrationStartDate ||
      !params.registrationDeadline ||
      !params.startDate ||
      !params.endDate
    ) {
      throw new Error("Dates manquantes");
    }

    if (!params.maxParticipants || params.maxParticipants < 2) {
      throw new Error("Le nombre minimum de participants est 2");
    }

    if (!params.organizerId) {
      throw new Error("L'ID de l'organisateur est requis");
    }

    // Générer un code unique pour la compétition
    const uniqueCode = nanoid(8).toUpperCase();

    // Créer la compétition directement avec MongoDB
    const competition = await insertOne("Competition", {
      title: params.title,
      description: params.description || "",
      category: params.category,
      country: params.country,
      city: params.city,
      commune: params.commune || null,
      address: params.address,
      venue: params.venue,
      imageUrl: params.imageUrl || null,
      bannerUrl: params.bannerUrl || null,
      registrationStartDate: params.registrationStartDate,
      registrationDeadline: params.registrationDeadline,
      startDate: params.startDate,
      endDate: params.endDate,
      maxParticipants: params.maxParticipants,
      status: params.status || CompetitionStatus.DRAFT,
      tournamentFormat: params.tournamentFormat || null,
      isPublic: params.isPublic !== undefined ? params.isPublic : true,
      rules: params.rules || [],
      uniqueCode,
      organizerId: params.organizerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: 0,
      teams: 0,
      matches: 0,
    });

    console.log("✅ Compétition créée avec succès:", {
      id: competition.id,
      title: competition.title,
      uniqueCode: competition.uniqueCode,
    });

    return competition as Competition;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la compétition:", error);
    throw error;
  }
}

/**
 * Récupère une compétition par ID ou code unique
 */
export async function getCompetitionByIdOrCode(
  idOrCode: string
): Promise<Competition | null> {
  try {
    console.log(`Recherche de la compétition avec ID/code: ${idOrCode}`);

    // Essayer de trouver par ID
    let competition = null;
    try {
      competition = await findOne("Competition", { _id: idOrCode });
    } catch (error) {
      // Ignorer l'erreur si l'ID n'est pas valide
    }

    // Si non trouvé, essayer par code unique
    if (!competition) {
      competition = await findOne("Competition", { uniqueCode: idOrCode });
    }

    // Si toujours non trouvé, essayer dans la collection "competitions" (minuscule)
    if (!competition) {
      try {
        competition = await findOne("competitions", { _id: idOrCode });
      } catch (error) {
        // Ignorer l'erreur si l'ID n'est pas valide
      }

      if (!competition) {
        competition = await findOne("competitions", { uniqueCode: idOrCode });
      }
    }

    if (!competition) {
      console.log(`❌ Compétition non trouvée avec ID/code: ${idOrCode}`);
      return null;
    }

    console.log(`✅ Compétition trouvée: ${competition.title || "Sans titre"}`);
    return competition as Competition;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la compétition:",
      error
    );
    throw error;
  }
}

/**
 * Récupère les compétitions d'un organisateur
 */
export async function getCompetitionsByOrganizerId(
  organizerId: string
): Promise<Competition[]> {
  try {
    console.log(
      "Récupération des compétitions pour l'organisateur:",
      organizerId
    );

    // Récupérer les compétitions directement avec MongoDB
    const competitions = await find("Competition", { organizerId });

    // Si aucune compétition n'est trouvée, essayer dans la collection "competitions" (minuscule)
    if (competitions.length === 0) {
      const altCompetitions = await find("competitions", { organizerId });
      if (altCompetitions.length > 0) {
        console.log(
          `✅ ${altCompetitions.length} compétitions trouvées dans la collection "competitions"`
        );
        return altCompetitions as Competition[];
      }
    }

    console.log(`✅ ${competitions.length} compétitions trouvées`);
    return competitions as Competition[];
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    throw error;
  }
}
