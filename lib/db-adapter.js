/**
 * Adaptateur de base de données pour NextAuth qui utilise MongoDB natif
 */
import { MongoClient, ObjectId } from "mongodb";

// Récupérer l'URL de connexion depuis les variables d'environnement
const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!uri) {
  throw new Error(
    "Veuillez définir la variable d'environnement MONGODB_URI ou DATABASE_URL"
  );
}

// Extraire le nom de la base de données de l'URI
const dbName = process.env.MONGODB_DB || uri.split("/").pop().split("?")[0];

if (!dbName) {
  throw new Error(
    "Impossible de déterminer le nom de la base de données à partir de l'URI"
  );
}

// Créer un singleton pour éviter les connexions multiples
let client;
let db;
let isConnecting = false;
let connectionPromise = null;

// Fonction pour se connecter à MongoDB
async function connectToDatabase() {
  // Si nous sommes déjà en train de nous connecter, attendons que cette connexion se termine
  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  // Si nous sommes déjà connectés, retournons la connexion existante
  if (client && db) {
    return { client, db };
  }

  try {
    isConnecting = true;
    connectionPromise = new Promise(async (resolve, reject) => {
      try {
        console.log(
          "🔄 Tentative de connexion à MongoDB pour l'adaptateur NextAuth..."
        );

        // Créer un nouveau client MongoDB
        client = new MongoClient(uri);

        // Se connecter au serveur MongoDB
        await client.connect();
        console.log(
          "✅ Connecté avec succès à MongoDB pour l'adaptateur NextAuth"
        );

        // Sélectionner la base de données
        db = client.db(dbName);
        console.log(`✅ Base de données sélectionnée: ${dbName}`);

        isConnecting = false;
        resolve({ client, db });
      } catch (error) {
        console.error(
          "❌ Erreur de connexion à MongoDB pour l'adaptateur NextAuth:",
          error
        );
        isConnecting = false;
        client = null;
        db = null;
        reject(error);
      }
    });

    return await connectionPromise;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la connexion à MongoDB pour l'adaptateur NextAuth:",
      error
    );
    isConnecting = false;
    throw error;
  }
}

