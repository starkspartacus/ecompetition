const { MongoClient } = require("mongodb");
require("dotenv").config();

async function cleanupDatabase() {
  const url = process.env.MONGODB_URL;
  if (!url) {
    console.error("❌ MONGODB_URL non définie");
    process.exit(1);
  }

  const client = new MongoClient(url);

  try {
    console.log("🔗 Connexion à MongoDB...");
    await client.connect();

    const db = client.db();
    console.log("✅ Connecté à la base de données:", db.databaseName);

    console.log("🧹 Début du nettoyage...");

    // Nettoyer les notifications expirées
    const expiredNotifications = await db
      .collection("Notification")
      .deleteMany({
        expiresAt: { $lt: new Date() },
      });
    console.log(
      `✅ ${expiredNotifications.deletedCount} notifications expirées supprimées`
    );

    // Nettoyer les sessions expirées
    const expiredSessions = await db.collection("Session").deleteMany({
      expires: { $lt: new Date() },
    });
    console.log(
      `✅ ${expiredSessions.deletedCount} sessions expirées supprimées`
    );

    // Nettoyer les tokens de vérification expirés
    const expiredTokens = await db.collection("VerificationToken").deleteMany({
      expires: { $lt: new Date() },
    });
    console.log(`✅ ${expiredTokens.deletedCount} tokens expirés supprimés`);

    // Nettoyer les compétitions terminées depuis plus de 6 mois
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const oldCompetitions = await db
      .collection("Competition")
      .find({
        status: "COMPLETED",
        endDate: { $lt: sixMonthsAgo },
      })
      .toArray();

    for (const competition of oldCompetitions) {
      // Supprimer les données liées
      await db
        .collection("Participation")
        .deleteMany({ competitionId: competition._id });
      await db
        .collection("Team")
        .deleteMany({ competitionId: competition._id });
      await db
        .collection("Match")
        .deleteMany({ competitionId: competition._id });
      await db
        .collection("Group")
        .deleteMany({ competitionId: competition._id });

      // Supprimer la compétition
      await db.collection("Competition").deleteOne({ _id: competition._id });
    }
    console.log(
      `✅ ${oldCompetitions.length} anciennes compétitions nettoyées`
    );

    // Nettoyer les joueurs des équipes supprimées
    const orphanPlayers = await db
      .collection("Player")
      .aggregate([
        {
          $lookup: {
            from: "Team",
            localField: "teamId",
            foreignField: "_id",
            as: "team",
          },
        },
        {
          $match: {
            team: { $size: 0 },
          },
        },
      ])
      .toArray();

    if (orphanPlayers.length > 0) {
      const orphanPlayerIds = orphanPlayers.map((p) => p._id);
      await db
        .collection("Player")
        .deleteMany({ _id: { $in: orphanPlayerIds } });
      console.log(`✅ ${orphanPlayers.length} joueurs orphelins supprimés`);
    }

    console.log("🎉 Nettoyage terminé avec succès!");

    // Afficher les statistiques après nettoyage
    const stats = {};
    const collections = [
      "User",
      "Competition",
      "Participation",
      "Team",
      "Player",
      "Match",
      "Group",
      "Notification",
      "Session",
      "VerificationToken",
    ];

    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      stats[collectionName] = { documents: count };
    }

    console.log("\n📊 Statistiques après nettoyage:");
    console.table(stats);
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connexion fermée");
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  cleanupDatabase();
}

module.exports = { cleanupDatabase };
