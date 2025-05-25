// Export all models
export * from "./base-model";
export * from "./user-model";
export * from "./competition-model";
export * from "./participation-model";
export * from "./team-model";
export * from "./player-model";
export * from "./match-model";
export * from "./group-model";
export * from "./notification-model";
export * from "./auth-models";

// Export model instances
export { userModel } from "./user-model";
export { competitionModel } from "./competition-model";
export { participationModel } from "./participation-model";
export { teamModel } from "./team-model";
export { playerModel } from "./player-model";
export { matchModel } from "./match-model";
export { groupModel } from "./group-model";
export { notificationModel } from "./notification-model";
export {
  accountModel,
  sessionModel,
  verificationTokenModel,
} from "./auth-models";

// Database initialization function
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("🔧 Initialisation de la base de données...");

    // Import models dynamically to avoid circular dependencies
    const { userModel } = await import("./user-model");
    const { competitionModel } = await import("./competition-model");
    const { participationModel } = await import("./participation-model");
    const { teamModel } = await import("./team-model");
    const { playerModel } = await import("./player-model");
    const { matchModel } = await import("./match-model");
    const { groupModel } = await import("./group-model");
    const { notificationModel } = await import("./notification-model");
    const { accountModel, sessionModel, verificationTokenModel } = await import(
      "./auth-models"
    );

    // Créer tous les index en parallèle
    await Promise.all([
      userModel.createIndexes(),
      competitionModel.createIndexes(),
      participationModel.createIndexes(),
      teamModel.createIndexes(),
      playerModel.createIndexes(),
      matchModel.createIndexes(),
      groupModel.createIndexes(),
      notificationModel.createIndexes(),
      accountModel.createIndexes(),
      sessionModel.createIndexes(),
      verificationTokenModel.createIndexes(),
    ]);

    console.log("✅ Base de données initialisée avec succès");
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation de la base de données:",
      error
    );
    throw error;
  }
}

// Cleanup function for expired data
export async function cleanupExpiredData(): Promise<void> {
  try {
    console.log("🧹 Nettoyage des données expirées...");

    const { sessionModel } = await import("./auth-models");
    const { verificationTokenModel } = await import("./auth-models");
    const { notificationModel } = await import("./notification-model");

    const [expiredSessions, expiredTokens, oldNotifications] =
      await Promise.all([
        sessionModel.deleteExpired(),
        verificationTokenModel.deleteExpired(),
        notificationModel.deleteOldNotifications(30), // 30 jours
      ]);

    console.log(`✅ Nettoyage terminé:`);
    console.log(`  - ${expiredSessions} sessions expirées supprimées`);
    console.log(`  - ${expiredTokens} tokens expirés supprimés`);
    console.log(`  - ${oldNotifications} anciennes notifications supprimées`);
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: "healthy" | "unhealthy";
  collections: Record<string, { count: number; indexes: number }>;
  errors: string[];
}> {
  const result = {
    status: "healthy" as "healthy" | "unhealthy",
    collections: {} as Record<string, { count: number; indexes: number }>,
    errors: [] as string[],
  };

  try {
    // Import models dynamically
    const { userModel } = await import("./user-model");
    const { competitionModel } = await import("./competition-model");
    const { participationModel } = await import("./participation-model");
    const { teamModel } = await import("./team-model");
    const { playerModel } = await import("./player-model");
    const { matchModel } = await import("./match-model");
    const { groupModel } = await import("./group-model");
    const { notificationModel } = await import("./notification-model");
    const { accountModel, sessionModel, verificationTokenModel } = await import(
      "./auth-models"
    );

    const models = [
      { name: "User", model: userModel },
      { name: "Competition", model: competitionModel },
      { name: "Participation", model: participationModel },
      { name: "Team", model: teamModel },
      { name: "Player", model: playerModel },
      { name: "Match", model: matchModel },
      { name: "Group", model: groupModel },
      { name: "Notification", model: notificationModel },
      { name: "Account", model: accountModel },
      { name: "Session", model: sessionModel },
      { name: "VerificationToken", model: verificationTokenModel },
    ];

    for (const { name, model } of models) {
      try {
        const collection = await (model as any).getCollection();
        const count = await collection.countDocuments();
        const indexes = await collection.indexes();

        result.collections[name] = {
          count,
          indexes: indexes.length,
        };
      } catch (error) {
        result.status = "unhealthy";
        result.errors.push(`Erreur avec la collection ${name}: ${error}`);
      }
    }
  } catch (error) {
    result.status = "unhealthy";
    result.errors.push(`Erreur générale: ${error}`);
  }

  return result;
}
