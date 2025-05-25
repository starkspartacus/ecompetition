import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

// Account model for NextAuth
export interface AccountDocument extends BaseDocument {
  userId: ObjectId;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

export class AccountModel extends BaseModel<AccountDocument> {
  constructor() {
    super("Account");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ userId: 1 }),
        collection.createIndex(
          { provider: 1, providerAccountId: 1 },
          { unique: true }
        ),
        collection.createIndex({ provider: 1 }),
        collection.createIndex({ type: 1 }),
      ]);

      console.log("✅ Index Account créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index Account:", error);
    }
  }

  async findByProvider(
    provider: string,
    providerAccountId: string
  ): Promise<AccountDocument | null> {
    return this.findOne({ provider, providerAccountId });
  }

  async findByUser(userId: string): Promise<AccountDocument[]> {
    if (!ObjectId.isValid(userId)) return [];

    return this.findMany({ userId: new ObjectId(userId) });
  }
}

// Session model for NextAuth
export interface SessionDocument extends BaseDocument {
  sessionToken: string;
  userId: ObjectId;
  expires: Date;
}

export class SessionModel extends BaseModel<SessionDocument> {
  constructor() {
    super("Session");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ sessionToken: 1 }, { unique: true }),
        collection.createIndex({ userId: 1 }),
        collection.createIndex({ expires: 1 }),
      ]);

      console.log("✅ Index Session créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index Session:", error);
    }
  }

  async findByToken(sessionToken: string): Promise<SessionDocument | null> {
    return this.findOne({ sessionToken });
  }

  async findByUser(userId: string): Promise<SessionDocument[]> {
    if (!ObjectId.isValid(userId)) return [];

    return this.findMany(
      { userId: new ObjectId(userId) },
      { sort: { createdAt: -1 } }
    );
  }

  async deleteExpired(): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteMany({
        expires: { $lt: new Date() },
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la suppression des sessions expirées:",
        error
      );
      return 0;
    }
  }
}

// VerificationToken model for NextAuth
export interface VerificationTokenDocument extends BaseDocument {
  identifier: string;
  token: string;
  expires: Date;
}

export class VerificationTokenModel extends BaseModel<VerificationTokenDocument> {
  constructor() {
    super("VerificationToken");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ identifier: 1, token: 1 }, { unique: true }),
        collection.createIndex({ token: 1 }),
        collection.createIndex({ expires: 1 }),
      ]);

      console.log("✅ Index VerificationToken créés avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création des index VerificationToken:",
        error
      );
    }
  }

  async findByToken(
    identifier: string,
    token: string
  ): Promise<VerificationTokenDocument | null> {
    return this.findOne({ identifier, token });
  }

  async deleteExpired(): Promise<number> {
    try {
      const collection = await this.getCollection();
      const result = await collection.deleteMany({
        expires: { $lt: new Date() },
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la suppression des tokens expirés:",
        error
      );
      return 0;
    }
  }
}

// Export instances
export const accountModel = new AccountModel();
export const sessionModel = new SessionModel();
export const verificationTokenModel = new VerificationTokenModel();
