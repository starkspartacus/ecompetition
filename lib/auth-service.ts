import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * Vérifie si un email existe déjà dans la base de données
 * @param email Email à vérifier
 * @returns true si l'email existe, false sinon
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    return !!user;
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error);
    throw new Error("Erreur lors de la vérification de l'email");
  }
}

/**
 * Vérifie si un numéro de téléphone existe déjà dans la base de données
 * @param phoneNumber Numéro de téléphone à vérifier
 * @returns true si le numéro existe, false sinon
 */
export async function checkPhoneNumberExists(
  phoneNumber: string
): Promise<boolean> {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    // Nettoyer le numéro de téléphone
    const cleanedNumber = phoneNumber.replace(/\s+/g, "").trim();

    // Rechercher avec et sans le préfixe "+"
    const user = await usersCollection.findOne({
      $or: [
        { phoneNumber: cleanedNumber },
        {
          phoneNumber: cleanedNumber.startsWith("+")
            ? cleanedNumber.substring(1)
            : `+${cleanedNumber}`,
        },
      ],
    });

    return !!user;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification du numéro de téléphone:",
      error
    );
    throw new Error("Erreur lors de la vérification du numéro de téléphone");
  }
}

/**
 * Crée un nouvel utilisateur dans la base de données
 * @param userData Données de l'utilisateur à créer
 * @returns L'utilisateur créé
 */
export async function createUser(userData: any) {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    // Préparer les données utilisateur
    const newUser = {
      ...userData,
      email: userData.email.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insérer l'utilisateur
    const result = await usersCollection.insertOne(newUser);

    // Récupérer l'utilisateur créé avec son ID
    return {
      ...newUser,
      id: result.insertedId.toString(),
      _id: result.insertedId,
    };
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    throw new Error("Erreur lors de la création de l'utilisateur");
  }
}

export async function getUserByEmail(email: string) {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    console.log("Recherche de l'utilisateur par email:", email);

    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (user) {
      // S'assurer que l'ID est une chaîne
      const userId = user._id ? user._id.toString() : user.id;

      console.log("Utilisateur trouvé:", {
        id: userId,
        email: user.email,
        role: user.role,
      });

      return {
        ...user,
        id: userId,
        _id: user._id,
      };
    }

    console.log("Aucun utilisateur trouvé avec l'email:", email);
    return null;
  } catch (error) {
    console.error(
      "Erreur lors de la recherche de l'utilisateur par email:",
      error
    );
    return null;
  }
}

export async function getUserByPhoneNumber(phoneNumber: string) {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    // Nettoyer le numéro de téléphone
    const cleanedNumber = phoneNumber.replace(/\s+/g, "").trim();

    console.log("Recherche de l'utilisateur par téléphone:", cleanedNumber);

    // Rechercher avec et sans le préfixe "+"
    const user = await usersCollection.findOne({
      $or: [
        { phoneNumber: cleanedNumber },
        {
          phoneNumber: cleanedNumber.startsWith("+")
            ? cleanedNumber.substring(1)
            : `+${cleanedNumber}`,
        },
      ],
    });

    if (user) {
      // S'assurer que l'ID est une chaîne
      const userId = user._id ? user._id.toString() : user.id;

      console.log("Utilisateur trouvé:", {
        id: userId,
        phoneNumber: user.phoneNumber,
        role: user.role,
      });

      return {
        ...user,
        id: userId,
        _id: user._id,
      };
    }

    console.log("Aucun utilisateur trouvé avec le numéro:", cleanedNumber);
    return null;
  } catch (error) {
    console.error(
      "Erreur lors de la recherche de l'utilisateur par téléphone:",
      error
    );
    return null;
  }
}

export async function getUserById(id: string) {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    console.log("Recherche de l'utilisateur par ID:", id);

    let user = null;

    // Essayer d'abord avec ObjectId si c'est un ID MongoDB valide
    if (ObjectId.isValid(id)) {
      user = await usersCollection.findOne({ _id: new ObjectId(id) });
    }

    // Si non trouvé, essayer avec l'ID comme chaîne
    if (!user) {
      user = await usersCollection.findOne({ id: id });
    }

    if (user) {
      // S'assurer que l'ID est une chaîne
      const userId = user._id ? user._id.toString() : user.id;

      console.log("Utilisateur trouvé:", {
        id: userId,
        email: user.email,
        role: user.role,
      });

      return {
        ...user,
        id: userId,
        _id: user._id,
      };
    }

    console.log("Aucun utilisateur trouvé avec l'ID:", id);
    return null;
  } catch (error) {
    console.error(
      "Erreur lors de la recherche de l'utilisateur par ID:",
      error
    );
    return null;
  }
}

/**
 * Met à jour un utilisateur dans la base de données
 * @param id ID de l'utilisateur à mettre à jour
 * @param updateData Données à mettre à jour
 * @returns L'utilisateur mis à jour
 */
export async function updateUser(id: string, updateData: any) {
  try {
    const db = await getDb();
    const usersCollection = db.collection("User");

    console.log(
      "Mise à jour de l'utilisateur:",
      id,
      "avec les données:",
      updateData
    );

    // Ajouter la date de mise à jour
    const dataWithTimestamp = {
      ...updateData,
      updatedAt: new Date(),
    };

    let result = null;

    // Essayer d'abord avec ObjectId si c'est un ID MongoDB valide
    if (ObjectId.isValid(id)) {
      result = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: dataWithTimestamp },
        { returnDocument: "after" }
      );
    }

    // Si non trouvé, essayer avec l'ID comme chaîne
    if (!result?.value) {
      result = await usersCollection.findOneAndUpdate(
        { id: id },
        { $set: dataWithTimestamp },
        { returnDocument: "after" }
      );
    }

    if (result?.value) {
      const user = result.value;
      // S'assurer que l'ID est une chaîne
      const userId = user._id ? user._id.toString() : user.id;

      console.log("Utilisateur mis à jour avec succès:", {
        id: userId,
        email: user.email,
      });

      return {
        ...user,
        id: userId,
        _id: user._id,
      };
    }

    console.log("Aucun utilisateur trouvé pour la mise à jour avec l'ID:", id);
    return null;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    throw new Error("Erreur lors de la mise à jour de l'utilisateur");
  }
}
