import { hash } from "bcrypt";
import { connectDB } from "@/lib/mongodb-client";
import { UserRole } from "@/lib/prisma-schema";

// Vérifier si un email existe déjà
export async function checkEmailExists(email: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    const user = await collection.findOne({ email });
    return !!user;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw error;
  }
}

// Vérifier si un numéro de téléphone existe déjà
export async function checkPhoneNumberExists(phoneNumber: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    // Recherche avec et sans le préfixe "+" pour plus de flexibilité
    const normalizedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    const user = await collection.findOne({
      $or: [
        { phoneNumber },
        { phoneNumber: normalizedPhoneNumber },
        { phoneNumber: phoneNumber.replace(/^\+/, "") }, // Sans le "+" s'il existe
      ],
    });

    return !!user;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du numéro de téléphone:",
      error
    );
    throw error;
  }
}

// Créer un nouvel utilisateur
export async function createUser(userData: any) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    // Hacher le mot de passe
    if (userData.password) {
      userData.password = await hash(userData.password, 10);
    }

    // Ajouter un rôle par défaut si non spécifié
    if (!userData.role) {
      userData.role = UserRole.PARTICIPANT;
    }

    // Ajouter la date de création
    userData.createdAt = new Date();
    userData.updatedAt = new Date();

    const result = await collection.insertOne(userData);
    return { id: result.insertedId, ...userData };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

// Récupérer un utilisateur par son ID
export async function getUserById(id: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    const user = await collection.findOne({ _id: id });
    return user;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par ID:",
      error
    );
    throw error;
  }
}

// Récupérer un utilisateur par son email
export async function getUserByEmail(email: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    console.log("Recherche d'utilisateur par email:", email);
    const user = await collection.findOne({ email });
    console.log("Utilisateur trouvé:", user ? "oui" : "non");

    return user;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par email:",
      error
    );
    throw error;
  }
}

// Récupérer un utilisateur par son numéro de téléphone
export async function getUserByPhoneNumber(phoneNumber: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    console.log("Recherche d'utilisateur par téléphone:", phoneNumber);

    // Normaliser le numéro de téléphone pour la recherche
    const normalizedPhoneNumber = phoneNumber.startsWith("+")
      ? phoneNumber
      : `+${phoneNumber}`;

    // Rechercher avec différentes variantes du numéro
    const user = await collection.findOne({
      $or: [
        { phoneNumber },
        { phoneNumber: normalizedPhoneNumber },
        { phoneNumber: phoneNumber.replace(/^\+/, "") }, // Sans le "+" s'il existe
      ],
    });

    console.log(
      "Utilisateur trouvé par téléphone:",
      user ? user.id : "non trouvé"
    );
    console.log("Variantes de numéro recherchées:", [
      phoneNumber,
      normalizedPhoneNumber,
      phoneNumber.replace(/^\+/, ""),
    ]);

    return user;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'utilisateur par téléphone:",
      error
    );
    throw error;
  }
}

// Mettre à jour un utilisateur
export async function updateUser(id: string, userData: any) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    // Ne pas mettre à jour le mot de passe ici
    if (userData.password) {
      delete userData.password;
    }

    // Mettre à jour la date de modification
    userData.updatedAt = new Date();

    await collection.updateOne({ _id: id }, { $set: userData });

    return await getUserById(id);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw error;
  }
}

// Supprimer un utilisateur
export async function deleteUser(id: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    await collection.deleteOne({ _id: id });
    return true;
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    throw error;
  }
}

// Changer le mot de passe d'un utilisateur
export async function changePassword(id: string, newPassword: string) {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    // Hacher le nouveau mot de passe
    const hashedPassword = await hash(newPassword, 10);

    await collection.updateOne(
      { _id: id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    return true;
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    throw error;
  }
}

// Normaliser les données utilisateur
export async function normalizeUserData() {
  try {
    const db = await connectDB();
    const collection = db.collection("User");

    // Ajouter un rôle par défaut à tous les utilisateurs qui n'en ont pas
    await collection.updateMany(
      { role: { $exists: false } },
      { $set: { role: UserRole.PARTICIPANT } }
    );

    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la normalisation des données utilisateur:",
      error
    );
    throw error;
  }
}
