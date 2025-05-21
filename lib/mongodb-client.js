/**
 * Client MongoDB natif pour remplacer Prisma dans les opérations critiques
 */
const { MongoClient, ObjectId } = require("mongodb");

// Récupérer l'URL de connexion depuis les variables d'environnement
const url = process.env.DATABASE_URL || process.env.MONGODB_URI;

// Vérifier que l'URL est définie
if (!url) {
  console.error(
    "❌ DATABASE_URL ou MONGODB_URI n'est pas défini dans les variables d'environnement"
  );
  process.exit(1);
}

// Extraire le nom de la base de données de l'URL
let dbName;
try {
  const urlObj = new URL(url);
  dbName = urlObj.pathname.substring(1); // Enlever le "/" au début
  if (!dbName) {
    console.error("❌ Nom de base de données manquant dans l'URL de connexion");
    dbName = "e_competition_db"; // Nom par défaut
    console.log(
      `ℹ️ Utilisation du nom de base de données par défaut: ${dbName}`
    );
  }
} catch (error) {
  console.error("❌ URL de connexion MongoDB invalide:", error.message);
  dbName = "e_competition_db"; // Nom par défaut
  console.log(`ℹ️ Utilisation du nom de base de données par défaut: ${dbName}`);
}

// Créer un client MongoDB
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Variable pour stocker la connexion
let db = null;

// Fonction pour se connecter à la base de données
async function connect() {
  if (!db) {
    try {
      await client.connect();
      console.log("✅ Connecté à MongoDB avec succès");
      db = client.db(dbName);
    } catch (error) {
      console.error("❌ Erreur de connexion à MongoDB:", error.message);
      throw error;
    }
  }
  return db;
}

// Fonction pour créer un document
async function create(collection, data) {
  const db = await connect();
  try {
    const result = await db.collection(collection).insertOne(data);
    return { id: result.insertedId.toString(), ...data };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la création dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Fonction pour trouver un document par ID
async function findById(collection, id) {
  const db = await connect();
  try {
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      return null; // ID invalide
    }
    return await db.collection(collection).findOne({ _id: objectId });
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Fonction pour trouver un document par un champ spécifique
async function findOne(collection, filter) {
  const db = await connect();
  try {
    return await db.collection(collection).findOne(filter);
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Fonction pour trouver plusieurs documents
async function findMany(collection, filter = {}, options = {}) {
  const db = await connect();
  try {
    let query = db.collection(collection).find(filter);

    if (options.orderBy) {
      const { field, direction } = options.orderBy;
      query = query.sort({ [field]: direction === "desc" ? -1 : 1 });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.skip) {
      query = query.skip(options.skip);
    }

    return await query.toArray();
  } catch (error) {
    console.error(
      `❌ Erreur lors de la recherche multiple dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Fonction pour mettre à jour un document
async function update(collection, id, data) {
  const db = await connect();
  try {
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      throw new Error("ID invalide");
    }
    await db
      .collection(collection)
      .updateOne({ _id: objectId }, { $set: data });
    return { id, ...data };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Fonction pour supprimer un document
async function remove(collection, id) {
  const db = await connect();
  try {
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      throw new Error("ID invalide");
    }
    await db.collection(collection).deleteOne({ _id: objectId });
    return { id };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la suppression dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Fonction pour compter les documents
async function count(collection, filter = {}) {
  const db = await connect();
  try {
    return await db.collection(collection).countDocuments(filter);
  } catch (error) {
    console.error(
      `❌ Erreur lors du comptage dans ${collection}:`,
      error.message
    );
    throw error;
  }
}

// Exporter les fonctions
module.exports = {
  connect,
  create,
  findById,
  findOne,
  findMany,
  update,
  remove,
  count,
  client,
  ObjectId,
};
