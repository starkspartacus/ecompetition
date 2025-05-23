import { MongoClient, ObjectId } from "mongodb";

// Récupérer l'URL de connexion depuis les variables d'environnement
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  console.error(
    "❌ ERREUR: Variable d'environnement MONGODB_URI ou DATABASE_URL non définie"
  );
}

// Extraire le nom de la base de données de l'URI si non spécifié
const extractedDbName =
  !dbName && uri ? uri.split("/").pop()?.split("?")[0] : dbName;

if (!extractedDbName) {
  console.error(
    "❌ ERREUR: Impossible de déterminer le nom de la base de données. Veuillez définir MONGODB_DB ou inclure le nom dans l'URI"
  );
}

// Options de connexion MongoDB
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let client;
let db;
let isConnecting = false;
let connectionPromise = null;

/**
 * Établit une connexion à MongoDB
 */
async function connectDB() {
  // Si nous sommes déjà en train de nous connecter, attendons que cette connexion se termine
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Si nous sommes déjà connectés, retournons la connexion existante
  if (client && db) {
    return db;
  }

  try {
    isConnecting = true;
    connectionPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("🔄 Tentative de connexion à MongoDB...");

        // Vérifier que l'URI est défini
        if (!uri) {
          throw new Error("URI de connexion MongoDB non défini");
        }

        // Créer un nouveau client MongoDB
        client = new MongoClient(uri);

        // Se connecter au serveur MongoDB
        await client.connect();
        console.log("✅ Connecté avec succès à MongoDB");

        // Sélectionner la base de données
        const databaseName = extractedDbName || "mydatabase";
        db = client.db(databaseName);
        console.log(`✅ Base de données sélectionnée: ${databaseName}`);

        // Vérifier la connexion en listant les collections
        const collections = await db.listCollections().toArray();
        console.log(
          `✅ Collections disponibles: ${collections
            .map((c) => c.name)
            .join(", ")}`
        );

        isConnecting = false;
        resolve(db);
      } catch (error) {
        console.error("❌ Erreur de connexion à MongoDB:", error);
        isConnecting = false;
        client = null;
        db = null;
        reject(error);
      }
    });

    return await connectionPromise;
  } catch (error) {
    console.error("❌ Erreur lors de la connexion à MongoDB:", error);
    isConnecting = false;
    throw error;
  }
}

/**
 * Ferme la connexion à MongoDB
 */
async function disconnectDB() {
  if (client) {
    try {
      await client.close();
      console.log("✅ Déconnecté de MongoDB");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion de MongoDB:", error);
    } finally {
      client = null;
      db = null;
    }
  }
}

/**
 * Vérifie si une chaîne est un ObjectId valide
 */
