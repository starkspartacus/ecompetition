/**
 * Planificateur pour les mises à jour automatiques des compétitions
 */
import {
  scheduleNextStatusCheck,
  updateAllCompetitionStatuses,
} from "./competition-status-manager";

let isSchedulerRunning = false;

/**
 * Démarre le planificateur de mise à jour des statuts
 */
export function startCompetitionScheduler(): void {
  if (isSchedulerRunning) {
    console.log("⚠️ Le planificateur est déjà en cours d'exécution");
    return;
  }

  console.log("🚀 Démarrage du planificateur de compétitions...");
  isSchedulerRunning = true;

  // Exécuter une première vérification immédiatement
  updateAllCompetitionStatuses()
    .then(() => {
      console.log("✅ Première vérification terminée");
      // Programmer les vérifications suivantes
      scheduleNextStatusCheck();
    })
    .catch((error) => {
      console.error("❌ Erreur lors de la première vérification:", error);
      // Programmer quand même les vérifications suivantes
      scheduleNextStatusCheck();
    });
}

/**
 * Arrête le planificateur
 */
export function stopCompetitionScheduler(): void {
  isSchedulerRunning = false;
  console.log("🛑 Planificateur arrêté");
}

/**
 * Vérifie si le planificateur est en cours d'exécution
 */
export function isSchedulerActive(): boolean {
  return isSchedulerRunning;
}
