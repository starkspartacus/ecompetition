/**
 * Service de groupe qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import { validateGroup, type Group } from "./prisma-schema";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les groupes
const COLLECTION_NAME = "Group";

/**
 * Crée un nouveau groupe
 */
export async function createGroup(groupData: any): Promise<Group> {
  try {
    // Préparer les données du groupe
    const group = {
      ...groupData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedGroup = validateGroup(group);

    // Créer le groupe dans la base de données
    const createdGroup = await createDocument(COLLECTION_NAME, validatedGroup);

    console.log(`✅ Groupe créé avec succès: ${createdGroup.id}`);
    return createdGroup as Group;
  } catch (error) {
    console.error("❌ Erreur lors de la création du groupe:", error);
    throw error;
  }
}

/**
 * Récupère un groupe par son ID
 */
export async function getGroupById(id: string): Promise<Group | null> {
  try {
    const group = await findDocumentById(COLLECTION_NAME, id);
    return group as Group | null;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du groupe:", error);
    throw error;
  }
}

/**
 * Récupère les groupes d'une compétition
 */
export async function getGroupsByCompetitionId(
  competitionId: string
): Promise<Group[]> {
  try {
    const groups = await findDocuments(
      COLLECTION_NAME,
      { competitionId },
      { sort: { name: 1 } }
    );
    return groups as Group[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des groupes de la compétition:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour un groupe
 */
export async function updateGroup(id: string, groupData: any): Promise<Group> {
  try {
    // Récupérer le groupe existant
    const existingGroup = await getGroupById(id);

    if (!existingGroup) {
      throw new Error("Groupe non trouvé");
    }

    // Fusionner les données existantes avec les nouvelles données
    const updatedGroup = {
      ...existingGroup,
      ...groupData,
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedGroup = validateGroup(updatedGroup);

    // Mettre à jour le groupe dans la base de données
    const result = await updateDocument(COLLECTION_NAME, id, validatedGroup);

    console.log(`✅ Groupe mis à jour avec succès: ${id}`);
    return result as Group;
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du groupe:", error);
    throw error;
  }
}

/**
 * Supprime un groupe
 */
export async function deleteGroup(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Groupe supprimé avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du groupe:", error);
    throw error;
  }
}

/**
 * Compte le nombre de groupes avec filtres optionnels
 */
export async function countGroups(filters: any = {}): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, filters);
  } catch (error) {
    console.error("❌ Erreur lors du comptage des groupes:", error);
    throw error;
  }
}
