import { MongoClient, type Db, ObjectId } from "mongodb";

// Déclaration des variables globales
declare global {
  var mongoClient: MongoClient | undefined;
  var mongoDb: Db | undefined;
}

// Fonction pour se connecter à MongoDB
export async function connectDB(): Promise<Db> {
  try {
    console.log("🔄 Tentative de connexion à MongoDB...");

    // Vérifier si les variables d'environnement sont définies
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI n'est pas défini dans les variables d'environnement"
      );
    }

    if (!process.env.MONGODB_DB) {
      throw new Error(
        "MONGODB_DB n'est pas défini dans les variables d'environnement"
      );
    }

    // Réutiliser la connexion existante si elle existe
    if (global.mongoClient && global.mongoDb) {
      console.log("✅ Réutilisation de la connexion MongoDB existante");
      return global.mongoDb;
    }

    // Créer une nouvelle connexion
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log("✅ Connecté avec succès à MongoDB");

    const db = client.db(process.env.MONGODB_DB);
    console.log(`✅ Base de données sélectionnée: ${process.env.MONGODB_DB}`);

    // Lister les collections pour vérifier la connexion
    const collections = await db.listCollections().toArray();
    console.log(
      "✅ Collections disponibles:",
      collections.map((c) => c.name).join(", ")
    );

    // Stocker la connexion pour la réutiliser
    global.mongoClient = client;
    global.mongoDb = db;

    return db;
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    throw error;
  }
}

// Fonction pour convertir un ID en chaîne de caractères de manière sécurisée
export function safeToString(id: any): string {
  if (id instanceof ObjectId) {
    return id.toString();
  }

  if (typeof id === "string") {
    return id;
  }

  if (id && typeof id.toString === "function") {
    return id.toString();
  }

  console.warn("⚠️ Impossible de convertir l'ID en chaîne:", id);
  return String(id); // Fallback
}

