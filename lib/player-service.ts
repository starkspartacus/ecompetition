/**
 * Service de joueur qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import { validatePlayer, type Player } from "./prisma-schema";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les joueurs
const COLLECTION_NAME = "Player";

/**
 * Crée un nouveau joueur
 */
export async function createPlayer(playerData: any): Promise<Player> {
  try {
    // Préparer les données du joueur
    const player = {
      ...playerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedPlayer = validatePlayer(player);

    // Créer le joueur dans la base de données
    const createdPlayer = await createDocument(
      COLLECTION_NAME,
      validatedPlayer
    );

    console.log(`✅ Joueur créé avec succès: ${createdPlayer.id}`);
    return createdPlayer as Player;
  } catch (error) {
    console.error("❌ Erreur lors de la création du joueur:", error);
    throw error;
  }
}

/**
 * Récupère un joueur par son ID
 */
export async function getPlayerById(id: string): Promise<Player | null> {
  try {
    const player = await findDocumentById(COLLECTION_NAME, id);
    return player as Player | null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du joueur:", error);
    throw error;
  }
}

/**
 * Récupère les joueurs d'une équipe
 */
export async function getPlayersByTeamId(teamId: string): Promise<Player[]> {
  try {
    const players = await findDocuments(
      COLLECTION_NAME,
      { teamId },
      { sort: { name: 1 } }
    );
    return players as Player[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des joueurs de l'équipe:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour un joueur
 */
export async function updatePlayer(
  id: string,
  playerData: any
): Promise<Player> {
  try {
    // Récupérer le joueur existant
    const existingPlayer = await getPlayerById(id);

    if (!existingPlayer) {
      throw new Error("Joueur non trouvé");
    }

    // Fusionner les données existantes avec les nouvelles données
    const updatedPlayer = {
      ...existingPlayer,
      ...playerData,
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedPlayer = validatePlayer(updatedPlayer);

    // Mettre à jour le joueur dans la base de données
    const result = await updateDocument(COLLECTION_NAME, id, validatedPlayer);

    console.log(`✅ Joueur mis à jour avec succès: ${id}`);
    return result as Player;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du joueur:", error);
    throw error;
  }
}

/**
 * Supprime un joueur
 */
export async function deletePlayer(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Joueur supprimé avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du joueur:", error);
    throw error;
  }
}

/**
 * Compte le nombre de joueurs avec filtres optionnels
 */
export async function countPlayers(filters: any = {}): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, filters);
  } catch (error) {
    console.error("❌ Erreur lors du comptage des joueurs:", error);
    throw error;
  }
}
