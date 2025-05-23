import { MongoClient, type Db, ObjectId } from "mongodb";

// Variables globales pour la connexion MongoDB
let client: MongoClient | null = null;
let db: Db | null = null;

// Fonction utilitaire pour convertir en chaîne de manière sécurisée
export function safeToString(id: any): string {
  if (!id) return "";

  // Si c'est un ObjectId, utiliser toString()
  if (id instanceof ObjectId) {
    return id.toString();
  }

  // Si c'est déjà une chaîne, la retourner
  if (typeof id === "string") {
    return id;
  }

  // Si c'est un objet avec une méthode toString(), l'utiliser
  if (
    typeof id === "object" &&
    id !== null &&
    typeof id.toString === "function"
  ) {
    return id.toString();
  }

  // Fallback: convertir en JSON
  try {
    return JSON.stringify(id);
  } catch (e) {
    return String(id);
  }
}

// Fonction pour se connecter à MongoDB
export async function connectDB(): Promise<Db> {
  try {
    console.log("🔄 Tentative de connexion à MongoDB...");

    // Si nous avons déjà une connexion, la réutiliser
    if (client && db) {
      return db;
    }

    // Récupérer l'URI de connexion depuis les variables d'environnement
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI non défini dans les variables d'environnement"
      );
    }

    // Créer un nouveau client MongoDB
    client = new MongoClient(uri);

    // Se connecter au serveur MongoDB
    await client.connect();

    // Récupérer le nom de la base de données depuis les variables d'environnement
    const dbName = process.env.MONGODB_DB || "competition";

    // Sélectionner la base de données
    db = client.db(dbName);

    console.log(`✅ Connecté avec succès à MongoDB`);
    console.log(`✅ Base de données sélectionnée: ${dbName}`);

    // Lister les collections disponibles
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name).join(", ");
    console.log(`✅ Collections disponibles: ${collectionNames}`);

    return db;
  } catch (error) {
    console.error("❌ Erreur lors de la connexion à MongoDB:", error);
    throw error;
  }
}