// Fonction pour créer l'adaptateur MongoDB pour NextAuth
function MongoDBAdapter() {
  return {
    async createUser(user) {
      const { db } = await connectToDatabase();
      const result = await db.collection("User").insertOne({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Récupérer l'utilisateur créé
      const newUser = await db
        .collection("User")
        .findOne({ _id: result.insertedId });

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...userData } = newUser;
      return { id: _id.toString(), ...userData };
    },

    async getUser(id) {
      const { db } = await connectToDatabase();

      try {
        // Essayer de convertir en ObjectId
        const objectId = new ObjectId(id);
        const user = await db.collection("User").findOne({ _id: objectId });

        if (!user) return null;

        // Convertir _id en id pour la compatibilité avec NextAuth
        const { _id, ...userData } = user;
        return { id: _id.toString(), ...userData };
      } catch (error) {
        console.error(
          "❌ Erreur lors de la récupération de l'utilisateur:",
          error
        );
        return null;
      }
    },

    async getUserByEmail(email) {
      const { db } = await connectToDatabase();
      const user = await db.collection("User").findOne({ email });

      if (!user) return null;

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...userData } = user;
      return { id: _id.toString(), ...userData };
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const { db } = await connectToDatabase();

      const account = await db.collection("Account").findOne({
        provider,
        providerAccountId,
      });

      if (!account) return null;

      const user = await db.collection("User").findOne({ _id: account.userId });

      if (!user) return null;

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...userData } = user;
      return { id: _id.toString(), ...userData };
    },

    async updateUser(user) {
      const { db } = await connectToDatabase();

      // Convertir id en ObjectId
      const objectId = new ObjectId(user.id);

      // Supprimer id pour éviter les doublons avec _id
      const { id, ...userData } = user;

      // Mettre à jour l'utilisateur
      await db
        .collection("User")
        .updateOne(
          { _id: objectId },
          { $set: { ...userData, updatedAt: new Date() } }
        );

      // Récupérer l'utilisateur mis à jour
      const updatedUser = await db
        .collection("User")
        .findOne({ _id: objectId });

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...updatedUserData } = updatedUser;
      return { id: _id.toString(), ...updatedUserData };
    },

    async deleteUser(userId) {
      const { db } = await connectToDatabase();

      // Convertir en ObjectId
      const objectId = new ObjectId(userId);

      // Supprimer les sessions, comptes et utilisateur
      await db.collection("Session").deleteMany({ userId: objectId });
      await db.collection("Account").deleteMany({ userId: objectId });
      await db.collection("User").deleteOne({ _id: objectId });
    },

    async linkAccount(account) {
      const { db } = await connectToDatabase();

      // Convertir userId en ObjectId
      const userId = new ObjectId(account.userId);

      // Créer le compte avec userId comme ObjectId
      const result = await db.collection("Account").insertOne({
        ...account,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Récupérer le compte créé
      const newAccount = await db
        .collection("Account")
        .findOne({ _id: result.insertedId });

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...accountData } = newAccount;
      return { id: _id.toString(), ...accountData };
    },

    async unlinkAccount({ provider, providerAccountId }) {
      const { db } = await connectToDatabase();

      await db.collection("Account").deleteOne({
        provider,
        providerAccountId,
      });
    },

    async createSession(session) {
      const { db } = await connectToDatabase();

      // Convertir userId en ObjectId
      const userId = new ObjectId(session.userId);

      // Créer la session avec userId comme ObjectId
      const result = await db.collection("Session").insertOne({
        ...session,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Récupérer la session créée
      const newSession = await db
        .collection("Session")
        .findOne({ _id: result.insertedId });

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...sessionData } = newSession;
      return { id: _id.toString(), ...sessionData };
    },

    async getSessionAndUser(sessionToken) {
      const { db } = await connectToDatabase();

      const session = await db.collection("Session").findOne({ sessionToken });

      if (!session) return null;

      const user = await db.collection("User").findOne({ _id: session.userId });

      if (!user) return null;

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id: sessionId, ...sessionData } = session;
      const { _id: userId, ...userData } = user;

      return {
        session: { id: sessionId.toString(), ...sessionData },
        user: { id: userId.toString(), ...userData },
      };
    },

    async updateSession(session) {
      const { db } = await connectToDatabase();

      // Mettre à jour la session
      await db
        .collection("Session")
        .updateOne(
          { sessionToken: session.sessionToken },
          { $set: { ...session, updatedAt: new Date() } }
        );

      // Récupérer la session mise à jour
      const updatedSession = await db
        .collection("Session")
        .findOne({ sessionToken: session.sessionToken });

      if (!updatedSession) return null;

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...sessionData } = updatedSession;
      return { id: _id.toString(), ...sessionData };
    },

    async deleteSession(sessionToken) {
      const { db } = await connectToDatabase();

      await db.collection("Session").deleteOne({ sessionToken });
    },

    async createVerificationToken(verificationToken) {
      const { db } = await connectToDatabase();

      // Supprimer _id pour éviter les doublons
      const { _id, ...verificationTokenData } = verificationToken;

      // Créer le jeton de vérification
      await db.collection("VerificationToken").insertOne({
        ...verificationTokenData,
        createdAt: new Date(),
      });

      return verificationToken;
    },

    async useVerificationToken({ identifier, token }) {
      const { db } = await connectToDatabase();

      // Trouver et supprimer le jeton de vérification
      const verificationToken = await db
        .collection("VerificationToken")
        .findOne({
          identifier,
          token,
        });

      if (!verificationToken) return null;

      // Supprimer le jeton
      await db.collection("VerificationToken").deleteOne({
        identifier,
        token,
      });

      // Convertir _id en id pour la compatibilité avec NextAuth
      const { _id, ...verificationTokenData } = verificationToken;
      return verificationTokenData;
    },
  };
}

module.exports = MongoDBAdapter;
