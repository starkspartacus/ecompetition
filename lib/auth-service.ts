import { userModel, type UserDocument } from "@/lib/models/user-model";
import { ObjectId } from "mongodb";

export interface User {
  id?: string;
  _id?: ObjectId;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "PARTICIPANT" | "ORGANIZER" | "ADMIN";
  country?: string;
  city?: string;
  commune?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    console.log("🔍 Recherche utilisateur par email:", email);

    const user = await userModel.findByEmail(email);

    if (!user || !user._id) {
      console.log("❌ Utilisateur non trouvé pour l'email:", email);
      return null;
    }

    console.log("✅ Utilisateur trouvé:", {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber,
      role: user.role || "PARTICIPANT",
      country: user.country,
      city: user.city,
      commune: user.commune,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la recherche par email:", error);
    return null;
  }
}

export async function getUserByPhoneNumber(
  phoneNumber: string
): Promise<User | null> {
  try {
    console.log("🔍 Recherche utilisateur par téléphone:", phoneNumber);

    const user = await userModel.findByPhoneNumber(phoneNumber);

    if (!user || !user._id) {
      console.log("❌ Utilisateur non trouvé pour le téléphone:", phoneNumber);
      return null;
    }

    console.log("✅ Utilisateur trouvé:", {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber,
      role: user.role || "PARTICIPANT",
      country: user.country,
      city: user.city,
      commune: user.commune,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la recherche par téléphone:", error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log("🔍 Recherche utilisateur par ID:", id);

    if (!ObjectId.isValid(id)) {
      console.log("❌ ID invalide:", id);
      return null;
    }

    const user = await userModel.findById(id);

    if (!user || !user._id) {
      console.log("❌ Utilisateur non trouvé pour l'ID:", id);
      return null;
    }

    console.log("✅ Utilisateur trouvé:", {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber,
      role: user.role || "PARTICIPANT",
      country: user.country,
      city: user.city,
      commune: user.commune,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la recherche par ID:", error);
    return null;
  }
}

export async function createUser(
  userData: Omit<User, "id" | "_id" | "createdAt" | "updatedAt">
): Promise<User | null> {
  try {
    console.log("🔨 Création d'un nouvel utilisateur:", userData.email);

    const user = await userModel.createUser({
      email: userData.email,
      password: userData.password || "",
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      role: userData.role || "PARTICIPANT",
      country: userData.country,
      city: userData.city,
      commune: userData.commune,
    });

    if (!user || !user._id) {
      console.error("❌ Échec de la création de l'utilisateur");
      return null;
    }

    console.log("✅ Utilisateur créé avec succès:", user._id.toString());

    return {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      country: user.country,
      city: user.city,
      commune: user.commune,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'utilisateur:", error);
    return null;
  }
}

export async function updateUser(
  id: string,
  userData: Partial<User>
): Promise<User | null> {
  try {
    console.log("🔄 Mise à jour de l'utilisateur:", id);

    if (!ObjectId.isValid(id)) {
      console.log("❌ ID invalide:", id);
      return null;
    }

    // Préparer les données de mise à jour
    const updateData: Partial<UserDocument> = {};

    if (userData.email) updateData.email = userData.email;
    if (userData.firstName) updateData.firstName = userData.firstName;
    if (userData.lastName) updateData.lastName = userData.lastName;
    if (userData.phoneNumber) updateData.phoneNumber = userData.phoneNumber;
    if (userData.role) updateData.role = userData.role;
    if (userData.country) updateData.country = userData.country;
    if (userData.city) updateData.city = userData.city;
    if (userData.commune) updateData.commune = userData.commune;

    const user = await userModel.updateById(id, updateData);

    if (!user || !user._id) {
      console.log("❌ Utilisateur non trouvé pour la mise à jour:", id);
      return null;
    }

    console.log("✅ Utilisateur mis à jour avec succès");

    return {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber,
      role: user.role || "PARTICIPANT",
      country: user.country,
      city: user.city,
      commune: user.commune,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'utilisateur:", error);
    return null;
  }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const user = await userModel.findByEmail(email);
    return !!user;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw new Error("Erreur lors de la vérification de l'email");
  }
}

export async function checkPhoneNumberExists(
  phoneNumber: string
): Promise<boolean> {
  try {
    const cleanedNumber = phoneNumber.replace(/\s+/g, "").trim();

    // Chercher avec le numéro tel quel
    let user = await userModel.findByPhoneNumber(cleanedNumber);

    // Si pas trouvé, essayer avec/sans le préfixe +
    if (!user) {
      const alternativeNumber = cleanedNumber.startsWith("+")
        ? cleanedNumber.substring(1)
        : `+${cleanedNumber}`;
      user = await userModel.findByPhoneNumber(alternativeNumber);
    }

    return !!user;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du numéro de téléphone:",
      error
    );
    throw new Error("Erreur lors de la vérification du numéro de téléphone");
  }
}

// Fonction utilitaire pour vérifier un mot de passe
export async function verifyPassword(
  email: string,
  password: string
): Promise<User | null> {
  try {
    const user = await userModel.verifyPassword(email, password);

    if (!user || !user._id) return null;

    return {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      country: user.country,
      city: user.city,
      commune: user.commune,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du mot de passe:", error);
    return null;
  }
}

export async function normalizeUserData(): Promise<{ count: number }> {
  try {
    console.log("🔄 Début de la normalisation des données utilisateur");

    // Récupérer tous les utilisateurs
    const users = await userModel.findMany();

    if (!users || users.length === 0) {
      console.log("ℹ️ Aucun utilisateur trouvé à normaliser");
      return { count: 0 };
    }

    let normalizedCount = 0;

    for (const user of users) {
      let needsUpdate = false;
      const updateData: Partial<UserDocument> = {};

      // Normaliser le prénom et nom (première lettre en majuscule)
      if (
        user.firstName &&
        user.firstName !==
          user.firstName.charAt(0).toUpperCase() +
            user.firstName.slice(1).toLowerCase()
      ) {
        updateData.firstName =
          user.firstName.charAt(0).toUpperCase() +
          user.firstName.slice(1).toLowerCase();
        needsUpdate = true;
      }

      if (
        user.lastName &&
        user.lastName !==
          user.lastName.charAt(0).toUpperCase() +
            user.lastName.slice(1).toLowerCase()
      ) {
        updateData.lastName =
          user.lastName.charAt(0).toUpperCase() +
          user.lastName.slice(1).toLowerCase();
        needsUpdate = true;
      }

      // Normaliser l'email (en minuscules)
      if (user.email && user.email !== user.email.toLowerCase()) {
        updateData.email = user.email.toLowerCase();
        needsUpdate = true;
      }

      // Normaliser le numéro de téléphone (supprimer les espaces)
      if (user.phoneNumber && user.phoneNumber.includes(" ")) {
        updateData.phoneNumber = user.phoneNumber.replace(/\s+/g, "");
        needsUpdate = true;
      }

      // Vérifier le rôle par défaut
      if (!user.role) {
        updateData.role = "PARTICIPANT";
        needsUpdate = true;
      }

      // Mettre à jour si nécessaire
      if (needsUpdate && user._id) {
        await userModel.updateById(user._id.toString(), updateData);
        normalizedCount++;
        console.log(`✅ Utilisateur normalisé: ${user.email}`);
      }
    }

    console.log(
      `🎉 Normalisation terminée: ${normalizedCount} utilisateurs mis à jour`
    );
    return { count: normalizedCount };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la normalisation des données utilisateur:",
      error
    );
    throw new Error("Erreur lors de la normalisation des données utilisateur");
  }
}
