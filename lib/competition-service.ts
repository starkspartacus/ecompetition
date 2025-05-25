import type { CompetitionStatus } from "@/lib/prisma-schema";
import {
  competitionModel,
  type CompetitionDocument,
  type CompetitionCategory,
  type CompetitionType,
} from "@/lib/models/competition-model";
import { participationModel } from "@/lib/models/participation-model";
import { teamModel } from "@/lib/models/team-model";
import { matchModel } from "@/lib/models/match-model";
import { ObjectId } from "mongodb";

// Interface pour les paramètres de création de compétition
interface CreateCompetitionParams {
  title: string;
  description?: string;
  category: CompetitionCategory;
  country: string;
  city: string;
  commune?: string;
  venue: string;
  registrationStartDate: Date;
  registrationDeadline: Date;
  startDateCompetition: Date;
  endDateCompetition: Date;
  maxParticipants: number;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  organizerId: string;
  status?: CompetitionStatus;
  tournamentFormat?: string;
  isPublic?: boolean;
  rules?: string[];
  address?: string;
  uniqueCode?: string;
}

// Interface pour les filtres de recherche
interface CompetitionFilters {
  country?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Interface pour les statistiques de compétition
interface CompetitionStats {
  totalParticipants: number;
  totalTeams: number;
  totalMatches: number;
  completedMatches: number;
  upcomingMatches: number;
}

/**
 * Crée une nouvelle compétition
 */
export async function createCompetition(
  params: CreateCompetitionParams
): Promise<CompetitionDocument> {
  try {
    console.log("🏆 Création d'une compétition:", params.title);

    // Validation des paramètres requis
    validateCompetitionParams(params);

    // Générer un code unique pour la compétition
    const uniqueCode = await generateUniqueCode();

    // Préparer les données de la compétition
    const competitionData: Partial<CompetitionDocument> = {
      name: params.title,
      description: params.description || "",
      category: params.category,
      type: "TOURNAMENT" as CompetitionType,
      status: (params.status as any) || "OPEN",
      organizerId: new ObjectId(params.organizerId),
      country: params.country,
      city: params.city,
      commune: params.commune || undefined,
      startDateCompetition: params.startDateCompetition,
      endDateCompetition: params.endDateCompetition,
      registrationStartDate: params.registrationStartDate,
      registrationDeadline: params.registrationDeadline,
      maxParticipants: params.maxParticipants,
      minParticipants: 2,
      isPublic: params.isPublic !== undefined ? params.isPublic : true,
      requiresApproval: false,
      address: params.address,
      imageUrl: params.imageUrl || undefined,
      bannerUrl: params.bannerUrl || undefined,
      rules: params.rules?.join("\n") || "",
      uniqueCode: uniqueCode,
      venue: params.venue,
    };

    // Créer la compétition avec le modèle
    const competition = await competitionModel.create(competitionData);

    if (!competition) {
      throw new Error("Échec de la création de la compétition");
    }

    console.log("✅ Compétition créée avec succès:", {
      id: competition._id,
      name: competition.name,
      status: competition.status,
    });

    return competition;
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
): Promise<CompetitionDocument | null> {
  try {
    console.log(`🔍 Recherche de la compétition: ${idOrCode}`);

    let competition: CompetitionDocument | null = null;

    // Essayer de trouver par ID si c'est un ObjectId valide
    if (ObjectId.isValid(idOrCode)) {
      competition = await competitionModel.findById(idOrCode);
    }

    // Si non trouvé, essayer par recherche dans la collection
    if (!competition) {
      const competitions = await competitionModel.findMany({
        name: { $regex: idOrCode, $options: "i" },
      });
      if (competitions.length > 0) {
        competition = competitions[0];
      }
    }

    if (!competition) {
      console.log(`❌ Compétition non trouvée: ${idOrCode}`);
      return null;
    }

    console.log(`✅ Compétition trouvée: ${competition.name}`);
    return competition;
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
): Promise<CompetitionDocument[]> {
  try {
    console.log(
      "📋 Récupération des compétitions pour l'organisateur:",
      organizerId
    );

    if (!ObjectId.isValid(organizerId)) {
      throw new Error("ID d'organisateur invalide");
    }

    const competitions = await competitionModel.findByOrganizer(organizerId);

    console.log(`✅ ${competitions.length} compétitions trouvées`);
    return competitions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    throw error;
  }
}

/**
 * Récupère toutes les compétitions publiques avec filtres
 */
export async function getPublicCompetitions(
  filters: CompetitionFilters = {}
): Promise<{
  competitions: CompetitionDocument[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    console.log(
      "🌍 Récupération des compétitions publiques avec filtres:",
      filters
    );

    const page = filters.page || 1;
    const limit = filters.limit || 10;

    // Utiliser la méthode existante du modèle
    const result = await competitionModel.findPublicCompetitions({
      country: filters.country,
      category: filters.category,
      status: filters.status,
      search: filters.search,
      page,
      limit,
    });

    const totalPages = Math.ceil(result.total / limit);

    console.log(
      `✅ ${result.competitions.length} compétitions publiques trouvées (${result.total} au total)`
    );

    return {
      competitions: result.competitions,
      total: result.total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions publiques:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour une compétition
 */
export async function updateCompetition(
  competitionId: string,
  updates: Partial<CompetitionDocument>,
  organizerId: string
): Promise<CompetitionDocument | null> {
  try {
    console.log(`📝 Mise à jour de la compétition: ${competitionId}`);

    if (!ObjectId.isValid(competitionId)) {
      throw new Error("ID de compétition invalide");
    }

    // Vérifier que la compétition existe et appartient à l'organisateur
    const existingCompetition = await competitionModel.findById(competitionId);
    if (!existingCompetition) {
      throw new Error("Compétition non trouvée");
    }

    if (existingCompetition.organizerId.toString() !== organizerId) {
      throw new Error("Accès non autorisé");
    }

    // Mettre à jour la compétition
    const updatedCompetition = await competitionModel.updateById(
      competitionId,
      {
        ...updates,
        updatedAt: new Date(),
      }
    );

    if (!updatedCompetition) {
      throw new Error("Échec de la mise à jour");
    }

    console.log("✅ Compétition mise à jour avec succès");
    return updatedCompetition;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la compétition:", error);
    throw error;
  }
}

/**
 * Supprime une compétition
 */
export async function deleteCompetition(
  competitionId: string,
  organizerId: string
): Promise<boolean> {
  try {
    console.log(`🗑️ Suppression de la compétition: ${competitionId}`);

    if (!ObjectId.isValid(competitionId)) {
      throw new Error("ID de compétition invalide");
    }

    // Vérifier que la compétition existe et appartient à l'organisateur
    const existingCompetition = await competitionModel.findById(competitionId);
    if (!existingCompetition) {
      throw new Error("Compétition non trouvée");
    }

    if (existingCompetition.organizerId.toString() !== organizerId) {
      throw new Error("Accès non autorisé");
    }

    // Supprimer toutes les données liées
    const competitionObjectId = new ObjectId(competitionId);

    // Supprimer les participations
    const participations = await participationModel.findByCompetition(
      competitionId
    );
    for (const participation of participations) {
      await participationModel.deleteById(participation._id!.toString());
    }

    // Supprimer les équipes
    const teams = await teamModel.findByCompetition(competitionId);
    for (const team of teams) {
      await teamModel.deleteById(team._id!.toString());
    }

    // Supprimer les matchs
    const matches = await matchModel.findByCompetition(competitionId);
    for (const match of matches) {
      await matchModel.deleteById(match._id!.toString());
    }

    // Supprimer la compétition
    const deleted = await competitionModel.deleteById(competitionId);

    console.log("✅ Compétition supprimée avec succès");
    return deleted;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la compétition:", error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'une compétition
 */
export async function getCompetitionStats(
  competitionId: string
): Promise<CompetitionStats> {
  try {
    console.log(`📊 Récupération des statistiques pour: ${competitionId}`);

    if (!ObjectId.isValid(competitionId)) {
      throw new Error("ID de compétition invalide");
    }

    // Récupérer les statistiques en parallèle
    const [participations, teams, matches] = await Promise.all([
      participationModel.findByCompetition(competitionId),
      teamModel.findByCompetition(competitionId),
      matchModel.findByCompetition(competitionId),
    ]);

    const completedMatches = matches.filter(
      (match) => match.status === "COMPLETED"
    ).length;
    const upcomingMatches = matches.filter(
      (match) => match.status === "SCHEDULED"
    ).length;

    const stats: CompetitionStats = {
      totalParticipants: participations.length,
      totalTeams: teams.length,
      totalMatches: matches.length,
      completedMatches,
      upcomingMatches,
    };

    console.log("✅ Statistiques récupérées:", stats);
    return stats;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques:", error);
    throw error;
  }
}

/**
 * Récupère les compétitions à venir
 */
export async function getUpcomingCompetitions(
  limit = 5
): Promise<CompetitionDocument[]> {
  try {
    console.log(`📅 Récupération des ${limit} prochaines compétitions`);

    const competitions = await competitionModel.findMany(
      {
        isPublic: true,
        startDate: { $gte: new Date() },
        status: { $in: ["OPEN", "ONGOING"] },
      },
      {
        sort: { startDate: 1 },
        limit,
      }
    );

    console.log(`✅ ${competitions.length} compétitions à venir trouvées`);
    return competitions;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions à venir:",
      error
    );
    throw error;
  }
}

/**
 * Valide les paramètres de création de compétition
 */
function validateCompetitionParams(params: CreateCompetitionParams): void {
  const requiredFields = [
    "title",
    "category",
    "country",
    "city",
    "venue",
    "registrationStartDate",
    "registrationDeadline",
    "startDateCompetition",
    "endDateCompetition",
    "maxParticipants",
    "organizerId",
  ];

  for (const field of requiredFields) {
    if (!params[field as keyof CreateCompetitionParams]) {
      throw new Error(`Le champ ${field} est requis`);
    }
  }

  // Validation des dates
  const now = new Date();
  if (params.registrationStartDate < now) {
    throw new Error(
      "La date de début d'inscription ne peut pas être dans le passé"
    );
  }

  if (params.registrationDeadline <= params.registrationStartDate) {
    throw new Error(
      "La date limite d'inscription doit être après la date de début"
    );
  }

  if (params.startDateCompetition <= params.registrationDeadline) {
    throw new Error(
      "La date de début de compétition doit être après la date limite d'inscription"
    );
  }

  if (params.endDateCompetition <= params.startDateCompetition) {
    throw new Error("La date de fin doit être après la date de début");
  }

  // Validation du nombre de participants
  if (params.maxParticipants < 2) {
    throw new Error("Le nombre minimum de participants est 2");
  }

  if (params.maxParticipants > 1000) {
    throw new Error("Le nombre maximum de participants est 1000");
  }

  // Validation de l'ID organisateur
  if (!ObjectId.isValid(params.organizerId)) {
    throw new Error("ID d'organisateur invalide");
  }
}

/**
 * Génère un code unique pour la compétition avec lettres, chiffres et symboles
 */
async function generateUniqueCode(): Promise<string> {
  // Caractères disponibles pour le code unique
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "@#$%&*+=?";
  const allChars = letters + numbers + symbols;

  let attempts = 0;
  const maxAttempts = 20;

  while (attempts < maxAttempts) {
    // Générer un code de 12 caractères avec structure : XXXX-XXXX-XXXX
    let code = "";

    // Première partie (4 caractères)
    for (let i = 0; i < 4; i++) {
      code += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    code += "-";

    // Deuxième partie (4 caractères)
    for (let i = 0; i < 4; i++) {
      code += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    code += "-";

    // Troisième partie (4 caractères)
    for (let i = 0; i < 4; i++) {
      code += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Ajouter un timestamp encodé pour garantir l'unicité temporelle
    const timestamp = Date.now().toString(36).toUpperCase().slice(-3);
    code = code.slice(0, -3) + timestamp;

    // Vérifier l'unicité en cherchant dans la collection
    const existing = await competitionModel.findMany({ uniqueCode: code });
    if (existing.length === 0) {
      console.log(`✅ Code unique généré: ${code}`);
      return code;
    }

    attempts++;
    console.log(
      `⚠️ Code ${code} déjà existant, tentative ${attempts}/${maxAttempts}`
    );
  }

  throw new Error(
    "Impossible de générer un code unique après plusieurs tentatives"
  );
}

// Interfaces pour la compatibilité avec l'ancien code
export interface Competition extends Partial<CompetitionDocument> {
  id: string;
  title?: string;
  location?: string;
  registrationEndDate?: Date;
  registrationStartDate?: Date;
  currentParticipants?: number;
  participants?: number;
  teams?: number;
  matches?: number;
  address?: string;
  startDateCompetition?: Date;
  endDateCompetition?: Date;
}

/**
 * Normalise une compétition pour la compatibilité
 */
export function normalizeCompetition(
  competition: CompetitionDocument
): Competition {
  return {
    ...competition,
    id: competition._id?.toString() || "",
    title: competition.name,
    location: `${competition.venue}, ${competition.city}, ${competition.country}`,
    address: competition.venue,
    registrationEndDate: competition.registrationDeadline,
    currentParticipants: 0, // À calculer dynamiquement
    participants: 0, // À calculer dynamiquement
    teams: 0, // À calculer dynamiquement
    matches: 0, // À calculer dynamiquement
    startDateCompetition: competition.startDateCompetition,
    endDateCompetition: competition.endDateCompetition,
  };
}

/**
 * Normalise un tableau de compétitions
 */
export function normalizeCompetitions(
  competitions: CompetitionDocument[]
): Competition[] {
  return competitions.map(normalizeCompetition);
}
