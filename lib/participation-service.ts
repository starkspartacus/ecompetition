/**
 * Service de participation qui utilise MongoDB natif tout en respectant le schéma Prisma
 */
import {
  validateParticipation,
  ParticipationStatus,
  type Participation,
} from "./prisma-schema";

const {
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
} = require("./mongodb-client");

// Collection pour les participations
const COLLECTION_NAME = "Participation";

/**
 * Crée une nouvelle participation
 */
export async function createParticipation(
  participationData: any
): Promise<Participation> {
  try {
    // Vérifier si l'utilisateur participe déjà à cette compétition
    const existingParticipation = await findParticipation(
      participationData.competitionId,
      participationData.participantId
    );

    if (existingParticipation) {
      throw new Error("Cet utilisateur participe déjà à cette compétition");
    }

    // Préparer les données de la participation
    const participation = {
      ...participationData,
      status: participationData.status || ParticipationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Valider les données selon le schéma Prisma
    const validatedParticipation = validateParticipation(participation);

    // Créer la participation dans la base de données
    const createdParticipation = await createDocument(
      COLLECTION_NAME,
      validatedParticipation
    );

    console.log(
      `✅ Participation créée avec succès: ${createdParticipation.id}`
    );
    return createdParticipation as Participation;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la participation:", error);
    throw error;
  }
}

/**
 * Récupère une participation par son ID
 */
export async function getParticipationById(
  id: string
): Promise<Participation | null> {
  try {
    const participation = await findDocumentById(COLLECTION_NAME, id);
    return participation as Participation | null;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la participation:",
      error
    );
    throw error;
  }
}

/**
 * Trouve une participation par compétition et participant
 */
export async function findParticipation(
  competitionId: string,
  participantId: string
): Promise<Participation | null> {
  try {
    const participations = await findDocuments(COLLECTION_NAME, {
      competitionId,
      participantId,
    });
    return participations.length > 0
      ? (participations[0] as Participation)
      : null;
  } catch (error) {
    console.error("❌ Erreur lors de la recherche de la participation:", error);
    throw error;
  }
}

/**
 * Récupère les participations d'un participant
 */
export async function getParticipationsByParticipantId(
  participantId: string
): Promise<Participation[]> {
  try {
    const participations = await findDocuments(
      COLLECTION_NAME,
      { participantId },
      { sort: { createdAt: -1 } }
    );
    return participations as Participation[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des participations du participant:",
      error
    );
    throw error;
  }
}

/**
 * Récupère les participations d'une compétition
 */
export async function getParticipationsByCompetitionId(
  competitionId: string
): Promise<Participation[]> {
  try {
    const participations = await findDocuments(
      COLLECTION_NAME,
      { competitionId },
      { sort: { createdAt: -1 } }
    );
    return participations as Participation[];
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des participations de la compétition:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour le statut d'une participation
 */
export async function updateParticipationStatus(
  id: string,
  status: ParticipationStatus,
  responseMessage?: string
): Promise<Participation> {
  try {
    // Récupérer la participation existante
    const existingParticipation = await getParticipationById(id);

    if (!existingParticipation) {
      throw new Error("Participation non trouvée");
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (responseMessage) {
      updateData.responseMessage = responseMessage;
    }

    // Mettre à jour la participation dans la base de données
    const result = await updateDocument(COLLECTION_NAME, id, updateData);

    console.log(`✅ Statut de participation mis à jour avec succès: ${id}`);
    return result as Participation;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour du statut de la participation:",
      error
    );
    throw error;
  }
}

/**
 * Supprime une participation
 */
export async function deleteParticipation(id: string): Promise<{ id: string }> {
  try {
    const result = await deleteDocument(COLLECTION_NAME, id);
    console.log(`✅ Participation supprimée avec succès: ${id}`);
    return result;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression de la participation:",
      error
    );
    throw error;
  }
}

/**
 * Compte le nombre de participations avec filtres optionnels
 */
export async function countParticipations(filters: any = {}): Promise<number> {
  try {
    return await countDocuments(COLLECTION_NAME, filters);
  } catch (error) {
    console.error("❌ Erreur lors du comptage des participations:", error);
    throw error;
  }
}

/**
 * Récupère tous les statuts de participation
 */
export function getAllParticipationStatuses(): string[] {
  return Object.values(ParticipationStatus);
}
