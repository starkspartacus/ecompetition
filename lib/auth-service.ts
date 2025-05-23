import { ObjectId } from "mongodb";
import { hash } from "bcryptjs";
import { UserRole, AuthMethod, validateUser } from "./prisma-schema";
import { connectToDatabase } from "./mongodb-client";

/**
 * Vérifie si un email existe déjà
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const user = await collection.findOne({ email });
    return !!user;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw error;
  }
}

/**
 * Vérifie si un numéro de téléphone existe déjà
 */
export async function checkPhoneNumberExists(
  phoneNumber: string
): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const user = await collection.findOne({ phoneNumber });
    return !!user;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du numéro de téléphone:",
      error
    );
    throw error;
  }
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(userData: any) {
  try {
    console.log(
      "Création d'un utilisateur avec les données:",
      JSON.stringify(userData, null, 2)
    );

    // Normaliser les champs country/countryCode
    if (userData.country && !userData.countryCode) {
      userData.countryCode = userData.country;
    } else if (!userData.countryCode && !userData.country) {
      userData.countryCode = "FR"; // Valeur par défaut
    }

    // Valider les données utilisateur
    const validatedUser = validateUser({
      ...userData,
      role: userData.role || UserRole.PARTICIPANT,
      preferredAuthMethod: userData.preferredAuthMethod || AuthMethod.EMAIL,
      isVerified: false,
    });

    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const result = await collection.insertOne({
      ...validatedUser,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      ...validatedUser,
      id: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const user = await collection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return null;
    }

    return {
      ...user,
      id: user._id.toString(),
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Récupère un utilisateur par son email
 */
export async function getUserByEmail(email: string) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const user = await collection.findOne({ email });

    if (!user) {
      return null;
    }

    return {
      ...user,
      id: user._id.toString(),
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par email:",
      error
    );
    throw error;
  }
}

/**
 * Récupère un utilisateur par son numéro de téléphone
 */
export async function getUserByPhoneNumber(phoneNumber: string) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const user = await collection.findOne({ phoneNumber });

    if (!user) {
      return null;
    }

    return {
      ...user,
      id: user._id.toString(),
    };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par téléphone:",
      error
    );
    throw error;
  }
}

/**
 * Met à jour un utilisateur
 */
export async function updateUser(userId: string, userData: any) {
  try {
    // Normaliser les champs country/countryCode
    if (userData.country && !userData.countryCode) {
      userData.countryCode = userData.country;
      delete userData.country; // Supprimer le champ country pour éviter la duplication
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const updateData = {
      ...userData,
      updatedAt: new Date(),
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error("Utilisateur non trouvé");
    }

    return {
      ...updateData,
      id: userId,
    };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Supprime un utilisateur
 */
export async function deleteUser(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const result = await collection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      throw new Error("Utilisateur non trouvé");
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Change le mot de passe d'un utilisateur
 */
export async function changePassword(userId: string, newPassword: string) {
  try {
    const hashedPassword = await hash(newPassword, 10);

    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      throw new Error("Utilisateur non trouvé");
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    throw error;
  }
}

/**
 * Script pour normaliser les données utilisateur existantes
 */
export async function normalizeUserData() {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("User");

    // Trouver tous les utilisateurs qui ont un champ country mais pas countryCode
    const users = await collection
      .find({
        country: { $exists: true },
        countryCode: { $exists: false },
      })
      .toArray();

    console.log(`Normalisation des données pour ${users.length} utilisateurs`);

    for (const user of users) {
      await collection.updateOne(
        { _id: user._id },
        {
          $set: { countryCode: user.country },
          $unset: { country: "" }, // Supprimer le champ country
        }
      );
    }

    return { count: users.length };
  } catch (error) {
    console.error(
      "Erreur lors de la normalisation des données utilisateur:",
      error
    );
    throw error;
  }
}
