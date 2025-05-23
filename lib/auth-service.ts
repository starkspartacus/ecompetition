import { hash } from "bcrypt";
import { connectDB } from "./mongodb-client";
import { ObjectId } from "mongodb";

// Interface pour l'utilisateur MongoDB
interface MongoUser {
  _id: ObjectId;
  email?: string;
  password?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified?: boolean;
  [key: string]: any; // Pour les autres propriétés
}

/**
 * Récupère un utilisateur par son email
 */
export async function getUserByEmail(email: string): Promise<MongoUser | null> {
  try {
    console.log("Recherche d'utilisateur par email:", email);

    // Utiliser le client MongoDB natif au lieu de Prisma
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");
    const user = await collection.findOne({ email });

    console.log("Utilisateur trouvé:", user ? "oui" : "non");
    if (user) {
      console.log("ID de l'utilisateur:", user._id.toString());
      // Convertir l'ObjectId en string pour l'ID
      return {
        ...user,
        id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      } as MongoUser;
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

/**
 * Récupère un utilisateur par son numéro de téléphone
 * Gère les formats avec ou sans le préfixe "+"
 */
export async function getUserByPhoneNumber(
  phoneNumber: string
): Promise<MongoUser | null> {
  try {
    console.log("Recherche d'utilisateur par téléphone:", phoneNumber);

    // Normaliser le numéro de téléphone (avec et sans le "+")
    const normalizedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;
    const alternativePhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber.substring(1)
      : phoneNumber;

    console.log("Numéros de téléphone normalisés:", {
      normalizedPhoneNumber,
      alternativePhoneNumber,
    });

    // Utiliser le client MongoDB natif au lieu de Prisma
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Rechercher avec les deux formats
    let user = await collection.findOne({ phoneNumber: normalizedPhoneNumber });

    if (!user) {
      user = await collection.findOne({ phoneNumber: alternativePhoneNumber });
    }

    console.log("Utilisateur trouvé:", user ? "oui" : "non");
    if (user) {
      console.log("ID de l'utilisateur:", user._id.toString());
      // Convertir l'ObjectId en string pour l'ID
      return {
        ...user,
        id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      } as MongoUser;
    }

    return null;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par téléphone:",
      error
    );
    throw error;
  }
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(userData: any): Promise<MongoUser> {
  try {
    // Hacher le mot de passe
    if (userData.password) {
      userData.password = await hash(userData.password, 10);
    }

    // Utiliser le client MongoDB natif au lieu de Prisma
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Ajouter des champs par défaut
    const user = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
    };

    const result = await collection.insertOne(user);

    // Retourner le document inséré avec son ID
    return {
      ...user,
      _id: result.insertedId,
      id: result.insertedId.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    } as MongoUser;
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(id: string): Promise<MongoUser | null> {
  try {
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error("ID invalide:", id);
      return null;
    }

    const user = await collection.findOne({ _id: objectId });

    if (user) {
      return {
        ...user,
        id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      } as MongoUser;
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

/**
 * Met à jour un utilisateur
 */
export async function updateUser(
  id: string,
  userData: any
): Promise<MongoUser | null> {
  try {
    console.log(
      "Mise à jour de l'utilisateur:",
      id,
      "avec les données:",
      userData
    );

    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error("ID invalide:", id);
      return null;
    }

    // Ne pas mettre à jour le mot de passe ici
    if (userData.password) {
      delete userData.password;
    }

    // Ne pas mettre à jour l'email directement
    if (userData.email) {
      delete userData.email;
    }

    // Mettre à jour la date de modification
    userData.updatedAt = new Date();

    // Nettoyer les données vides
    Object.keys(userData).forEach((key) => {
      if (
        userData[key] === "" ||
        userData[key] === null ||
        userData[key] === undefined
      ) {
        delete userData[key];
      }
    });

    console.log("Données nettoyées pour mise à jour:", userData);

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: userData }
    );

    console.log("Résultat de la mise à jour:", {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });

    if (result.matchedCount === 0) {
      console.error("Aucun utilisateur trouvé avec l'ID:", id);
      return null;
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await getUserById(id);
    console.log("Utilisateur après mise à jour:", updatedUser);

    return updatedUser;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Supprime un utilisateur
 */
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error("ID invalide:", id);
      return false;
    }

    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
}

/**
 * Change le mot de passe d'un utilisateur
 */
export async function changePassword(
  id: string,
  newPassword: string
): Promise<boolean> {
  try {
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error("ID invalide:", id);
      return false;
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await hash(newPassword, 10);

    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    throw error;
  }
}

/**
 * Normalise les données utilisateur
 */
export async function normalizeUserData(): Promise<boolean> {
  try {
    const db = await connectDB();

    if (!db) {
      throw new Error("Impossible de se connecter à la base de données");
    }

    const collection = db.collection("User");

    // Ajouter un rôle par défaut à tous les utilisateurs qui n'en ont pas
    const result = await collection.updateMany(
      { role: { $exists: false } },
      { $set: { role: "PARTICIPANT" } }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error(
      "Erreur lors de la normalisation des données utilisateur:",
      error
    );
    throw error;
  }
}
