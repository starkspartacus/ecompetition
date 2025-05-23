/**
 * Service de match qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import { validateMatch, TournamentPhase, type Match } from "./prisma-schema";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les matchs
const COLLECTION_NAME = "Match";

/**
 * Crée un nouveau match
 */
export async function createMatch(matchData: any): Promise<Match> {
  try {
    // Préparer les données du match
    const match = {
      ...matchData,
      played: matchData.played !== undefined ? matchData.played : false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedMatch = validateMatch(match);

    // Créer le match dans la base de données
    const createdMatch = await createDocument(COLLECTION_NAME, validatedMatch);

    console.log(`✅ Match créé avec succès: ${createdMatch.id}`);
    return createdMatch as Match;
  } catch (error) {
    console.error("❌ Erreur lors de la création du match:", error);
    throw error;
  }
}

/**
 * Récupère un match par son ID
 */
export async function getMatchById(id: string): Promise<Match | null> {
  try {
    const match = await findDocumentById(COLLECTION_NAME, id);
    return match as Match | null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du match:", error);
    throw error;
  }
}

/**
 * Récupère les matchs d'une compétition
 */
export async function getMatchesByCompetitionId(
  competitionId: string
): Promise<Match[]> {
  try {
    const matches = await findDocuments(
      COLLECTION_NAME,
      { competitionId },
      { sort: { scheduledDate: 1 } }
    );
    return matches as Match[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des matchs de la compétition:",
      error
    );
    throw error;
  }
}

/**
 * Récupère les matchs d'une équipe
 */
export async function getMatchesByTeamId(teamId: string): Promise<Match[]> {
  try {
    const matches = await findDocuments(
      COLLECTION_NAME,
      { $or: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
      { sort: { scheduledDate: 1 } }
    );
    return matches as Match[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des matchs de l'équipe:",
      error
    );
    throw error;
  }
}

/**
 * Récupère les matchs d'un groupe
 */
export async function getMatchesByGroupId(groupId: string): Promise<Match[]> {
  try {
    const matches = await findDocuments(
      COLLECTION_NAME,
      { groupId },
      { sort: { scheduledDate: 1 } }
    );
    return matches as Match[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des matchs du groupe:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour un match
 */
export async function updateMatch(id: string, matchData: any): Promise<Match> {
  try {
    // Récupérer le match existant
    const existingMatch = await getMatchById(id);

    if (!existingMatch) {
      throw new Error("Match non trouvé");
    }

    // Fusionner les données existantes avec les nouvelles données
    const updatedMatch = {
      ...existingMatch,
      ...matchData,
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedMatch = validateMatch(updatedMatch);

    // Mettre à jour le match dans la base de données
    const result = await updateDocument(COLLECTION_NAME, id, validatedMatch);

    console.log(`✅ Match mis à jour avec succès: ${id}`);
    return result as Match;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du match:", error);
    throw error;
  }
}

/**
 * Met à jour le score d'un match
 */
export async function updateMatchScore(
  id: string,
  homeScore: number,
  awayScore: number
): Promise<Match> {
  try {
    // Récupérer le match existant
    const existingMatch = await getMatchById(id);

    if (!existingMatch) {
      throw new Error("Match non trouvé");
    }

    // Préparer les données de mise à jour
    const updateData = {
      homeScore,
      awayScore,
      played: true,
      updatedAt: new Date(),
    };

    // Mettre à jour le match dans la base de données
    const result = await updateDocument(COLLECTION_NAME, id, updateData);

    console.log(`✅ Score du match mis à jour avec succès: ${id}`);
    return result as Match;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du score du match:", error);
    throw error;
  }
}

/**
 * Supprime un match
 */
export async function deleteMatch(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Match supprimé avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du match:", error);
    throw error;
  }
}

/**
 * Compte le nombre de matchs avec filtres optionnels
 */
export async function countMatches(filters: any = {}): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, filters);
  } catch (error) {
    console.error("❌ Erreur lors du comptage des matchs:", error);
    throw error;
  }
}

/**
 * Récupère toutes les phases de tournoi
 */
export function getAllTournamentPhases(): string[] {
  return Object.values(TournamentPhase);
}
