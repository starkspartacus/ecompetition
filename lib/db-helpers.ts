import {
  getDb,
  toMongoDocument,
  fromMongoDocument,
  toObjectId,
} from "./mongodb";

/**
 * Fonction utilitaire pour créer un utilisateur sans utiliser de transaction
 */
export async function createUserWithoutTransaction(userData: any) {
  try {
    // Utiliser directement MongoDB
    const db = await getDb();
    const usersCollection = db.collection("User");

    // Préparer les données pour MongoDB
    const mongoData = toMongoDocument(userData);

    // Insérer l'utilisateur
    const result = await usersCollection.insertOne(mongoData);

    if (result.acknowledged) {
      // Récupérer l'utilisateur créé
      const user = await usersCollection.findOne({ _id: result.insertedId });
      return fromMongoDocument(user);
    }

    throw new Error("Échec de la création de l'utilisateur");
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour créer une compétition sans utiliser de transaction
 */
export async function createCompetitionWithoutTransaction(
  competitionData: any
) {
  try {
    // Utiliser directement MongoDB
    const db = await getDb();
    const competitionsCollection = db.collection("Competition");

    // Préparer les données pour MongoDB
    const mongoData = toMongoDocument(competitionData);

    // Convertir organizerId en ObjectId
    if (mongoData.organizerId) {
      mongoData.organizerId = toObjectId(mongoData.organizerId);
    }

    // Insérer la compétition
    const result = await competitionsCollection.insertOne(mongoData);

    if (result.acknowledged) {
      // Récupérer la compétition créée
      const competition = await competitionsCollection.findOne({
        _id: result.insertedId,
      });
      return fromMongoDocument(competition);
    }

    throw new Error("Échec de la création de la compétition");
  } catch (error) {
    console.error("Erreur lors de la création de la compétition:", error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour créer une participation sans utiliser de transaction
 */
export async function createParticipationWithoutTransaction(
  participationData: any
) {
  try {
    // Utiliser directement MongoDB
    const db = await getDb();
    const participationsCollection = db.collection("Participation");

    // Préparer les données pour MongoDB
    const mongoData = toMongoDocument(participationData);

    // Convertir les IDs en ObjectId
    if (mongoData.competitionId) {
      mongoData.competitionId = toObjectId(mongoData.competitionId);
    }
    if (mongoData.participantId) {
      mongoData.participantId = toObjectId(mongoData.participantId);
    }

    // Insérer la participation
    const result = await participationsCollection.insertOne(mongoData);

    if (result.acknowledged) {
      // Récupérer la participation créée
      const participation = await participationsCollection.findOne({
        _id: result.insertedId,
      });
      return fromMongoDocument(participation);
    }

    throw new Error("Échec de la création de la participation");
  } catch (error) {
    console.error("Erreur lors de la création de la participation:", error);
    throw error;
  }
}

/**
 * Fonction utilitaire pour créer une équipe sans utiliser de transaction
 */
export async function createTeamWithoutTransaction(teamData: any) {
  try {
    // Utiliser directement MongoDB
    const db = await getDb();
    const teamsCollection = db.collection("Team");

    // Préparer les données pour MongoDB
    const mongoData = toMongoDocument(teamData);

    // Convertir les IDs en ObjectId
    if (mongoData.competitionId) {
      mongoData.competitionId = toObjectId(mongoData.competitionId);
    }
    if (mongoData.ownerId) {
      mongoData.ownerId = toObjectId(mongoData.ownerId);
    }
    if (mongoData.groupId) {
      mongoData.groupId = toObjectId(mongoData.groupId);
    }

    // Insérer l'équipe
    const result = await teamsCollection.insertOne(mongoData);

    if (result.acknowledged) {
      // Récupérer l'équipe créée
      const team = await teamsCollection.findOne({ _id: result.insertedId });
      return fromMongoDocument(team);
    }

    throw new Error("Échec de la création de l'équipe");
  } catch (error) {
    console.error("Erreur lors de la création de l'équipe:", error);
    throw error;
  }
}
