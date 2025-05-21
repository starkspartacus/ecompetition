/**
 * Adaptateur pour maintenir une interface similaire à Prisma
 * tout en utilisant le client MongoDB natif
 */
const mongoClient = require("./mongodb-client");
const { generateUniqueCode } = require("./utils");

// Fonction pour créer un utilisateur
async function createUser(userData) {
  try {
    console.log("Création d'un utilisateur avec MongoDB natif...");
    const result = await mongoClient.create("users", userData);
    console.log("Utilisateur créé avec succès:", result.id);
    return result;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

// Fonction pour vérifier si un email existe déjà
async function emailExists(email) {
  try {
    const count = await mongoClient.count("users", { email });
    return count > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw error;
  }
}

// Fonction pour vérifier si un numéro de téléphone existe déjà
async function phoneNumberExists(phoneNumber) {
  try {
    const count = await mongoClient.count("users", { phoneNumber });
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
async function getUserByEmail(email) {
  try {
    return await mongoClient.findOne("users", { email });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par email:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer un utilisateur par son ID
async function getUserById(id) {
  try {
    return await mongoClient.findById("users", id);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par ID:",
      error
    );
    throw error;
  }
}

// Fonction pour créer une compétition
async function createCompetition(competitionData) {
  try {
    // Générer un code unique pour la compétition
    const uniqueCode = generateUniqueCode();

    console.log("Tentative de création de compétition avec MongoDB natif...");
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

    // Créer la compétition
    const result = await mongoClient.create("competitions", {
      ...competitionData,
      uniqueCode,
      createdAt: new Date(),
      updatedAt: new Date(),
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
async function getCompetitionsByOrganizerId(organizerId) {
  try {
    return await mongoClient.findMany(
      "competitions",
      { organizerId },
      { orderBy: { field: "createdAt", direction: "desc" } }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des compétitions par organisateur:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer une compétition par son ID
async function getCompetitionById(id) {
  try {
    const competition = await mongoClient.findById("competitions", id);
    if (!competition) return null;

    // Récupérer l'organisateur
    const organizer = await mongoClient.findById(
      "users",
      competition.organizerId
    );
    if (organizer) {
      competition.organizer = {
        id: organizer._id.toString(),
        name: organizer.name,
        email: organizer.email,
        image: organizer.image,
      };
    }

    return competition;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la compétition par ID:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer une compétition par son code unique
async function getCompetitionByUniqueCode(uniqueCode) {
  try {
    const competition = await mongoClient.findOne("competitions", {
      uniqueCode,
    });
    if (!competition) return null;

    // Récupérer l'organisateur
    const organizer = await mongoClient.findById(
      "users",
      competition.organizerId
    );
    if (organizer) {
      competition.organizer = {
        id: organizer._id.toString(),
        name: organizer.name,
        email: organizer.email,
        image: organizer.image,
      };
    }

    return competition;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la compétition par code unique:",
      error
    );
    throw error;
  }
}

// Fonction pour mettre à jour les règles d'une compétition
async function updateCompetitionRules(id, rules) {
  try {
    return await mongoClient.update("competitions", id, {
      rules,
      updatedAt: new Date(),
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
async function updateUserProfile(id, userData) {
  try {
    return await mongoClient.update("users", id, {
      ...userData,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du profil utilisateur:",
      error
    );
    throw error;
  }
}

// Exporter les fonctions
module.exports = {
  createUser,
  emailExists,
  phoneNumberExists,
  getUserByEmail,
  getUserById,
  createCompetition,
  getCompetitionsByOrganizerId,
  getCompetitionById,
  getCompetitionByUniqueCode,
  updateCompetitionRules,
  updateUserProfile,
};
