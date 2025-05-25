import { db } from "@/lib/database-service";
import type { CompetitionDocument } from "@/lib/models/competition-model";

// Types pour la compatibilité
export enum CompetitionStatus {
  DRAFT = "DRAFT",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface StatusUpdateResult {
  competitionId: string;
  oldStatus: CompetitionStatus;
  newStatus: CompetitionStatus;
  reason: string;
  timestamp: Date;
  competitionName: string;
}

export interface StatusUpdateStats {
  total: number;
  updated: number;
  errors: number;
  duration: number;
}

/**
 * Détermine le nouveau statut d'une compétition basé sur les dates
 */
export function determineCompetitionStatus(
  competition: CompetitionDocument
): CompetitionStatus {
  const now = new Date();
  const registrationStart = new Date(competition.registrationStartDate);
  const registrationEnd = new Date(competition.registrationDeadline);
  const competitionStart = competition.startDateCompetition
    ? new Date(competition.startDateCompetition)
    : null;
  const competitionEnd = competition.endDateCompetition
    ? new Date(competition.endDateCompetition)
    : null;

  console.log(`🔍 Analyse du statut pour "${competition.name}":`, {
    current: competition.status,
    now: now.toISOString(),
    registrationStart: registrationStart.toISOString(),
    registrationEnd: registrationEnd.toISOString(),
    competitionStart: competitionStart?.toISOString(),
    competitionEnd: competitionEnd?.toISOString(),
  });

  // Si la compétition est en brouillon
  if (competition.status === CompetitionStatus.DRAFT) {
    // Reste en brouillon jusqu'à publication manuelle
    return CompetitionStatus.DRAFT;
  }

  // Si la compétition est annulée
  if (competition.status === CompetitionStatus.CANCELLED) {
    return CompetitionStatus.CANCELLED;
  }

  // Si la compétition est terminée
  if (competition.status === CompetitionStatus.COMPLETED) {
    return CompetitionStatus.COMPLETED;
  }

  // Logique de transition automatique

  // 1. Si les inscriptions n'ont pas encore commencé
  if (now < registrationStart) {
    return CompetitionStatus.OPEN; // Publiée mais inscriptions pas encore ouvertes
  }

  // 2. Si nous sommes dans la période d'inscription
  if (now >= registrationStart && now <= registrationEnd) {
    return CompetitionStatus.OPEN; // Inscriptions ouvertes
  }

  // 3. Si les inscriptions sont fermées mais la compétition n'a pas commencé
  if (now > registrationEnd && competitionStart && now < competitionStart) {
    return CompetitionStatus.CLOSED; // Inscriptions fermées, en attente du début
  }

  // 4. Si la compétition a commencé mais pas terminée
  if (competitionStart && now >= competitionStart) {
    if (competitionEnd && now <= competitionEnd) {
      return CompetitionStatus.IN_PROGRESS; // Compétition en cours
    }
    if (competitionEnd && now > competitionEnd) {
      return CompetitionStatus.COMPLETED; // Compétition terminée
    }
    // Si pas de date de fin définie, reste en cours
    return CompetitionStatus.IN_PROGRESS;
  }

  // Par défaut, garder le statut actuel
  return competition.status as CompetitionStatus;
}

/**
 * Récupère les compétitions éligibles pour une mise à jour de statut
 */
async function getCompetitionsForStatusUpdate(): Promise<
  CompetitionDocument[]
> {
  try {
    console.log("📋 Récupération des compétitions éligibles...");

    // Récupérer toutes les compétitions non terminées et non annulées
    const competitions = await db.competitions.findMany({
      status: {
        $nin: [CompetitionStatus.COMPLETED, CompetitionStatus.CANCELLED],
      },
    });

    console.log(
      `📊 ${competitions.length} compétitions trouvées pour vérification`
    );
    return competitions;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des compétitions:", error);
    throw error;
  }
}

/**
 * Met à jour le statut d'une compétition
 */
async function updateCompetitionStatus(
  competitionId: string,
  newStatus: CompetitionStatus
): Promise<void> {
  try {
    await db.competitions.updateById(competitionId, {
      status: newStatus as any,
      updatedAt: new Date(),
    });
    console.log(`✅ Statut mis à jour pour ${competitionId}: ${newStatus}`);
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour du statut pour ${competitionId}:`,
      error
    );
    throw error;
  }
}

/**
 * Envoie une notification de changement de statut
 */
async function sendStatusChangeNotification(
  competition: CompetitionDocument,
  oldStatus: CompetitionStatus,
  newStatus: CompetitionStatus
): Promise<void> {
  try {
    const message = getStatusChangeMessage(
      competition.name,
      oldStatus,
      newStatus
    );

    // Notification à l'organisateur
    await db.notifications.create({
      userId: competition.organizerId,
      type: "INFO" as any,
      category: "COMPETITION" as any,
      title: "Changement de statut de compétition",
      message,
      data: JSON.stringify({
        competitionId: competition._id!.toString(),
        oldStatus,
        newStatus,
        competitionName: competition.name,
      }),
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Notifications aux participants si nécessaire
    if (
      newStatus === CompetitionStatus.IN_PROGRESS ||
      newStatus === CompetitionStatus.COMPLETED
    ) {
      const participations = await db.participations.findByCompetition(
        competition._id!.toString()
      );

      for (const participation of participations) {
        if (participation.status === "APPROVED") {
          await db.notifications.create({
            userId: participation.participantId,
            type: "INFO" as any,
            category: "COMPETITION" as any,
            title: `Compétition ${competition.name}`,
            message,
            data: JSON.stringify({
              competitionId: competition._id!.toString(),
              oldStatus,
              newStatus,
              competitionName: competition.name,
            }),
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    console.log(
      `📧 Notifications envoyées pour le changement ${oldStatus} → ${newStatus}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi des notifications:", error);
    // Ne pas faire échouer la mise à jour pour une erreur de notification
  }
}

/**
 * Diffuse la mise à jour via WebSocket
 */
async function broadcastStatusUpdate(
  updateResult: StatusUpdateResult
): Promise<void> {
  try {
    // Diffusion WebSocket si le service est disponible
    if (typeof fetch !== "undefined") {
      await fetch("/api/socket/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "competition_status_updated",
          data: updateResult,
        }),
      });
    }
    console.log(
      `📡 Mise à jour diffusée via WebSocket pour ${updateResult.competitionId}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la diffusion WebSocket:", error);
    // Ne pas faire échouer la mise à jour pour une erreur de diffusion
  }
}

/**
 * Met à jour automatiquement les statuts de toutes les compétitions
 */
export async function updateAllCompetitionStatuses(): Promise<{
  results: StatusUpdateResult[];
  stats: StatusUpdateStats;
}> {
  const startTime = Date.now();
  const updates: StatusUpdateResult[] = [];
  let errors = 0;

  try {
    console.log("🔄 Début de la mise à jour automatique des statuts...");

    const competitions = await getCompetitionsForStatusUpdate();

    for (const competition of competitions) {
      try {
        const oldStatus = competition.status as CompetitionStatus;
        const newStatus = determineCompetitionStatus(competition);

        if (oldStatus !== newStatus) {
          console.log(
            `🔄 Changement détecté pour "${competition.name}": ${oldStatus} → ${newStatus}`
          );

          // Mettre à jour le statut
          await updateCompetitionStatus(competition._id!.toString(), newStatus);

          const updateResult: StatusUpdateResult = {
            competitionId: competition._id!.toString(),
            oldStatus,
            newStatus,
            reason: getStatusChangeReason(oldStatus, newStatus),
            timestamp: new Date(),
            competitionName: competition.name,
          };

          updates.push(updateResult);

          // Envoyer les notifications
          await sendStatusChangeNotification(competition, oldStatus, newStatus);

          // Diffuser via WebSocket
          await broadcastStatusUpdate(updateResult);

          console.log(
            `✅ Statut mis à jour pour "${competition.name}": ${oldStatus} → ${newStatus}`
          );
        } else {
          console.log(
            `ℹ️ Aucun changement pour "${competition.name}" (${oldStatus})`
          );
        }
      } catch (error) {
        errors++;
        console.error(
          `❌ Erreur lors de la mise à jour du statut pour "${competition.name}":`,
          error
        );
      }
    }

    const duration = Date.now() - startTime;
    const stats: StatusUpdateStats = {
      total: competitions.length,
      updated: updates.length,
      errors,
      duration,
    };

    console.log(`✅ Mise à jour terminée en ${duration}ms:`, {
      total: stats.total,
      updated: stats.updated,
      errors: stats.errors,
    });

    return { results: updates, stats };
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
    [`${CompetitionStatus.OPEN}-${CompetitionStatus.IN_PROGRESS}`]:
      "Début de la compétition (inscriptions ouvertes)",
    [`${CompetitionStatus.OPEN}-${CompetitionStatus.COMPLETED}`]:
      "Fin de la compétition",
  };

  return (
    transitions[`${oldStatus}-${newStatus}`] ||
    "Mise à jour automatique basée sur les dates"
  );
}

/**
 * Génère un message de changement de statut
 */
function getStatusChangeMessage(
  competitionName: string,
  oldStatus: CompetitionStatus,
  newStatus: CompetitionStatus
): string {
  const messages: Record<string, string> = {
    [`${CompetitionStatus.OPEN}-${CompetitionStatus.CLOSED}`]: `Les inscriptions pour "${competitionName}" sont maintenant fermées.`,
    [`${CompetitionStatus.CLOSED}-${CompetitionStatus.IN_PROGRESS}`]: `La compétition "${competitionName}" a commencé !`,
    [`${CompetitionStatus.OPEN}-${CompetitionStatus.IN_PROGRESS}`]: `La compétition "${competitionName}" a commencé !`,
    [`${CompetitionStatus.IN_PROGRESS}-${CompetitionStatus.COMPLETED}`]: `La compétition "${competitionName}" est terminée.`,
    [`${CompetitionStatus.OPEN}-${CompetitionStatus.COMPLETED}`]: `La compétition "${competitionName}" est terminée.`,
  };

  return (
    messages[`${oldStatus}-${newStatus}`] ||
    `Le statut de la compétition "${competitionName}" a été mis à jour.`
  );
}

/**
 * Planifie la prochaine vérification des statuts
 */
export function scheduleNextStatusCheck(intervalMinutes = 5): NodeJS.Timeout {
  console.log(
    `⏰ Planification de la prochaine vérification dans ${intervalMinutes} minutes`
  );

  return setTimeout(async () => {
    try {
      const { stats } = await updateAllCompetitionStatuses();
      console.log(`📊 Vérification automatique terminée:`, stats);
    } catch (error) {
      console.error("❌ Erreur lors de la vérification planifiée:", error);
    } finally {
      // Programmer la prochaine vérification
      scheduleNextStatusCheck(intervalMinutes);
    }
  }, intervalMinutes * 60 * 1000);
}

/**
 * Démarre le service de mise à jour automatique
 */
export function startStatusUpdateService(intervalMinutes = 5): void {
  console.log("🚀 Démarrage du service de mise à jour automatique des statuts");

  // Première vérification immédiate
  updateAllCompetitionStatuses()
    .then(({ stats }) => {
      console.log("✅ Vérification initiale terminée:", stats);
      // Planifier les vérifications suivantes
      scheduleNextStatusCheck(intervalMinutes);
    })
    .catch((error) => {
      console.error("❌ Erreur lors de la vérification initiale:", error);
      // Planifier quand même les vérifications suivantes
      scheduleNextStatusCheck(intervalMinutes);
    });
}

/**
 * Met à jour manuellement le statut d'une compétition spécifique
 */
export async function updateSingleCompetitionStatus(
  competitionId: string
): Promise<StatusUpdateResult | null> {
  try {
    console.log(
      `🔄 Mise à jour manuelle du statut pour la compétition ${competitionId}`
    );

    const competition = await db.competitions.findById(competitionId);
    if (!competition) {
      throw new Error(`Compétition ${competitionId} non trouvée`);
    }

    const oldStatus = competition.status as CompetitionStatus;
    const newStatus = determineCompetitionStatus(competition);

    if (oldStatus !== newStatus) {
      await updateCompetitionStatus(competitionId, newStatus);

      const updateResult: StatusUpdateResult = {
        competitionId,
        oldStatus,
        newStatus,
        reason: getStatusChangeReason(oldStatus, newStatus),
        timestamp: new Date(),
        competitionName: competition.name,
      };

      // Envoyer les notifications
      await sendStatusChangeNotification(competition, oldStatus, newStatus);

      // Diffuser via WebSocket
      await broadcastStatusUpdate(updateResult);

      console.log(
        `✅ Statut mis à jour manuellement pour "${competition.name}": ${oldStatus} → ${newStatus}`
      );
      return updateResult;
    }

    console.log(
      `ℹ️ Aucun changement nécessaire pour "${competition.name}" (${oldStatus})`
    );
    return null;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour manuelle pour ${competitionId}:`,
      error
    );
    throw error;
  }
}

/**
 * Obtient les statistiques des mises à jour de statut
 */
export async function getStatusUpdateStatistics(): Promise<{
  totalCompetitions: number;
  byStatus: Record<CompetitionStatus, number>;
  eligibleForUpdate: number;
}> {
  try {
    const allCompetitions = await db.competitions.findMany({});
    const eligibleCompetitions = await getCompetitionsForStatusUpdate();

    const byStatus: Record<CompetitionStatus, number> = {
      [CompetitionStatus.DRAFT]: 0,
      [CompetitionStatus.OPEN]: 0,
      [CompetitionStatus.CLOSED]: 0,
      [CompetitionStatus.IN_PROGRESS]: 0,
      [CompetitionStatus.COMPLETED]: 0,
      [CompetitionStatus.CANCELLED]: 0,
    };

    allCompetitions.forEach((comp) => {
      const status = comp.status as CompetitionStatus;
      if (status in byStatus) {
        byStatus[status]++;
      }
    });

    return {
      totalCompetitions: allCompetitions.length,
      byStatus,
      eligibleForUpdate: eligibleCompetitions.length,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des statistiques:", error);
    throw error;
  }
}
