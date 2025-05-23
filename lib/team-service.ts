/**
 * Service d'équipe qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import { validateTeam, type Team } from "./prisma-schema";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les équipes
const COLLECTION_NAME = "Team";

/**
 * Crée une nouvelle équipe
 */
export async function createTeam(teamData: any): Promise<Team> {
  try {
    // Préparer les données de l'équipe
    const team = {
      ...teamData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedTeam = validateTeam(team);

    // Créer l'équipe dans la base de données
    const createdTeam = await createDocument(COLLECTION_NAME, validatedTeam);

    console.log(`✅ Équipe créée avec succès: ${createdTeam.id}`);
    return createdTeam as Team;
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'équipe:", error);
    throw error;
  }
}

/**
 * Récupère une équipe par son ID
 */
export async function getTeamById(id: string): Promise<Team | null> {
  try {
    const team = await findDocumentById(COLLECTION_NAME, id);
    return team as Team | null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'équipe:", error);
    throw error;
  }
}

/**
 * Récupère les équipes d'une compétition
 */
export async function getTeamsByCompetitionId(
  competitionId: string
): Promise<Team[]> {
  try {
    const teams = await findDocuments(
      COLLECTION_NAME,
      { competitionId },
      { sort: { name: 1 } }
    );
    return teams as Team[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des équipes de la compétition:",
      error
    );
    throw error;
  }
}

/**
 * Récupère les équipes d'un propriétaire
 */
export async function getTeamsByOwnerId(ownerId: string): Promise<Team[]> {
  try {
    const teams = await findDocuments(
      COLLECTION_NAME,
      { ownerId },
      { sort: { createdAt: -1 } }
    );
    return teams as Team[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des équipes du propriétaire:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour une équipe
 */
export async function updateTeam(id: string, teamData: any): Promise<Team> {
  try {
    // Récupérer l'équipe existante
    const existingTeam = await getTeamById(id);

    if (!existingTeam) {
      throw new Error("Équipe non trouvée");
    }

    // Fusionner les données existantes avec les nouvelles données
    const updatedTeam = {
      ...existingTeam,
      ...teamData,
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedTeam = validateTeam(updatedTeam);

    // Mettre à jour l'équipe dans la base de données
    const result = await updateDocument(COLLECTION_NAME, id, validatedTeam);

    console.log(`✅ Équipe mise à jour avec succès: ${id}`);
    return result as Team;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'équipe:", error);
    throw error;
  }
}

/**
 * Supprime une équipe
 */
export async function deleteTeam(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Équipe supprimée avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'équipe:", error);
    throw error;
  }
}

/**
 * Compte le nombre d'équipes avec filtres optionnels
 */
export async function countTeams(filters: any = {}): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, filters);
  } catch (error) {
    console.error("❌ Erreur lors du comptage des équipes:", error);
    throw error;
  }
}
