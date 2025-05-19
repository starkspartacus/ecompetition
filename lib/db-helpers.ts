import prisma from "./prisma";
import { ObjectId } from "mongodb";

/**
 * Fonction utilitaire pour créer un utilisateur sans utiliser de transaction
 */
export async function createUserWithoutTransaction(userData: any) {
  // Pour MongoDB, nous devons utiliser $runCommandRaw pour éviter les transactions
  const result = await prisma?.$runCommandRaw({
    insert: "User",
    documents: [
      {
        _id: new ObjectId(),
        ...prepareMongoDocument(userData),
      },
    ],
  });

  // Récupérer l'utilisateur créé
  if (result && result.ok) {
    return await prisma?.user.findFirst({
      where: {
        email: userData.email,
      },
    });
  }

  throw new Error("Échec de la création de l'utilisateur");
}

// Fonction pour préparer le document MongoDB
function prepareMongoDocument(userData: any) {
  // Convertir les dates en objets Date
  const document = { ...userData };

  // Supprimer les champs undefined
  Object.keys(document).forEach((key) => {
    if (document[key] === undefined) {
      delete document[key];
    }
  });

  return document;
}

/**
 * Fonction utilitaire pour créer une compétition sans utiliser de transaction
 */
export async function createCompetitionWithoutTransaction(
  competitionData: any
) {
  return await prisma?.competition.create({
    data: competitionData,
  });
}

/**
 * Fonction utilitaire pour créer une participation sans utiliser de transaction
 */
export async function createParticipationWithoutTransaction(
  participationData: any
) {
  return await prisma?.participation.create({
    data: participationData,
  });
}

/**
 * Fonction utilitaire pour créer une équipe sans utiliser de transaction
 */
export async function createTeamWithoutTransaction(teamData: any) {
  return await prisma?.team.create({
    data: teamData,
  });
}
