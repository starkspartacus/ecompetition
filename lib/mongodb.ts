import { MongoClient, ObjectId } from "mongodb";

// Récupérer l'URL de connexion MongoDB depuis les variables d'environnement
const uri = process.env.DATABASE_URL || "";

// Créer une instance du client MongoDB
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
  // En production, créer un nouveau client
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Fonction pour obtenir la base de données
export async function getDb() {
  const client = await clientPromise;
  return client.db();
}

// Fonction pour convertir un ID en ObjectId MongoDB
export function toObjectId(id: string) {
  return new ObjectId(id);
}

// Fonction pour convertir un document MongoDB en objet JavaScript
export function fromMongoDocument<T>(doc: any): T {
  if (!doc) return null as unknown as T;

  // Convertir _id en id
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  } as unknown as T;
}

// Fonction pour préparer un objet pour MongoDB
export function toMongoDocument(obj: any) {
  const result: any = { ...obj };

  // Convertir id en _id si présent
  if (obj.id) {
    result._id = new ObjectId(obj.id);
    delete result.id;
  }

  // Convertir les dates en objets Date
  for (const key in result) {
    if (result[key] instanceof Date) {
      result[key] = new Date(result[key]);
    } else if (
      typeof result[key] === "string" &&
      /^\d{4}-\d{2}-\d{2}/.test(result[key])
    ) {
      // Tenter de convertir les chaînes de date en objets Date
      try {
        const date = new Date(result[key]);
        if (!isNaN(date.getTime())) {
          result[key] = date;
        }
      } catch (e) {
        // Ignorer les erreurs de conversion
      }
    }
  }

  return result;
}
