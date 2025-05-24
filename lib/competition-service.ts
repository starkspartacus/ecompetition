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

// Interface étendue pour la compétition avec tous les champs nécessaires
export interface Competition {
  id: string;
  _id?: any;
  title: string;
  name?: string; // Alias pour title
  description: string;
  category: string;
  country: string;
  city: string;
  commune?: string | null;
  address: string;
  venue: string;
  location?: string; // Champ calculé
  imageUrl?: string | null;
  bannerUrl?: string | null;
  registrationStartDate: Date;
  registrationDeadline: Date;
  registrationEndDate?: Date; // Alias pour registrationDeadline
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
  currentParticipants?: number; // Alias pour participants
  teams: number;
  matches: number;
}

// Type pour les requêtes MongoDB
interface MongoQuery {
  [key: string]: any;
  $or?: Array<{ [key: string]: any }>;
  $in?: any[];
  $regex?: RegExp;
  $options?: string;
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
      status: params.status || CompetitionStatus.OPEN,
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

    // Définir le statut par défaut à OPEN si non spécifié
    const status = params.status || CompetitionStatus.OPEN;

    // Créer la compétition directement avec MongoDB
    const competition = await insertOne("Competition", {
      title: params.title,
      name: params.title, // Alias pour compatibilité
      description: params.description || "",
      category: params.category,
      country: params.country,
      city: params.city,
      commune: params.commune || null,
      address: params.address,
      venue: params.venue,
      location: `${params.address}, ${params.city}, ${params.country}`, // Champ calculé
      imageUrl: params.imageUrl || null,
      bannerUrl: params.bannerUrl || null,
      registrationStartDate: params.registrationStartDate,
      registrationDeadline: params.registrationDeadline,
      registrationEndDate: params.registrationDeadline, // Alias pour compatibilité
      startDate: params.startDate,
      endDate: params.endDate,
      maxParticipants: params.maxParticipants,
      status: status,
      tournamentFormat: params.tournamentFormat || null,
      isPublic: params.isPublic !== undefined ? params.isPublic : true,
      rules: params.rules || [],
      uniqueCode,
      organizerId: params.organizerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: 0,
      currentParticipants: 0, // Alias pour compatibilité
      teams: 0,
      matches: 0,
    });

    console.log("✅ Compétition créée avec succès:", {
      id: competition.id,
      title: competition.title,
      uniqueCode: competition.uniqueCode,
      isPublic: competition.isPublic,
      status: competition.status,
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

    // Ajouter les champs calculés s'ils n'existent pas
    if (!competition.name && competition.title) {
      competition.name = competition.title;
    }
    if (
      !competition.location &&
      competition.address &&
      competition.city &&
      competition.country
    ) {
      competition.location = `${competition.address}, ${competition.city}, ${competition.country}`;
    }
    if (!competition.registrationEndDate && competition.registrationDeadline) {
      competition.registrationEndDate = competition.registrationDeadline;
    }
    if (
      competition.currentParticipants === undefined &&
      competition.participants !== undefined
    ) {
      competition.currentParticipants = competition.participants;
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
        return normalizeCompetitions(altCompetitions);
      }
    }

    console.log(`✅ ${competitions.length} compétitions trouvées`);
    return normalizeCompetitions(competitions);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    throw error;
  }
}

/**
 * Récupère toutes les compétitions publiques
 */
export async function getPublicCompetitions(
  filters: any = {}
): Promise<Competition[]> {
  try {
    console.log(
      "Récupération des compétitions publiques avec filtres:",
      filters
    );

    // Construire la requête de base
    const query: MongoQuery = { isPublic: true };

    // Ajouter les filtres si spécifiés
    if (filters.country && filters.country !== "all") {
      query.country = filters.country;
    }

    if (filters.category && filters.category !== "all") {
      query.category = filters.category;
    }

    // Filtre par statut
    if (filters.status && filters.status !== "all") {
      if (filters.status === "COMING_SOON") {
        // Pour "Prochainement", on cherche les compétitions en DRAFT
        query.status = CompetitionStatus.DRAFT;
      } else {
        // Pour les autres statuts, utiliser directement la valeur
        query.status = filters.status;
      }
    } else {
      // Si aucun filtre de statut, exclure les CANCELLED
      query.status = { $ne: CompetitionStatus.CANCELLED };
    }

    // Filtre de recherche textuelle
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [
        { title: searchRegex },
        { name: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { country: searchRegex },
        { city: searchRegex },
        { uniqueCode: filters.search }, // Recherche exacte pour le code
      ];
    }

    console.log("Requête MongoDB:", JSON.stringify(query, null, 2));

    // Récupérer les compétitions directement avec MongoDB
    let competitions = await find("Competition", query);

    // Si aucune compétition n'est trouvée, essayer dans la collection "competitions" (minuscule)
    if (competitions.length === 0) {
      console.log(
        "Aucune compétition trouvée dans 'Competition', essai dans 'competitions'..."
      );
      const altCompetitions = await find("competitions", query);
      if (altCompetitions.length > 0) {
        console.log(
          `✅ ${altCompetitions.length} compétitions trouvées dans la collection "competitions"`
        );
        competitions = altCompetitions;
      }
    }

    // Si toujours aucune compétition et qu'on a des filtres spécifiques, essayer sans ces filtres
    if (
      competitions.length === 0 &&
      (filters.country || filters.category || filters.status)
    ) {
      console.log(
        "Aucune compétition trouvée avec filtres, essai sans filtres spécifiques..."
      );
      const baseQuery: MongoQuery = { isPublic: true };

      // Garder uniquement le filtre de recherche s'il existe
      if (filters.search) {
        baseQuery.$or = query.$or;
      }

      competitions = await find("Competition", baseQuery);

      if (competitions.length === 0) {
        competitions = await find("competitions", baseQuery);
      }
    }

    console.log(`✅ ${competitions.length} compétitions publiques trouvées`);
    return normalizeCompetitions(competitions);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions publiques:",
      error
    );
    throw error;
  }
}

/**
 * Normalise les compétitions pour s'assurer que tous les champs nécessaires sont présents
 */
function normalizeCompetitions(competitions: any[]): Competition[] {
  return competitions.map((comp) => {
    // Ajouter les champs calculés s'ils n'existent pas
    if (!comp.name && comp.title) {
      comp.name = comp.title;
    }
    if (!comp.location && comp.address && comp.city && comp.country) {
      comp.location = `${comp.address}, ${comp.city}, ${comp.country}`;
    }
    if (!comp.registrationEndDate && comp.registrationDeadline) {
      comp.registrationEndDate = comp.registrationDeadline;
    }
    if (
      comp.currentParticipants === undefined &&
      comp.participants !== undefined
    ) {
      comp.currentParticipants = comp.participants;
    }

    return comp as Competition;
  });
}
