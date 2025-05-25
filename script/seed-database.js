const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config();

async function seedDatabase() {
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

    console.log("🌱 Début du seeding...");

    // Vérifier si des données existent déjà
    const userCount = await db.collection("User").countDocuments();
    if (userCount > 0) {
      console.log(
        "ℹ️  Des utilisateurs existent déjà. Voulez-vous continuer ? (y/N)"
      );
      // Pour l'automatisation, on continue
      console.log("✅ Continuation du seeding...");
    }

    // Créer des utilisateurs de test
    const hashedPassword = await bcrypt.hash("test123", 12);
    const adminPassword = await bcrypt.hash("admin123", 12);

    const users = [
      {
        _id: new ObjectId(),
        email: "admin@ecompetition.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "System",
        role: "ADMIN",
        country: "France",
        city: "Paris",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: "organizer@test.com",
        password: hashedPassword,
        firstName: "Jean",
        lastName: "Organisateur",
        role: "ORGANIZER",
        country: "France",
        city: "Lyon",
        phoneNumber: "+33123456789",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: "participant1@test.com",
        password: hashedPassword,
        firstName: "Marie",
        lastName: "Participant",
        role: "PARTICIPANT",
        country: "France",
        city: "Marseille",
        phoneNumber: "+33123456790",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: "participant2@test.com",
        password: hashedPassword,
        firstName: "Pierre",
        lastName: "Joueur",
        role: "PARTICIPANT",
        country: "France",
        city: "Toulouse",
        phoneNumber: "+33123456791",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        email: "participant3@test.com",
        password: hashedPassword,
        firstName: "Sophie",
        lastName: "Sportive",
        role: "PARTICIPANT",
        country: "France",
        city: "Nice",
        phoneNumber: "+33123456792",
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // Insérer les utilisateurs
    for (const user of users) {
      try {
        await db.collection("User").insertOne(user);
        console.log(`✅ Utilisateur créé: ${user.email}`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`ℹ️  Utilisateur existe déjà: ${user.email}`);
        } else {
          console.error(
            `❌ Erreur création utilisateur ${user.email}:`,
            error.message
          );
        }
      }
    }

    // Récupérer les IDs des utilisateurs créés
    const organizer = await db
      .collection("User")
      .findOne({ email: "organizer@test.com" });
    const participants = await db
      .collection("User")
      .find({ role: "PARTICIPANT" })
      .toArray();

    if (organizer && participants.length > 0) {
      // Créer une compétition de test
      const competition = {
        _id: new ObjectId(),
        name: "Tournoi de Football Amateur 2024",
        description:
          "Un tournoi de football passionnant pour les équipes amateurs de la région.",
        category: "FOOTBALL",
        type: "TOURNAMENT",
        organizerId: organizer._id,
        country: "France",
        city: "Lyon",
        venue: "Stade Municipal de Lyon",
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
        endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // Dans 32 jours
        registrationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // Dans 20 jours
        maxParticipants: 16,
        minParticipants: 8,
        entryFee: 50,
        prizePool: 1000,
        rules: {
          teamSize: 11,
          substitutes: 5,
          matchDuration: 90,
          extraTime: true,
          penalties: true,
        },
        status: "UPCOMING",
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        await db.collection("Competition").insertOne(competition);
        console.log(`✅ Compétition créée: ${competition.name}`);

        // Créer des participations de test
        for (let i = 0; i < Math.min(3, participants.length); i++) {
          const participation = {
            _id: new ObjectId(),
            competitionId: competition._id,
            participantId: participants[i]._id,
            status: i === 0 ? "APPROVED" : "PENDING",
            applicationDate: new Date(),
            approvalDate: i === 0 ? new Date() : null,
            teamName: `Équipe ${participants[i].firstName}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await db.collection("Participation").insertOne(participation);
            console.log(
              `✅ Participation créée pour: ${participants[i].firstName}`
            );
          } catch (error) {
            console.error(`❌ Erreur création participation:`, error.message);
          }
        }

        // Créer une équipe de test pour la participation approuvée
        const approvedParticipation = await db
          .collection("Participation")
          .findOne({ competitionId: competition._id, status: "APPROVED" });

        if (approvedParticipation) {
          const team = {
            _id: new ObjectId(),
            name: "Les Champions",
            competitionId: competition._id,
            captainId: approvedParticipation.participantId,
            description: "Une équipe de champions prête à tout donner !",
            logo: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          try {
            await db.collection("Team").insertOne(team);
            console.log(`✅ Équipe créée: ${team.name}`);

            // Créer des joueurs de test
            const players = [
              {
                _id: new ObjectId(),
                teamId: team._id,
                firstName: "Capitaine",
                lastName: "Leader",
                position: "MIDFIELDER",
                jerseyNumber: 10,
                isCaptain: true,
                isActive: true,
                nationality: "France",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                _id: new ObjectId(),
                teamId: team._id,
                firstName: "Gardien",
                lastName: "Solide",
                position: "GOALKEEPER",
                jerseyNumber: 1,
                isCaptain: false,
                isActive: true,
                nationality: "France",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                _id: new ObjectId(),
                teamId: team._id,
                firstName: "Attaquant",
                lastName: "Rapide",
                position: "FORWARD",
                jerseyNumber: 9,
                isCaptain: false,
                isActive: true,
                nationality: "France",
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];

            for (const player of players) {
              try {
                await db.collection("Player").insertOne(player);
                console.log(
                  `✅ Joueur créé: ${player.firstName} ${player.lastName}`
                );
              } catch (error) {
                console.error(`❌ Erreur création joueur:`, error.message);
              }
            }
          } catch (error) {
            console.error(`❌ Erreur création équipe:`, error.message);
          }
        }
      } catch (error) {
        console.error(`❌ Erreur création compétition:`, error.message);
      }
    }

    // Créer des notifications de test
    if (organizer && participants.length > 0) {
      const notifications = [
        {
          _id: new ObjectId(),
          userId: organizer._id,
          type: "PARTICIPATION_REQUEST",
          category: "COMPETITION",
          title: "Nouvelle demande de participation",
          message:
            "Une nouvelle demande de participation a été soumise pour votre tournoi.",
          isRead: false,
          relatedType: "COMPETITION",
          relatedId: null,
          createdAt: new Date(),
        },
        {
          _id: new ObjectId(),
          userId: participants[0]._id,
          type: "PARTICIPATION_APPROVED",
          category: "COMPETITION",
          title: "Participation approuvée",
          message: "Votre participation au tournoi a été approuvée !",
          isRead: false,
          relatedType: "COMPETITION",
          relatedId: null,
          createdAt: new Date(),
        },
      ];

      for (const notification of notifications) {
        try {
          await db.collection("Notification").insertOne(notification);
          console.log(`✅ Notification créée`);
        } catch (error) {
          console.error(`❌ Erreur création notification:`, error.message);
        }
      }
    }

    console.log("🎉 Seeding terminé avec succès!");

    // Afficher les statistiques finales
    const finalStats = {};
    const collections = [
      "User",
      "Competition",
      "Participation",
      "Team",
      "Player",
      "Notification",
    ];

    for (const collectionName of collections) {
      const count = await db.collection(collectionName).countDocuments();
      finalStats[collectionName] = { documents: count };
    }

    console.log("\n📊 Statistiques après seeding:");
    console.table(finalStats);

    console.log("\n🔑 Comptes de test créés:");
    console.log("Admin: admin@ecompetition.com / admin123");
    console.log("Organisateur: organizer@test.com / test123");
    console.log(
      "Participants: participant1@test.com à participant3@test.com / test123"
    );
  } catch (error) {
    console.error("❌ Erreur lors du seeding:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Connexion fermée");
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
