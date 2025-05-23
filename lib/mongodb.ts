import { MongoClient, ObjectId } from "mongodb";

// Récupérer l'URL de connexion MongoDB depuis les variables d'environnement
const uri = process.env.DATABASE_URL || "";

// Créer un client MongoDB
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!uri) {
  throw new Error("Veuillez définir la variable d'environnement DATABASE_URL");
}

if (process.env.NODE_ENV === "development") {
  // En développement, utiliser une variable globale pour que le client persiste
  // entre les rechargements à chaud
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // En production, il est préférable de ne pas utiliser une variable globale
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Fonction pour obtenir la base de données
export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

// Fonction pour convertir une chaîne en ObjectId MongoDB
export function toObjectId(id: string): ObjectId {
  try {
    return new ObjectId(id);
  } catch (error) {
    console.error(`Impossible de convertir l'ID en ObjectId: ${id}`, error);
    throw new Error(`ID invalide: ${id}`);
  }
}

export default clientPromise;
