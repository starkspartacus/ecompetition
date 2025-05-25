import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";
export type NotificationCategory =
  | "COMPETITION"
  | "TEAM"
  | "MATCH"
  | "SYSTEM"
  | "PARTICIPATION";

export interface NotificationDocument extends BaseDocument {
  userId: ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  readAt?: Date;
  relatedId?: ObjectId;
  relatedType?: string;
  actionUrl?: string;
  expiresAt?: Date;
}

export class NotificationModel extends BaseModel<NotificationDocument> {
  constructor() {
    super("Notification");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ userId: 1 }),
        collection.createIndex({ isRead: 1 }),
        collection.createIndex({ type: 1 }),
        collection.createIndex({ category: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ userId: 1, isRead: 1 }),
        collection.createIndex({ userId: 1, createdAt: -1 }),
        collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        collection.createIndex({ relatedId: 1, relatedType: 1 }),
      ]);

      console.log("✅ Index Notification créés avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création des index Notification:",
        error
      );
    }
  }

  async findByUser(
    userId: string,
    isRead?: boolean
  ): Promise<NotificationDocument[]> {
    if (!ObjectId.isValid(userId)) return [];

    const filter: any = { userId: new ObjectId(userId) };
    if (typeof isRead === "boolean") {
      filter.isRead = isRead;
    }

    return this.findMany(filter, { sort: { createdAt: -1 } });
  }

  async createNotification(
    data: Omit<NotificationDocument, keyof BaseDocument>
  ): Promise<NotificationDocument | null> {
    return this.create({
      ...data,
      isRead: false,
    });
  }

  async markAsRead(id: string): Promise<NotificationDocument | null> {
    return this.updateById(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(userId)) return false;

      const collection = await this.getCollection();
      const result = await collection.updateMany(
        { userId: new ObjectId(userId), isRead: false },
        { $set: { isRead: true, readAt: new Date(), updatedAt: new Date() } }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error(
        "❌ Erreur lors du marquage de toutes les notifications comme lues:",
        error
      );
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!ObjectId.isValid(userId)) return 0;

    return this.count({ userId: new ObjectId(userId), isRead: false });
  }

  async deleteOldNotifications(daysOld = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      const collection = await this.getCollection();

      const result = await collection.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true,
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la suppression des anciennes notifications:",
        error
      );
      return 0;
    }
  }

  async createBulkNotifications(
    notifications: Omit<NotificationDocument, keyof BaseDocument>[]
  ): Promise<number> {
    try {
      if (notifications.length === 0) return 0;

      const collection = await this.getCollection();
      const now = new Date();

      const insertData = notifications.map((notification) => ({
        ...notification,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      }));

      const result = await collection.insertMany(insertData as any);
      return result.insertedCount;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création en masse de notifications:",
        error
      );
      return 0;
    }
  }

  async findByCategory(
    userId: string,
    category: NotificationCategory
  ): Promise<NotificationDocument[]> {
    if (!ObjectId.isValid(userId)) return [];

    return this.findMany(
      { userId: new ObjectId(userId), category },
      { sort: { createdAt: -1 } }
    );
  }

  async findByRelated(
    relatedId: string,
    relatedType: string
  ): Promise<NotificationDocument[]> {
    if (!ObjectId.isValid(relatedId)) return [];

    return this.findMany(
      { relatedId: new ObjectId(relatedId), relatedType },
      { sort: { createdAt: -1 } }
    );
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byCategory: Record<NotificationCategory, number>;
  }> {
    try {
      if (!ObjectId.isValid(userId)) {
        return {
          total: 0,
          unread: 0,
          byType: { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0 },
          byCategory: {
            COMPETITION: 0,
            TEAM: 0,
            MATCH: 0,
            SYSTEM: 0,
            PARTICIPATION: 0,
          },
        };
      }

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { userId: new ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: {
              $sum: { $cond: [{ $eq: ["$isRead", false] }, 1, 0] },
            },
            types: { $push: "$type" },
            categories: { $push: "$category" },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      const data = results[0];

      if (!data) {
        return {
          total: 0,
          unread: 0,
          byType: { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0 },
          byCategory: {
            COMPETITION: 0,
            TEAM: 0,
            MATCH: 0,
            SYSTEM: 0,
            PARTICIPATION: 0,
          },
        };
      }

      const byType = data.types.reduce(
        (acc: any, type: NotificationType) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0 }
      );

      const byCategory = data.categories.reduce(
        (acc: any, category: NotificationCategory) => {
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        },
        { COMPETITION: 0, TEAM: 0, MATCH: 0, SYSTEM: 0, PARTICIPATION: 0 }
      );

      return {
        total: data.total,
        unread: data.unread,
        byType,
        byCategory,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques de notifications:",
        error
      );
      return {
        total: 0,
        unread: 0,
        byType: { INFO: 0, SUCCESS: 0, WARNING: 0, ERROR: 0 },
        byCategory: {
          COMPETITION: 0,
          TEAM: 0,
          MATCH: 0,
          SYSTEM: 0,
          PARTICIPATION: 0,
        },
      };
    }
  }
}

// Instance singleton
export const notificationModel = new NotificationModel();
