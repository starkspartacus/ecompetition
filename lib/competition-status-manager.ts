/**
 * Service de gestion automatique des statuts de compétition
 */
import { CompetitionStatus, type Competition } from "./prisma-schema";
import {
  getCompetitionsForStatusUpdate,
  updateCompetitionStatus,
} from "./competition-service";
import { broadcastStatusUpdate } from "./websocket-service";

export interface StatusUpdateResult {
  competitionId: string;
  oldStatus: CompetitionStatus;
  newStatus: CompetitionStatus;
  reason: string;
}

/**
 * Détermine le nouveau statut d'une compétition basé sur les dates
 */
export function determineCompetitionStatus(
  competition: Competition
): CompetitionStatus {
  const now = new Date();
  const registrationStart = new Date(competition.registrationStartDate);
  const registrationEnd = new Date(competition.registrationDeadline); // Correction: registrationDeadline au lieu de registrationEndDate
  const competitionStart = competition.startDate
    ? new Date(competition.startDate)
    : null;
  const competitionEnd = competition.endDate
    ? new Date(competition.endDate)
    : null;

  // Si la compétition est en brouillon et que les inscriptions n'ont pas commencé
  if (competition.status === CompetitionStatus.DRAFT) {
    return CompetitionStatus.DRAFT; // Reste en brouillon jusqu'à publication manuelle
  }

  // Si la compétition est publiée (OPEN)
  if (competition.status === CompetitionStatus.OPEN) {
    // Si les inscriptions n'ont pas encore commencé
    if (now < registrationStart) {
      return CompetitionStatus.OPEN;
    }
    // Si les inscriptions sont ouvertes
    if (now >= registrationStart && now <= registrationEnd) {
      return CompetitionStatus.OPEN; // Reste OPEN pendant la période d'inscription
    }
    // Si les inscriptions sont fermées mais la compétition n'a pas commencé
    if (now > registrationEnd && competitionStart && now < competitionStart) {
      return CompetitionStatus.CLOSED;
    }
  }

  // Si les inscriptions sont ouvertes (déjà OPEN)
  if (competition.status === CompetitionStatus.OPEN) {
    // Si les inscriptions sont terminées
    if (now > registrationEnd) {
      if (competitionStart && now < competitionStart) {
        return CompetitionStatus.CLOSED;
      }
      if (competitionStart && now >= competitionStart) {
        return CompetitionStatus.IN_PROGRESS;
      }
    }
  }

  // Si les inscriptions sont fermées
  if (competition.status === CompetitionStatus.CLOSED) {
    // Si la compétition a commencé
    if (competitionStart && now >= competitionStart) {
      return CompetitionStatus.IN_PROGRESS;
    }
  }

  // Si la compétition est en cours
  if (competition.status === CompetitionStatus.IN_PROGRESS) {
    // Si la compétition est terminée
    if (competitionEnd && now > competitionEnd) {
      return CompetitionStatus.COMPLETED;
    }
  }

  // Retourner le statut actuel si aucun changement n'est nécessaire
  return competition.status;
}

/**
 * Met à jour automatiquement les statuts de toutes les compétitions
 */
export async function updateAllCompetitionStatuses(): Promise<
  StatusUpdateResult[]
> {
  try {
    console.log("🔄 Début de la mise à jour automatique des statuts...");

    const competitions = await getCompetitionsForStatusUpdate();
    const updates: StatusUpdateResult[] = [];

    for (const competition of competitions) {
      const oldStatus = competition.status;
      const newStatus = determineCompetitionStatus(competition);

      if (oldStatus !== newStatus) {
        try {
          await updateCompetitionStatus(competition.id, newStatus);

          const updateResult: StatusUpdateResult = {
            competitionId: competition.id,
            oldStatus,
            newStatus,
            reason: getStatusChangeReason(oldStatus, newStatus),
          };

          updates.push(updateResult);

          // Diffuser la mise à jour via WebSocket
          await broadcastStatusUpdate(updateResult);

          console.log(
            `✅ Statut mis à jour pour ${competition.title}: ${oldStatus} → ${newStatus}`
          );
        } catch (error) {
          console.error(
            `❌ Erreur lors de la mise à jour du statut pour ${competition.id}:`,
            error
          );
        }
      }
    }

    console.log(
      `✅ Mise à jour terminée. ${updates.length} compétitions mises à jour.`
    );
    return updates;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour automatique des statuts:",
      error
    );
    throw error;
  }
}

/**
 * Retourne la raison du changement de statut
 */
function getStatusChangeReason(
  oldStatus: CompetitionStatus,
  newStatus: CompetitionStatus
): string {
  const transitions: Record<string, string> = {
    [`${CompetitionStatus.DRAFT}-${CompetitionStatus.OPEN}`]:
      "Publication de la compétition",
    [`${CompetitionStatus.OPEN}-${CompetitionStatus.CLOSED}`]:
      "Fermeture des inscriptions",
    [`${CompetitionStatus.CLOSED}-${CompetitionStatus.IN_PROGRESS}`]:
      "Début de la compétition",
    [`${CompetitionStatus.IN_PROGRESS}-${CompetitionStatus.COMPLETED}`]:
      "Fin de la compétition",
  };

  return transitions[`${oldStatus}-${newStatus}`] || "Mise à jour automatique";
}

/**
 * Planifie la prochaine vérification des statuts
 */
export function scheduleNextStatusCheck(): void {
  // Vérifier toutes les 5 minutes
  setTimeout(async () => {
    try {
      await updateAllCompetitionStatuses();
    } catch (error) {
      console.error("❌ Erreur lors de la vérification planifiée:", error);
    } finally {
      scheduleNextStatusCheck(); // Programmer la prochaine vérification
    }
  }, 5 * 60 * 1000); // 5 minutes
}