function isValidObjectId(id) {
  if (!id || typeof id !== "string") return false;

  try {
    new ObjectId(id);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convertit un ID en ObjectId si possible
 */
function toObjectId(id) {
  if (isValidObjectId(id)) {
    return new ObjectId(id);
  }
  return id;
}

/**
 * Traite un filtre pour convertir les IDs en ObjectId si nécessaire
 */
function processFilter(filter) {
  const processedFilter = {};

  for (const key in filter) {
    if (
      key === "_id" ||
      key === "id" ||
      key === "organizerId" ||
      key.endsWith("Id")
    ) {
      if (isValidObjectId(filter[key])) {
        processedFilter[key] = toObjectId(filter[key]);
        console.log(`✅ Converti ${key} en ObjectId: ${processedFilter[key]}`);
      } else {
        processedFilter[key] = filter[key];
      }
    } else {
      processedFilter[key] = filter[key];
    }
  }

  return processedFilter;
}

/**
 * Insère un document dans une collection
 */
async function insertOne(collectionName, document) {
  try {
    // S'assurer que la connexion est établie
    await connectDB();

    console.log(`📝 Insertion d'un document dans ${collectionName}`);

    // Préparer le document avec un ID
    const id = new ObjectId();
    const documentWithId = {
      _id: id,
      ...document,
    };

    // Insérer le document
    const collection = db.collection(collectionName);
    const result = await collection.insertOne(documentWithId);

    if (result.acknowledged) {
      console.log(
        `✅ Document inséré avec succès dans ${collectionName}. ID: ${id}`
      );

      // Retourner le document inséré avec id au lieu de _id
      const { _id, ...rest } = documentWithId;
      return {
        id: _id.toString(),
        ...rest,
      };
    } else {
      throw new Error(`Échec de l'insertion dans ${collectionName}`);
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'insertion dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Trouve un document par son ID
 */
async function findOne(collectionName, filter = {}) {
  try {
    // S'assurer que la connexion est établie
    await connectDB();

    console.log(`🔍 Recherche d'un document dans ${collectionName}`);

    // Traiter le filtre
    const processedFilter = processFilter(filter);
    console.log(`🔍 Filtre traité:`, JSON.stringify(processedFilter, null, 2));

    // Trouver le document
    const collection = db.collection(collectionName);
    const document = await collection.findOne(processedFilter);

    if (document) {
      console.log(`✅ Document trouvé dans ${collectionName}`);

      // Convertir _id en id
      const { _id, ...rest } = document;
      return {
        id: _id.toString(),
        ...rest,
      };
    } else {
      console.log(
        `ℹ️ Aucun document trouvé dans ${collectionName} avec le filtre:`,
        processedFilter
      );
      return null;
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Trouve plusieurs documents selon un filtre
 */
async function find(collectionName, filter = {}, options = {}) {
  try {
    // S'assurer que la connexion est établie
    await connectDB();

    console.log(`🔍 Recherche de documents dans ${collectionName}`);

    // Traiter le filtre
    const processedFilter = processFilter(filter);
    console.log(`🔍 Filtre traité:`, JSON.stringify(processedFilter, null, 2));

    // Trouver les documents
    const collection = db.collection(collectionName);
    let query = collection.find(processedFilter);

    // Appliquer les options
    if (options.sort) {
      query = query.sort(options.sort);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    // Exécuter la requête
    const documents = await query.toArray();
    console.log(
      `✅ ${documents.length} documents trouvés dans ${collectionName}`
    );

    // Convertir _id en id pour tous les documents
    return documents.map((doc) => {
      const { _id, ...rest } = doc;
      return {
        id: _id.toString(),
        ...rest,
      };
    });
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Met à jour un document
 */
async function updateOne(collectionName, filter, update) {
  try {
    // S'assurer que la connexion est établie
    await connectDB();

    console.log(`🔄 Mise à jour d'un document dans ${collectionName}`);

    // Traiter le filtre
    const processedFilter = processFilter(filter);
    console.log(`🔍 Filtre traité:`, JSON.stringify(processedFilter, null, 2));

    // Mettre à jour le document
    const collection = db.collection(collectionName);
    const result = await collection.updateOne(processedFilter, {
      $set: { ...update, updatedAt: new Date() },
    });

    if (result.matchedCount === 0) {
      console.log(
        `⚠️ Aucun document trouvé pour la mise à jour dans ${collectionName}`
      );
      return null;
    }

    console.log(
      `✅ Document mis à jour dans ${collectionName}. Modifié: ${result.modifiedCount}`
    );

    // Retourner le document mis à jour
    return await findOne(collectionName, processedFilter);
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Supprime un document
 */
async function deleteOne(collectionName, filter) {
  try {
    // S'assurer que la connexion est établie
    await connectDB();

    console.log(`🗑️ Suppression d'un document dans ${collectionName}`);

    // Traiter le filtre
    const processedFilter = processFilter(filter);
    console.log(`🔍 Filtre traité:`, JSON.stringify(processedFilter, null, 2));

    // Trouver le document avant de le supprimer pour récupérer son ID
    const documentToDelete = await findOne(collectionName, processedFilter);

    if (!documentToDelete) {
      console.log(
        `⚠️ Aucun document trouvé pour la suppression dans ${collectionName}`
      );
      return { id: filter._id || filter.id };
    }

    // Supprimer le document
    const collection = db.collection(collectionName);
    const result = await collection.deleteOne(processedFilter);

    console.log(
      `✅ Document supprimé dans ${collectionName}. Supprimé: ${result.deletedCount}`
    );

    // Retourner l'ID du document supprimé
    return { id: documentToDelete.id };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la suppression dans ${collectionName}:`,
      error
    );
    throw error;
  }
}

/**
 * Compte le nombre de documents selon un filtre
 */
async function count(collectionName, filter = {}) {
  try {
    // S'assurer que la connexion est établie
    await connectDB();

    console.log(`🔢 Comptage des documents dans ${collectionName}`);

    // Traiter le filtre
    const processedFilter = processFilter(filter);
    console.log(`🔍 Filtre traité:`, JSON.stringify(processedFilter, null, 2));

    // Compter les documents
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments(processedFilter);

    console.log(`✅ ${count} documents comptés dans ${collectionName}`);
    return count;
  } catch (error) {
    console.error(`❌ Erreur lors du comptage dans ${collectionName}:`, error);
    throw error;
  }
}

// Exporter les fonctions
export {
  connectDB,
  disconnectDB,
  isValidObjectId,
  toObjectId,
  processFilter,
  insertOne,
  findOne,
  find,
  updateOne,
  deleteOne,
  count,
  ObjectId,
};
