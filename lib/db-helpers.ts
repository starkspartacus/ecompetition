import prisma from "./prisma";

/**
 * Fonction utilitaire pour créer un utilisateur sans utiliser de transaction
 */
export async function createUserWithoutTransaction(userData: any) {
  return await prisma.user.create({
    data: userData,
  });
}

/**
 * Fonction utilitaire pour créer une compétition sans utiliser de transaction
 */
export async function createCompetitionWithoutTransaction(
  competitionData: any
) {
  return await prisma.competition.create({
    data: competitionData,
  });
}

/**
 * Fonction utilitaire pour créer une participation sans utiliser de transaction
 */
export async function createParticipationWithoutTransaction(
  participationData: any
) {
  return await prisma.participation.create({
    data: participationData,
  });
}

/**
 * Fonction utilitaire pour créer une équipe sans utiliser de transaction
 */
export async function createTeamWithoutTransaction(teamData: any) {
  return await prisma.team.create({
    data: teamData,
  });
}