// Fonction pour insérer un document dans une collection
export async function insertOne(collectionName: string, document: any) {
  try {
    const db = await connectDB();

    // Insérer le document dans la collection
    const result = await db.collection(collectionName).insertOne(document);

    // Récupérer l'ID du document inséré
    const id = result.insertedId;

    // Retourner le document avec son ID
    return {
      id: id.toString(),
      _id: id,
      ...document,
    };
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'insertion dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

// Fonction pour trouver un document dans une collection
export async function findOne(collectionName: string, filter: any) {
  try {
    const db = await connectDB();

    console.log(`🔍 Recherche d'un document dans ${collectionName}`);
    console.log(`🔍 Filtre traité:`, JSON.stringify(filter, null, 2));

    // Convertir les ObjectId si nécessaire
    const processedFilter: any = {};
    for (const key in filter) {
      if (key === "_id" && typeof filter[key] === "string") {
        try {
          processedFilter[key] = new ObjectId(filter[key]);
        } catch (e) {
          processedFilter[key] = filter[key];
        }
      } else {
        processedFilter[key] = filter[key];
      }
    }

    // Trouver le document dans la collection
    const result = await db.collection(collectionName).findOne(processedFilter);

    if (result) {
      console.log(`✅ Document trouvé dans ${collectionName}`);

      // Convertir l'ID en chaîne
      if (result._id) {
        result.id = safeToString(result._id);
      }

      return result;
    }

    console.log(
      `ℹ️ Aucun document trouvé dans ${collectionName} avec le filtre:`,
      filter
    );
    return null;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

// Fonction pour trouver plusieurs documents dans une collection
export async function find(
  collectionName: string,
  filter: any = {},
  options: any = {}
) {
  try {
    const db = await connectDB();

    // Convertir les ObjectId si nécessaire
    const processedFilter: any = {};
    for (const key in filter) {
      if (key === "_id" && typeof filter[key] === "string") {
        try {
          processedFilter[key] = new ObjectId(filter[key]);
        } catch (e) {
          processedFilter[key] = filter[key];
        }
      } else {
        processedFilter[key] = filter[key];
      }
    }

    // Trouver les documents dans la collection
    const cursor = db.collection(collectionName).find(processedFilter);

    // Appliquer les options (tri, limite, etc.)
    if (options.sort) {
      cursor.sort(options.sort);
    }
    if (options.limit) {
      cursor.limit(options.limit);
    }
    if (options.skip) {
      cursor.skip(options.skip);
    }

    // Récupérer les résultats
    const results = await cursor.toArray();

    // Convertir les ID en chaînes
    return results.map((result) => {
      if (result._id) {
        result.id = safeToString(result._id);
      }
      return result;
    });
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

// Fonction pour mettre à jour un document dans une collection
export async function updateOne(
  collectionName: string,
  filter: any,
  update: any
) {
  try {
    const db = await connectDB();

    // Convertir les ObjectId si nécessaire
    const processedFilter: any = {};
    for (const key in filter) {
      if (key === "_id" && typeof filter[key] === "string") {
        try {
          processedFilter[key] = new ObjectId(filter[key]);
        } catch (e) {
          processedFilter[key] = filter[key];
        }
      } else {
        processedFilter[key] = filter[key];
      }
    }

    // Mettre à jour le document dans la collection
    const result = await db
      .collection(collectionName)
      .updateOne(processedFilter, { $set: update });

    // Récupérer le document mis à jour
    if (result.matchedCount > 0) {
      return await findOne(collectionName, filter);
    }

    return null;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

// Fonction pour supprimer un document dans une collection
export async function deleteOne(collectionName: string, filter: any) {
  try {
    const db = await connectDB();

    // Convertir les ObjectId si nécessaire
    const processedFilter: any = {};
    for (const key in filter) {
      if (key === "_id" && typeof filter[key] === "string") {
        try {
          processedFilter[key] = new ObjectId(filter[key]);
        } catch (e) {
          processedFilter[key] = filter[key];
        }
      } else {
        processedFilter[key] = filter[key];
      }
    }

    // Récupérer l'ID du document avant de le supprimer
    const document = await findOne(collectionName, filter);
    if (!document) {
      return null;
    }

    const id = document.id || safeToString(document._id);

    // Supprimer le document dans la collection
    await db.collection(collectionName).deleteOne(processedFilter);

    // Retourner l'ID du document supprimé
    return { id };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la suppression dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

// Fonction pour compter les documents dans une collection
export async function count(collectionName: string, filter: any = {}) {
  try {
    const db = await connectDB();

    // Convertir les ObjectId si nécessaire
    const processedFilter: any = {};
    for (const key in filter) {
      if (key === "_id" && typeof filter[key] === "string") {
        try {
          processedFilter[key] = new ObjectId(filter[key]);
        } catch (e) {
          processedFilter[key] = filter[key];
        }
      } else {
        processedFilter[key] = filter[key];
      }
    }

    // Compter les documents dans la collection
    return await db.collection(collectionName).countDocuments(processedFilter);
  } catch (error) {
    console.error(`❌ Erreur lors du comptage dans ${collectionName}:`, error);
    throw error;
  }
}

// Fonction pour récupérer un utilisateur par email
export async function getUserByEmail(email: string) {
  try {
    console.log(`Recherche d'utilisateur par email: ${email}`);

    // Rechercher dans la collection "User"
    const user = await findOne("User", { email });

    if (user) {
      console.log(`Utilisateur trouvé: oui`);
      return user;
    }

    console.log(`Utilisateur non trouvé avec l'email: ${email}`);
    return null;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche d'utilisateur par email:`,
      error
    );
    throw error;
  }
}

// Fonction pour récupérer un utilisateur par ID
export async function getUserById(id: string) {
  try {
    // Convertir en ObjectId si possible
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      // Si ce n'est pas un ObjectId valide, utiliser l'ID tel quel
      return await findOne("User", { id });
    }

    // Rechercher dans la collection "User"
    return await findOne("User", { _id: objectId });
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche d'utilisateur par ID:`,
      error
    );
    throw error;
  }
}

// Exporter par défaut la fonction de connexion
export default connectDB;

// Exporter les autres fonctions
