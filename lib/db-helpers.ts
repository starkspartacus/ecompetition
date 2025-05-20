import prisma from "./prisma";
import { generateUniqueCode } from "./utils";
import {
  type CompetitionCategory,
  CompetitionStatus,
  type OffsideRule,
  type SubstitutionRule,
  type YellowCardRule,
  type MatchDuration,
  type TournamentFormat,
} from "@prisma/client";

// Fonction pour créer un utilisateur sans transaction
export async function createUserWithoutTransaction(userData: any) {
  return await prisma?.user.create({
    data: userData,
  });
}

// Fonction pour vérifier si un email existe déjà
export async function emailExists(email: string) {
  const user = await prisma?.user.findUnique({
    where: {
      email,
    },
  });
  return !!user;
}

// Fonction pour vérifier si un numéro de téléphone existe déjà
export async function phoneNumberExists(phoneNumber: string) {
  const user = await prisma?.user.findUnique({
    where: {
      phoneNumber,
    },
  });
  return !!user;
}

// Fonction pour récupérer un utilisateur par son email
export async function getUserByEmail(email: string) {
  return await prisma?.user.findUnique({
    where: {
      email,
    },
  });
}

// Fonction pour récupérer un utilisateur par son ID
export async function getUserById(id: string) {
  return await prisma?.user.findUnique({
    where: {
      id,
    },
  });
}

// Fonction pour créer une compétition sans transaction
export async function createCompetitionWithoutTransaction(competitionData: {
  title: string;
  description: string;
  address: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  registrationStartDate: Date;
  registrationDeadline: Date;
  maxParticipants: number;
  category: CompetitionCategory;
  status?: CompetitionStatus;
  tournamentFormat?: TournamentFormat;
  offsideRule?: OffsideRule;
  substitutionRule?: SubstitutionRule;
  yellowCardRule?: YellowCardRule;
  matchDuration?: MatchDuration;
  customRules?: any;
  imageUrl?: string;
  organizerId: string;
}) {
  // Générer un code unique pour la compétition
  const uniqueCode = generateUniqueCode();

  return await prisma?.competition.create({
    data: {
      ...competitionData,
      uniqueCode,
      status: competitionData.status || CompetitionStatus.OPEN,
    },
  });
}

// Fonction pour récupérer les compétitions d'un organisateur
export async function getCompetitionsByOrganizerId(organizerId: string) {
  return await prisma?.competition.findMany({
    where: {
      organizerId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Fonction pour récupérer une compétition par son ID
export async function getCompetitionById(id: string) {
  return await prisma?.competition.findUnique({
    where: {
      id,
    },
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });
}

// Fonction pour récupérer une compétition par son code unique
export async function getCompetitionByUniqueCode(uniqueCode: string) {
  return await prisma?.competition.findUnique({
    where: {
      uniqueCode,
    },
    include: {
      organizer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
  });
}

// Fonction pour mettre à jour les règles d'une compétition
export async function updateCompetitionRules(id: string, rules: any) {
  return await prisma?.competition.update({
    where: {
      id,
    },
    data: {
      offsideRule: rules.offsideRule,
      substitutionRule: rules.substitutionRule,
      yellowCardRule: rules.yellowCardRule,
      matchDuration: rules.matchDuration,
      customRules: rules.customRules,
    },
  });
}

// Fonction pour mettre à jour le profil d'un utilisateur
export async function updateUserProfile(id: string, userData: any) {
  return await prisma?.user.update({
    where: {
      id,
    },
    data: userData,
  });
}
