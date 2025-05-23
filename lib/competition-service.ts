/**
 * Service de compétition qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import {
  validateCompetition,
  CompetitionStatus,
  CompetitionCategory,
  TournamentFormat,
  OffsideRule,
  SubstitutionRule,
  YellowCardRule,
  MatchDuration,
  type Competition,
} from "./prisma-schema";
import { generateUniqueCode } from "./utils";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les compétitions
const COLLECTION_NAME = "Competition";

/**
 * Crée une nouvelle compétition
 */
export async function createCompetition(
  competitionData: any
): Promise<Competition> {
  try {
    // Générer un code unique
    const uniqueCode = generateUniqueCode();

    // Préparer les données de la compétition
    const competition = {
      ...competitionData,
      uniqueCode,
      status: competitionData.status || CompetitionStatus.DRAFT,
      isPublic:
        competitionData.isPublic !== undefined
          ? competitionData.isPublic
          : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedCompetition = validateCompetition(competition);

    // Créer la compétition dans la base de données
    const createdCompetition = await createDocument(
      COLLECTION_NAME,
      validatedCompetition
    );

    console.log(`✅ Compétition créée avec succès: ${createdCompetition.id}`);
    return createdCompetition as Competition;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la compétition:", error);
    throw error;
  }
}

/**
 * Récupère une compétition par son ID
 */
export async function getCompetitionById(
  id: string
): Promise<Competition | null> {
  try {
    const competition = await findDocumentById(COLLECTION_NAME, id);
    return competition as Competition | null;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la compétition:",
      error
    );
    throw error;
  }
}

/**
 * Récupère une compétition par son code unique
 */
export async function getCompetitionByUniqueCode(
  uniqueCode: string
): Promise<Competition | null> {
  try {
    const competitions = await findDocuments(COLLECTION_NAME, { uniqueCode });
    return competitions.length > 0 ? (competitions[0] as Competition) : null;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la compétition par code unique:",
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
    const competitions = await findDocuments(
      COLLECTION_NAME,
      { organizerId },
      { sort: { createdAt: -1 } }
    );
    return competitions as Competition[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des compétitions de l'organisateur:",
      error
    );
    throw error;
  }
}

/**
 * Récupère toutes les compétitions avec filtres optionnels
 */
export async function getAllCompetitions(
  filters: any = {},
  options: any = {}
): Promise<Competition[]> {
  try {
    const competitions = await findDocuments(COLLECTION_NAME, filters, options);
    return competitions as Competition[];
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    throw error;
  }
}

/**
 * Met à jour une compétition
 */
export async function updateCompetition(
  id: string,
  competitionData: any
): Promise<Competition> {
  try {
    // Récupérer la compétition existante
    const existingCompetition = await getCompetitionById(id);

    if (!existingCompetition) {
      throw new Error("Compétition non trouvée");
    }

    // Fusionner les données existantes avec les nouvelles données
    const updatedCompetition = {
      ...existingCompetition,
      ...competitionData,
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedCompetition = validateCompetition(updatedCompetition);

    // Mettre à jour la compétition dans la base de données
    const result = await updateDocument(
      COLLECTION_NAME,
      id,
      validatedCompetition
    );

    console.log(`✅ Compétition mise à jour avec succès: ${id}`);
    return result as Competition;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la compétition:", error);
    throw error;
  }
}

/**
 * Supprime une compétition
 */
export async function deleteCompetition(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Compétition supprimée avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la compétition:", error);
    throw error;
  }
}

/**
 * Compte le nombre de compétitions avec filtres optionnels
 */
export async function countCompetitions(filters: any = {}): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, filters);
  } catch (error) {
    console.error("❌ Erreur lors du comptage des compétitions:", error);
    throw error;
  }
}

/**
 * Récupère toutes les catégories de compétition
 */
export function getAllCompetitionCategories(): string[] {
  return Object.values(CompetitionCategory);
}

/**
 * Récupère tous les formats de tournoi
 */
export function getAllTournamentFormats(): string[] {
  return Object.values(TournamentFormat);
}

/**
 * Récupère toutes les règles de hors-jeu
 */
export function getAllOffsideRules(): string[] {
  return Object.values(OffsideRule);
}

/**
 * Récupère toutes les règles de substitution
 */
export function getAllSubstitutionRules(): string[] {
  return Object.values(SubstitutionRule);
}

/**
 * Récupère toutes les règles de carton jaune
 */
export function getAllYellowCardRules(): string[] {
  return Object.values(YellowCardRule);
}

/**
 * Récupère toutes les durées de match
 */
export function getAllMatchDurations(): string[] {
  return Object.values(MatchDuration);
}