// Fonction pour trouver un document par ID
export async function findById(collection: string, id: string) {
  try {
    const db = await connectDB();

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`ID invalide pour ${collection}:`, id);
      return null;
    }

    console.log(`🔍 Recherche par ID dans ${collection}: ${id}`);
    const result = await db.collection(collection).findOne({ _id: objectId });

    if (result) {
      const idString = safeToString(result._id);

      console.log(`✅ Document trouvé dans ${collection} par ID:`, {
        _id: idString,
        ...Object.keys(result).reduce((acc, key) => {
          if (key !== "_id") acc[key] = typeof result[key];
          return acc;
        }, {} as Record<string, any>),
      });

      return {
        ...result,
        id: idString,
      };
    } else {
      console.log(
        `❌ Aucun document trouvé dans ${collection} avec l'ID: ${id}`
      );
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche par ID dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour trouver un document par critères
export async function findOne(collection: string, filter: any) {
  try {
    const db = await connectDB();

    console.log(`🔍 Recherche dans ${collection}`);
    console.log(`🔍 Filtre:`, JSON.stringify(filter, null, 2));

    const result = await db.collection(collection).findOne(filter);

    if (result) {
      const idString = safeToString(result._id);

      console.log(`✅ Document trouvé dans ${collection}:`, {
        _id: idString,
        ...Object.entries(result).reduce((acc, [key, value]) => {
          if (key !== "_id") acc[key] = value;
          return acc;
        }, {} as Record<string, any>),
      });

      return {
        ...result,
        id: idString,
      };
    } else {
      console.log(
        `❌ Aucun document trouvé dans ${collection} avec le filtre:`,
        filter
      );
      return null;
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche dans ${collection}:`, error);
    throw error;
  }
}

// Fonction pour trouver plusieurs documents
export async function find(
  collection: string,
  filter: any = {},
  options: any = {}
) {
  try {
    const db = await connectDB();

    console.log(`🔍 Recherche multiple dans ${collection}`);
    console.log(`🔍 Filtre:`, JSON.stringify(filter, null, 2));

    const cursor = db.collection(collection).find(filter, options);
    const results = await cursor.toArray();

    console.log(`✅ ${results.length} documents trouvés dans ${collection}`);

    // Convertir les _id en id string
    return results.map((item) => ({
      ...item,
      id: safeToString(item._id),
    }));
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche multiple dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour insérer un document
export async function insertOne(collection: string, document: any) {
  try {
    const db = await connectDB();

    // Ajouter un timestamp de création si non présent
    if (!document.createdAt) {
      document.createdAt = new Date();
    }

    // Ajouter un timestamp de mise à jour
    document.updatedAt = new Date();

    console.log(`📝 Insertion dans ${collection}:`, {
      ...Object.entries(document).reduce((acc, [key, value]) => {
        acc[key] = typeof value;
        return acc;
      }, {} as Record<string, any>),
    });

    const result = await db.collection(collection).insertOne(document);
    const idString = safeToString(result.insertedId);

    console.log(`✅ Document inséré dans ${collection}, ID:`, idString);

    // Retourner le document inséré avec son ID
    return {
      ...document,
      id: idString,
      _id: result.insertedId,
    };
  } catch (error) {
    console.error(`❌ Erreur lors de l'insertion dans ${collection}:`, error);
    throw error;
  }
}

// Fonction pour mettre à jour un document
export async function updateOne(collection: string, id: string, update: any) {
  try {
    const db = await connectDB();

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`ID invalide pour ${collection}:`, id);
      return null;
    }

    // Ajouter un timestamp de mise à jour
    update.updatedAt = new Date();

    console.log(`📝 Mise à jour dans ${collection}, ID: ${id}`);
    console.log(`📝 Données:`, JSON.stringify(update, null, 2));

    const result = await db
      .collection(collection)
      .updateOne({ _id: objectId }, { $set: update });
    console.log(
      `✅ Mise à jour dans ${collection}: ${result.matchedCount} trouvé, ${result.modifiedCount} modifié`
    );

    if (result.matchedCount === 0) {
      return null;
    }

    // Récupérer le document mis à jour
    return findById(collection, id);
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour supprimer un document
export async function deleteOne(collection: string, id: string) {
  try {
    const db = await connectDB();

    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`ID invalide pour ${collection}:`, id);
      return false;
    }

    console.log(`🗑️ Suppression dans ${collection}, ID: ${id}`);

    const result = await db.collection(collection).deleteOne({ _id: objectId });
    console.log(
      `✅ Suppression dans ${collection}: ${result.deletedCount} document(s) supprimé(s)`
    );

    return result.deletedCount > 0;
  } catch (error) {
    console.error(
      `❌ Erreur lors de la suppression dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour compter les documents
export async function count(collection: string, filter: any = {}) {
  try {
    const db = await connectDB();

    console.log(`🔢 Comptage dans ${collection}`);
    console.log(`🔢 Filtre:`, JSON.stringify(filter, null, 2));

    const count = await db.collection(collection).countDocuments(filter);
    console.log(`✅ Nombre de documents dans ${collection}: ${count}`);

    return count;
  } catch (error) {
    console.error(`❌ Erreur lors du comptage dans ${collection}:`, error);
    throw error;
  }
}

// Fonction pour exécuter une requête directe
export async function executeQuery(collection: string, query: any) {
  try {
    const db = await connectDB();

    console.log(`🔍 Exécution d'une requête dans ${collection}`);
    console.log(`🔍 Requête:`, JSON.stringify(query, null, 2));

    const result = await db.collection(collection).aggregate(query).toArray();
    console.log(
      `✅ Requête exécutée dans ${collection}: ${result.length} résultats`
    );

    return result.map((item) => ({
      ...item,
      id: safeToString(item._id),
    }));
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'exécution de la requête dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour obtenir un document utilisateur par email
export async function getUserByEmail(email: string) {
  try {
    const db = await connectDB();

    console.log(`🔍 Recherche d'utilisateur par email: ${email}`);

    // Rechercher l'utilisateur
    const user = await db.collection("User").findOne({ email });

    if (user) {
      const idString = safeToString(user._id);

      console.log(`✅ Utilisateur trouvé:`, {
        _id: idString,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      return {
        ...user,
        id: idString,
      };
    } else {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);

      // Lister tous les utilisateurs pour le débogage
      const allUsers = await db.collection("User").find({}).toArray();
      console.log(`ℹ️ Nombre total d'utilisateurs: ${allUsers.length}`);

      if (allUsers.length > 0) {
        console.log(
          `ℹ️ Emails des utilisateurs existants:`,
          allUsers.map((u) => u.email)
        );
      }

      return null;
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche d'utilisateur par email:`,
      error
    );
    throw error;
  }
}

// Fonction pour obtenir un document utilisateur par ID
export async function getUserById(id: string) {
  try {
    // Convertir l'ID en ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      console.error(`ID utilisateur invalide:`, id);
      return null;
    }

    const db = await connectDB();

    console.log(`🔍 Recherche d'utilisateur par ID: ${id}`);

    // Rechercher l'utilisateur
    const user = await db.collection("User").findOne({ _id: objectId });

    if (user) {
      const idString = safeToString(user._id);

      console.log(`✅ Utilisateur trouvé:`, {
        _id: idString,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      return {
        ...user,
        id: idString,
      };
    } else {
      console.log(`❌ Aucun utilisateur trouvé avec l'ID: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche d'utilisateur par ID:`,
      error
    );
    throw error;
  }
}

// Exporter le client MongoDB par défaut
export default connectDB;
