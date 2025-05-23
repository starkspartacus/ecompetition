/**
 * Client MongoDB natif qui respecte le schéma Prisma
 */
const { MongoClient, ObjectId } = require("mongodb");

// Récupérer l'URL de connexion depuis les variables d'environnement
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!uri) {
  throw new Error(
    "Veuillez définir la variable d'environnement MONGODB_URI ou DATABASE_URL"
  );
}

// Créer un singleton pour éviter les connexions multiples
let client;
let db;

// Fonction pour se connecter à MongoDB
async function connectToDatabase() {
  if (client && db) {
    return { client, db };
  }

  try {
    // Extraire le nom de la base de données de l'URI
    const dbName = uri.split("/").pop().split("?")[0];

    if (!dbName) {
      throw new Error(
        "Impossible de déterminer le nom de la base de données à partir de l'URI"
      );
    }

    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    db = client.db(dbName);

    console.log("✅ Connecté à MongoDB avec succès");
    return { client, db };
  } catch (error) {
    console.error("❌ Erreur de connexion à MongoDB:", error);
    throw error;
  }
}

// Fonction pour générer un ID unique au format ObjectId
function generateId() {
  return new ObjectId().toString();
}

// Fonction pour convertir un ID en ObjectId
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error("ID invalide:", id);
    return null;
  }
}

// Fonction pour créer un document
async function createDocument(collection, data) {
  try {
    const { db } = await connectToDatabase();
    const id = generateId();

    // Préparer les données avec l'ID
    const documentData = {
      _id: id,
      ...data,
      id,
    };

    // Insérer le document
    await db.collection(collection).insertOne(documentData);

    // Retourner le document créé sans le champ _id
    const { _id, ...result } = documentData;
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de la création dans ${collection}:`, error);
    throw error;
  }
}

// Fonction pour trouver un document par ID
async function findDocumentById(collection, id) {
  try {
    const { db } = await connectToDatabase();

    // Trouver le document
    const document = await db.collection(collection).findOne({ _id: id });

    if (!document) {
      return null;
    }

    // Retourner le document sans le champ _id
    const { _id, ...result } = document;
    return result;
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche dans ${collection}:`, error);
    throw error;
  }
}

// Fonction pour trouver des documents par filtre
async function findDocuments(collection, filter = {}, options = {}) {
  try {
    const { db } = await connectToDatabase();

    // Construire la requête
    let query = db.collection(collection).find(filter);

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

    // Transformer les résultats
    return documents.map((doc) => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id };
    });
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche dans ${collection}:`, error);
    throw error;
  }
}

// Fonction pour mettre à jour un document
async function updateDocument(collection, id, data) {
  try {
    const { db } = await connectToDatabase();

    // Mettre à jour le document
    await db
      .collection(collection)
      .updateOne({ _id: id }, { $set: { ...data, updatedAt: new Date() } });

    // Retourner le document mis à jour
    return await findDocumentById(collection, id);
  } catch (error) {
    console.error(
      `❌ Erreur lors de la mise à jour dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour supprimer un document
async function deleteDocument(collection, id) {
  try {
    const { db } = await connectToDatabase();

    // Supprimer le document
    await db.collection(collection).deleteOne({ _id: id });

    return { id };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la suppression dans ${collection}:`,
      error
    );
    throw error;
  }
}

// Fonction pour compter les documents
async function countDocuments(collection, filter = {}) {
  try {
    const { db } = await connectToDatabase();

    // Compter les documents
    return await db.collection(collection).countDocuments(filter);
  } catch (error) {
    console.error(`❌ Erreur lors du comptage dans ${collection}:`, error);
    throw error;
  }
}

// Exporter les fonctions et objets nécessaires
module.exports = {
  connectToDatabase,
  generateId,
  toObjectId,
  ObjectId,
  createDocument,
  findDocumentById,
  findDocuments,
  updateDocument,
  deleteDocument,
  countDocuments,
};
