import prismaNoTransactions from "./prisma-no-transactions-alt";
import { generateUniqueCode } from "./utils";

// Fonction pour créer un utilisateur sans transaction
export async function createUserWithoutTransaction(userData: any) {
  try {
    console.log("Création d'un utilisateur sans transaction...");
    const result = await prismaNoTransactions.user.create({
      data: userData,
    });
    console.log("Utilisateur créé avec succès:", result.id);
    return result;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

// Fonction pour vérifier si un email existe déjà
export async function emailExists(email: string) {
  try {
    const count = await prismaNoTransactions.user.count({
      where: {
        email,
      },
    });
    return count > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw error;
  }
}

// Fonction pour vérifier si un numéro de téléphone existe déjà
export async function phoneNumberExists(phoneNumber: string) {
  try {
    const count = await prismaNoTransactions.user.count({
      where: {
        phoneNumber,
      },
    });
    return count > 0;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du numéro de téléphone:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer un utilisateur par son email
export async function getUserByEmail(email: string) {
  try {
    return await prismaNoTransactions.user.findUnique({
      where: {
        email,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par email:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer un utilisateur par son ID
export async function getUserById(id: string) {
  try {
    return await prismaNoTransactions.user.findUnique({
      where: {
        id,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par ID:",
      error
    );
    throw error;
  }
}

// Fonction pour créer une compétition sans transaction
export async function createCompetitionWithoutTransaction(
  competitionData: any
) {
  try {
    // Générer un code unique pour la compétition
    const uniqueCode = generateUniqueCode();

    console.log("Tentative de création de compétition sans transaction...");
    console.log(
      "Données:",
      JSON.stringify(
        {
          ...competitionData,
          uniqueCode,
        },
        null,
        2
      )
    );

    // Ensure rules is properly formatted as JSON if it's an array
    if (Array.isArray(competitionData.rules)) {
      competitionData.rules = competitionData.rules;
    } else if (typeof competitionData.rules === "string") {
      try {
        // Try to parse if it's a JSON string
        competitionData.rules = JSON.parse(competitionData.rules);
      } catch (e) {
        // If it's not valid JSON, keep it as a string
        console.log("Rules is not valid JSON, keeping as string");
      }
    }

    // Créer la compétition sans transaction
    const result = await prismaNoTransactions.competition.create({
      data: {
        ...competitionData,
        uniqueCode,
      },
    });

    console.log("Compétition créée avec succès:", result.id);
    return result;
  } catch (error) {
    console.error(
      "Erreur détaillée lors de la création de la compétition:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer les compétitions d'un organisateur
export async function getCompetitionsByOrganizerId(organizerId: string) {
  try {
    return await prismaNoTransactions.competition.findMany({
      where: {
        organizerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des compétitions par organisateur:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer une compétition par son ID
export async function getCompetitionById(id: string) {
  try {
    return await prismaNoTransactions.competition.findUnique({
      where: {
        id,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la compétition par ID:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer une compétition par son code unique
export async function getCompetitionByUniqueCode(uniqueCode: string) {
  try {
    return await prismaNoTransactions.competition.findUnique({
      where: {
        uniqueCode,
      },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la compétition par code unique:",
      error
    );
    throw error;
  }
}

// Fonction pour mettre à jour les règles d'une compétition
export async function updateCompetitionRules(
  id: string,
  rules: string[] | string
) {
  try {
    // Ensure rules is properly formatted as JSON if it's an array
    let formattedRules = rules;
    if (typeof rules === "string") {
      try {
        // Try to parse if it's a JSON string
        formattedRules = JSON.parse(rules);
      } catch (e) {
        // If it's not valid JSON, keep it as a string
        console.log("Rules is not valid JSON, keeping as string");
      }
    }

    return await prismaNoTransactions.competition.update({
      where: {
        id,
      },
      data: {
        rules: formattedRules,
      },
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des règles de la compétition:",
      error
    );
    throw error;
  }
}

// Fonction pour mettre à jour le profil d'un utilisateur
export async function updateUserProfile(id: string, userData: any) {
  try {
    return await prismaNoTransactions.user.update({
      where: {
        id,
      },
      data: userData,
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du profil utilisateur:",
      error
    );
    throw error;
  }
}
