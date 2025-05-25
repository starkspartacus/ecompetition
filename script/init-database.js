const { MongoClient } = require("mongodb");
require("dotenv").config();

async function initializeDatabase() {
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

    // Collections à créer
    const collections = [
      "User",
      "Competition",
      "Participation",
      "Team",
      "Player",
      "Match",
      "Group",
      "Notification",
      "Account",
      "Session",
      "VerificationToken",
    ];

    console.log("📦 Création des collections...");
    for (const collectionName of collections) {
      try {
        await db.createCollection(collectionName);
        console.log(`✅ Collection ${collectionName} créée`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`ℹ️  Collection ${collectionName} existe déjà`);
        } else {
          console.error(`❌ Erreur création ${collectionName}:`, error.message);
        }
      }
    }

    console.log("🔍 Création des index...");

    // Index User
    await db
      .collection("User")
      .createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { phoneNumber: 1 }, sparse: true },
        { key: { role: 1 } },
        { key: { country: 1 } },
        { key: { city: 1 } },
        { key: { firstName: 1, lastName: 1 } },
        { key: { createdAt: -1 } },
        { key: { emailVerified: 1 } },
      ]);
    console.log("✅ Index User créés");

    // Index Competition
    await db
      .collection("Competition")
      .createIndexes([
        { key: { organizerId: 1 } },
        { key: { status: 1 } },
        { key: { category: 1 } },
        { key: { type: 1 } },
        { key: { country: 1 } },
        { key: { city: 1 } },
        { key: { startDate: 1 } },
        { key: { endDate: 1 } },
        { key: { registrationDeadline: 1 } },
        { key: { isPublic: 1 } },
        { key: { createdAt: -1 } },
        { key: { name: "text", description: "text" } },
        { key: { status: 1, isPublic: 1, startDate: 1 } },
      ]);
    console.log("✅ Index Competition créés");

    // Index Participation
    await db
      .collection("Participation")
      .createIndexes([
        { key: { competitionId: 1 } },
        { key: { participantId: 1 } },
        { key: { status: 1 } },
        { key: { applicationDate: -1 } },
        { key: { competitionId: 1, participantId: 1 }, unique: true },
        { key: { competitionId: 1, status: 1 } },
        { key: { participantId: 1, status: 1 } },
      ]);
    console.log("✅ Index Participation créés");

    // Index Team
    await db
      .collection("Team")
      .createIndexes([
        { key: { competitionId: 1 } },
        { key: { captainId: 1 } },
        { key: { groupId: 1 } },
        { key: { competitionId: 1, name: 1 }, unique: true },
        { key: { isActive: 1 } },
        { key: { name: 1 } },
        { key: { createdAt: -1 } },
      ]);
    console.log("✅ Index Team créés");

    // Index Player
    await db
      .collection("Player")
      .createIndexes([
        { key: { teamId: 1 } },
        { key: { teamId: 1, jerseyNumber: 1 }, unique: true },
        { key: { firstName: 1, lastName: 1 } },
        { key: { position: 1 } },
        { key: { isActive: 1 } },
        { key: { isCaptain: 1 } },
        { key: { nationality: 1 } },
        { key: { createdAt: -1 } },
      ]);
    console.log("✅ Index Player créés");

    // Index Match
    await db
      .collection("Match")
      .createIndexes([
        { key: { competitionId: 1 } },
        { key: { homeTeamId: 1 } },
        { key: { awayTeamId: 1 } },
        { key: { groupId: 1 } },
        { key: { scheduledDate: 1 } },
        { key: { status: 1 } },
        { key: { round: 1 } },
        { key: { competitionId: 1, round: 1 } },
        { key: { competitionId: 1, status: 1 } },
        { key: { homeTeamId: 1, awayTeamId: 1, competitionId: 1 } },
      ]);
    console.log("✅ Index Match créés");

    // Index Group
    await db
      .collection("Group")
      .createIndexes([
        { key: { competitionId: 1 } },
        { key: { competitionId: 1, name: 1 }, unique: true },
        { key: { name: 1 } },
        { key: { createdAt: -1 } },
      ]);
    console.log("✅ Index Group créés");

    // Index Notification
    await db
      .collection("Notification")
      .createIndexes([
        { key: { userId: 1 } },
        { key: { isRead: 1 } },
        { key: { type: 1 } },
        { key: { category: 1 } },
        { key: { createdAt: -1 } },
        { key: { userId: 1, isRead: 1 } },
        { key: { userId: 1, createdAt: -1 } },
        { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
        { key: { relatedId: 1, relatedType: 1 } },
      ]);
    console.log("✅ Index Notification créés");

    // Index Account (NextAuth)
    await db
      .collection("Account")
      .createIndexes([
        { key: { userId: 1 } },
        { key: { provider: 1, providerAccountId: 1 }, unique: true },
        { key: { provider: 1 } },
        { key: { type: 1 } },
      ]);
    console.log("✅ Index Account créés");

    // Index Session (NextAuth)
    await db
      .collection("Session")
      .createIndexes([
        { key: { sessionToken: 1 }, unique: true },
        { key: { userId: 1 } },
        { key: { expires: 1 } },
      ]);
    console.log("✅ Index Session créés");

    // Index VerificationToken (NextAuth)
    await db
      .collection("VerificationToken")
      .createIndexes([
        { key: { identifier: 1, token: 1 }, unique: true },
        { key: { token: 1 } },
        { key: { expires: 1 } },
      ]);
    console.log("✅ Index VerificationToken créés");

    console.log(
      "🎉 Initialisation de la base de données terminée avec succès!"
    );

    // Afficher les statistiques
    const stats = {};
    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      const indexes = await db.collection(collectionName).indexes();
      stats[collectionName] = { documents: count, indexes: indexes.length };
    }

    console.log("\n📊 Statistiques de la base de données:");
    console.table(stats);
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connexion fermée");
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
