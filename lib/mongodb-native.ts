import {
  MongoClient,
  type Db,
  type Collection,
  type ObjectId,
  type WithId,
  type Document as MongoDocument,
} from "mongodb";

if (!process.env.MONGODB_URL) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URL"');
}

const uri = process.env.MONGODB_URL;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // Augmenté à 10s
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  try {
    console.log("🔌 Connexion à MongoDB...");
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || "competition";
    console.log(`📂 Utilisation de la base: ${dbName}`);

    const db = client.db(dbName);

    // Test de connexion
    await db.admin().ping();
    console.log("✅ MongoDB connecté avec succès");

    return db;
  } catch (error) {
    console.error("❌ Erreur connexion MongoDB:", error);
    throw error;
  }
}

export async function getCollection<T extends MongoDocument = MongoDocument>(
  name: string
): Promise<Collection<T>> {
  try {
    const db = await getDatabase();
    const collection = db.collection<T>(name);

    // Vérifier que la collection existe et a des documents
    const count = await collection.countDocuments();
    console.log(`📊 Collection '${name}': ${count} documents`);

    return collection;
  } catch (error) {
    console.error(`❌ Erreur accès collection '${name}':`, error);
    throw error;
  }
}

export async function debugCollections(): Promise<string[]> {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    console.log("📂 Collections disponibles:", collectionNames);
    return collectionNames;
  } catch (error) {
    console.error("❌ Erreur listage collections:", error);
    return [];
  }
}

// Competition types - using interfaces that extend MongoDocument
export interface CompetitionDoc extends MongoDocument {
  _id?: ObjectId;
  title: string;
  description?: string;
  category?: string;
  sport?: string;
  tournamentFormat?: string;
  rules?: string | string[];
  status: string;
  startDateCompetition?: Date;
  endDateCompetition?: Date;
  registrationStartDate?: Date;
  registrationDeadline?: Date;
  maxParticipants?: number;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  imageUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
  organizerId: ObjectId;
  organizer?: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  participantCount?: number;
  isParticipating?: boolean;
}

export interface UserDoc extends MongoDocument {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipationDoc extends MongoDocument {
  _id?: ObjectId;
  competitionId: ObjectId;
  userId: ObjectId;
  teamId?: ObjectId;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamDoc extends MongoDocument {
  _id?: ObjectId;
  name: string;
  description?: string;
  captainId: ObjectId;
  competitionId: ObjectId;
  members: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Type aliases for documents with _id
export type Competition = WithId<CompetitionDoc>;
export type User = WithId<UserDoc>;
export type Participation = WithId<ParticipationDoc>;
export type Team = WithId<TeamDoc>;

export default clientPromise;
