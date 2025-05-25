import { BaseModel, type BaseDocument } from "./base-model";
import bcrypt from "bcryptjs";

export type UserRole = "ADMIN" | "ORGANIZER" | "PARTICIPANT";

export interface UserDocument extends BaseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
  country?: string;
  city?: string;
  commune?: string;
  emailVerified?: Date;
  image?: string;
}

export class UserModel extends BaseModel<UserDocument> {
  constructor() {
    super("User");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ email: 1 }, { unique: true }),
        collection.createIndex({ phoneNumber: 1 }, { sparse: true }),
        collection.createIndex({ role: 1 }),
        collection.createIndex({ country: 1 }),
        collection.createIndex({ city: 1 }),
        collection.createIndex({ firstName: 1, lastName: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ emailVerified: 1 }),
      ]);

      console.log("✅ Index User créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index User:", error);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return this.findOne({ email: normalizedEmail });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
    return this.findOne({ phoneNumber });
  }

  async createUser(
    userData: Omit<UserDocument, keyof BaseDocument>
  ): Promise<UserDocument | null> {
    try {
      // Vérifier si l'email existe déjà
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error("Un utilisateur avec cet email existe déjà");
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await this.create({
        ...userData,
        email: userData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: userData.role || "PARTICIPANT",
      });

      return user;
    } catch (error) {
      console.error("❌ Erreur lors de la création de l'utilisateur:", error);
      return null;
    }
  }

  async verifyPassword(
    email: string,
    password: string
  ): Promise<UserDocument | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la vérification du mot de passe:",
        error
      );
      return null;
    }
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const result = await this.updateById(id, { password: hashedPassword });
      return !!result;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du mot de passe:", error);
      return false;
    }
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.findMany({ role }, { sort: { createdAt: -1 } });
  }

  async findByCountry(country: string): Promise<UserDocument[]> {
    return this.findMany({ country }, { sort: { firstName: 1, lastName: 1 } });
  }

  async searchUsers(query: string, role?: UserRole): Promise<UserDocument[]> {
    try {
      const searchRegex = new RegExp(query, "i");
      const filter: any = {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
        ],
      };

      if (role) {
        filter.role = role;
      }

      return this.findMany(filter, { sort: { firstName: 1, lastName: 1 } });
    } catch (error) {
      console.error("❌ Erreur lors de la recherche d'utilisateurs:", error);
      return [];
    }
  }

  async getUserStats(): Promise<{
    total: number;
    byRole: Record<UserRole, number>;
    byCountry: Record<string, number>;
    recentUsers: number;
  }> {
    try {
      const collection = await this.getCollection();

      const [totalResult, roleStats, countryStats, recentStats] =
        await Promise.all([
          collection.countDocuments(),
          collection
            .aggregate([
              { $group: { _id: "$role", count: { $sum: 1 } } },
              { $project: { role: "$_id", count: 1, _id: 0 } },
            ])
            .toArray(),
          collection
            .aggregate([
              { $match: { country: { $exists: true, $ne: null } } },
              { $group: { _id: "$country", count: { $sum: 1 } } },
              { $project: { country: "$_id", count: 1, _id: 0 } },
              { $sort: { count: -1 } },
            ])
            .toArray(),
          collection.countDocuments({
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          }),
        ]);

      // Initialiser byRole avec toutes les valeurs possibles
      const byRole: Record<UserRole, number> = {
        ADMIN: 0,
        ORGANIZER: 0,
        PARTICIPANT: 0,
      };

      // Remplir avec les données réelles
      roleStats.forEach((stat) => {
        const role = stat.role as UserRole;
        if (role in byRole) {
          byRole[role] = stat.count;
        }
      });

      const byCountry = countryStats.reduce((acc, stat) => {
        acc[stat.country] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: totalResult,
        byRole,
        byCountry,
        recentUsers: recentStats,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques utilisateurs:",
        error
      );
      return {
        total: 0,
        byRole: { ADMIN: 0, ORGANIZER: 0, PARTICIPANT: 0 },
        byCountry: {},
        recentUsers: 0,
      };
    }
  }
}

// Instance singleton
export const userModel = new UserModel();
