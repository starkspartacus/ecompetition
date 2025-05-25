import { MongoClient, type Db, type Collection, ObjectId } from "mongodb";
import { generateUniqueCode } from "./utils";

let client: MongoClient;
let db: Db;

// Initialiser la connexion MongoDB
async function connectToDatabase() {
  if (!client) {
    const uri = process.env.MONGODB_URL;
    if (!uri) {
      throw new Error("MONGODB_URL environment variable is not defined");
    }

    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.MONGODB_DB || "competition");
  }
  return { client, db };
}

// Obtenir une collection
async function getCollection(collectionName: string): Promise<Collection> {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Fonction pour créer un utilisateur
export async function createUserWithoutTransaction(userData: any) {
  try {
    console.log("Création d'un utilisateur avec MongoDB natif...");
    const users = await getCollection("users");

    const userToCreate = {
      ...userData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(userToCreate);
    console.log("Utilisateur créé avec succès:", result.insertedId);

    return {
      id: result.insertedId.toString(),
      ...userToCreate,
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

// Fonction pour vérifier si un email existe déjà
export async function emailExists(email: string) {
  try {
    const users = await getCollection("users");
    const count = await users.countDocuments({ email });
    return count > 0;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw error;
  }
}

// Fonction pour vérifier si un numéro de téléphone existe déjà
export async function phoneNumberExists(phoneNumber: string) {
  try {
    const users = await getCollection("users");
    const count = await users.countDocuments({ phoneNumber });
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
    const users = await getCollection("users");
    const user = await users.findOne({ email });

    if (user) {
      return {
        id: user._id.toString(),
        ...user,
      };
    }
    return null;
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
    const users = await getCollection("users");
    const user = await users.findOne({ _id: new ObjectId(id) });

    if (user) {
      return {
        id: user._id.toString(),
        ...user,
      };
    }
    return null;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par ID:",
      error
    );
    throw error;
  }
}

// Fonction pour créer une compétition
export async function createCompetitionWithoutTransaction(
  competitionData: any
) {
  try {
    const uniqueCode = generateUniqueCode();

    console.log("Tentative de création de compétition avec MongoDB natif...");
    console.log(
      "Données:",
      JSON.stringify({ ...competitionData, uniqueCode }, null, 2)
    );

    const competitions = await getCollection("competitions");

    // Ensure rules is properly formatted
    let formattedRules = competitionData.rules;
    if (Array.isArray(competitionData.rules)) {
      formattedRules = competitionData.rules;
    } else if (typeof competitionData.rules === "string") {
      try {
        formattedRules = JSON.parse(competitionData.rules);
      } catch (e) {
        console.log("Rules is not valid JSON, keeping as string");
      }
    }

    const competitionToCreate = {
      ...competitionData,
      _id: new ObjectId(),
      uniqueCode,
      rules: formattedRules,
      organizerId: new ObjectId(competitionData.organizerId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await competitions.insertOne(competitionToCreate);
    console.log("Compétition créée avec succès:", result.insertedId);

    return {
      id: result.insertedId.toString(),
      ...competitionToCreate,
      organizerId: competitionData.organizerId, // Keep as string for compatibility
    };
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
    const competitions = await getCollection("competitions");
    const competitionList = await competitions
      .find({ organizerId: new ObjectId(organizerId) })
      .sort({ createdAt: -1 })
      .toArray();

    return competitionList.map((comp) => ({
      id: comp._id.toString(),
      ...comp,
      organizerId: comp.organizerId.toString(),
    }));
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
    console.log(`🔍 Recherche de la compétition avec ID: ${id}`);

    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      console.log(`❌ ID invalide: ${id}`);
      return null;
    }

    const competitions = await getCollection("competitions");
    const users = await getCollection("users");

    console.log(`📊 Recherche dans la collection competitions...`);
    const competition = await competitions.findOne({ _id: new ObjectId(id) });

    if (!competition) {
      console.log(`❌ Aucune compétition trouvée avec l'ID: ${id}`);

      // Debug: Lister quelques compétitions pour voir ce qui existe
      const allCompetitions = await competitions.find({}).limit(5).toArray();
      console.log(
        `📋 Compétitions existantes (5 premières):`,
        allCompetitions.map((c) => ({
          id: c._id.toString(),
          title: c.title || c.name,
          status: c.status,
        }))
      );

      return null;
    }

    console.log(
      `✅ Compétition trouvée: ${competition.title || competition.name}`
    );

    // Récupérer les informations de l'organisateur
    let organizer = null;
    if (competition.organizerId) {
      console.log(`👤 Recherche de l'organisateur: ${competition.organizerId}`);
      organizer = await users.findOne(
        { _id: competition.organizerId },
        {
          projection: {
            firstName: 1,
            lastName: 1,
            email: 1,
            photoUrl: 1,
          },
        }
      );

      if (organizer) {
        console.log(
          `✅ Organisateur trouvé: ${organizer.firstName} ${organizer.lastName}`
        );
      } else {
        console.log(
          `⚠️ Organisateur non trouvé pour l'ID: ${competition.organizerId}`
        );
      }
    }

    const result = {
      id: competition._id.toString(),
      ...competition,
      organizerId: competition.organizerId?.toString(),
      organizer: organizer
        ? {
            id: organizer._id.toString(),
            firstName: organizer.firstName,
            lastName: organizer.lastName,
            email: organizer.email,
            photoUrl: organizer.photoUrl,
          }
        : null,
    };

    console.log(`📤 Retour de la compétition avec les données:`, {
      id: result.id,

      hasOrganizer: !!result.organizer,
    });

    return result;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération de la compétition par ID:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer une compétition par son code unique
export async function getCompetitionByUniqueCode(uniqueCode: string) {
  try {
    console.log(`🔍 Recherche de la compétition avec code: ${uniqueCode}`);

    const competitions = await getCollection("competitions");
    const users = await getCollection("users");

    const competition = await competitions.findOne({ uniqueCode });

    if (!competition) {
      console.log(`❌ Aucune compétition trouvée avec le code: ${uniqueCode}`);
      return null;
    }

    console.log(
      `✅ Compétition trouvée par code: ${
        competition.title || competition.name
      }`
    );

    // Récupérer les informations de l'organisateur
    const organizer = await users.findOne(
      { _id: competition.organizerId },
      {
        projection: {
          firstName: 1,
          lastName: 1,
          email: 1,
          photoUrl: 1,
        },
      }
    );

    return {
      id: competition._id.toString(),
      ...competition,
      organizerId: competition.organizerId.toString(),
      organizer: organizer
        ? {
            id: organizer._id.toString(),
            firstName: organizer.firstName,
            lastName: organizer.lastName,
            email: organizer.email,
            photoUrl: organizer.photoUrl,
          }
        : null,
    };
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
    let formattedRules = rules;
    if (typeof rules === "string") {
      try {
        formattedRules = JSON.parse(rules);
      } catch (e) {
        console.log("Rules is not valid JSON, keeping as string");
      }
    }

    const competitions = await getCollection("competitions");
    const result = await competitions.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          rules: formattedRules,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("Competition not found");
    }

    // Récupérer la compétition mise à jour
    const updatedCompetition = await competitions.findOne({
      _id: new ObjectId(id),
    });

    return {
      id: updatedCompetition?._id.toString(),
      ...updatedCompetition,
      organizerId: updatedCompetition?.organizerId.toString(),
    };
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
    const users = await getCollection("users");
    const result = await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...userData,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("User not found");
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await users.findOne({ _id: new ObjectId(id) });

    return {
      id: updatedUser?._id.toString(),
      ...updatedUser,
    };
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour du profil utilisateur:",
      error
    );
    throw error;
  }
}

// Fonction pour se connecter à MongoDB (pour compatibilité)
export async function connectDB() {
  return await connectToDatabase();
}

// Fonction pour fermer la connexion
export async function closeConnection() {
  if (client) {
    await client.close();
  }
}

// Fonction de debug pour lister les compétitions
export async function debugListCompetitions() {
  try {
    const competitions = await getCollection("competitions");
    const allCompetitions = await competitions.find({}).toArray();

    console.log(
      `📊 Total des compétitions dans la DB: ${allCompetitions.length}`
    );
    allCompetitions.forEach((comp, index) => {
      console.log(
        `${index + 1}. ID: ${comp._id} | Titre: ${
          comp.title || comp.name
        } | Status: ${comp.status}`
      );
    });

    return allCompetitions;
  } catch (error) {
    console.error("Erreur lors du debug des compétitions:", error);
    throw error;
  }
}
