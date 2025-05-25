import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export type ParticipationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ParticipationDocument extends BaseDocument {
  competitionId: ObjectId;
  participantId: ObjectId;
  status: ParticipationStatus;
  applicationDate: Date;
  approvalDate?: Date;
  rejectionReason?: string;
  notes?: string;
  teamName?: string;
  teamMembers?: string[];
}

export class ParticipationModel extends BaseModel<ParticipationDocument> {
  constructor() {
    super("Participation");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ competitionId: 1 }),
        collection.createIndex({ participantId: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ applicationDate: -1 }),
        collection.createIndex(
          { competitionId: 1, participantId: 1 },
          { unique: true }
        ),
        collection.createIndex({ competitionId: 1, status: 1 }),
        collection.createIndex({ participantId: 1, status: 1 }),
      ]);

      console.log("✅ Index Participation créés avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création des index Participation:",
        error
      );
    }
  }

  async findByCompetition(
    competitionId: string,
    status?: ParticipationStatus
  ): Promise<ParticipationDocument[]> {
    if (!ObjectId.isValid(competitionId)) return [];

    const filter: any = { competitionId: new ObjectId(competitionId) };
    if (status) filter.status = status;

    return this.findMany(filter, { sort: { applicationDate: -1 } });
  }

  async findByParticipant(
    participantId: string,
    status?: ParticipationStatus
  ): Promise<ParticipationDocument[]> {
    if (!ObjectId.isValid(participantId)) return [];

    const filter: any = { participantId: new ObjectId(participantId) };
    if (status) filter.status = status;

    return this.findMany(filter, { sort: { applicationDate: -1 } });
  }

  async findExisting(
    competitionId: string,
    participantId: string
  ): Promise<ParticipationDocument | null> {
    if (!ObjectId.isValid(competitionId) || !ObjectId.isValid(participantId))
      return null;

    return this.findOne({
      competitionId: new ObjectId(competitionId),
      participantId: new ObjectId(participantId),
    });
  }

  async createParticipation(
    data: Omit<ParticipationDocument, keyof BaseDocument>
  ): Promise<ParticipationDocument | null> {
    try {
      // Vérifier si une participation existe déjà
      const existing = await this.findExisting(
        data.competitionId.toString(),
        data.participantId.toString()
      );

      if (existing) {
        throw new Error("Une participation existe déjà pour cette compétition");
      }

      return this.create({
        ...data,
        status: "PENDING",
        applicationDate: new Date(),
      });
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création de la participation:",
        error
      );
      return null;
    }
  }

  async approveParticipation(
    id: string,
    notes?: string
  ): Promise<ParticipationDocument | null> {
    return this.updateById(id, {
      status: "APPROVED",
      approvalDate: new Date(),
      notes,
    });
  }

  async rejectParticipation(
    id: string,
    reason: string
  ): Promise<ParticipationDocument | null> {
    return this.updateById(id, {
      status: "REJECTED",
      rejectionReason: reason,
      approvalDate: new Date(),
    });
  }

  async withdrawParticipation(
    id: string
  ): Promise<ParticipationDocument | null> {
    return this.updateById(id, {
      status: "WITHDRAWN",
    });
  }

  async getParticipationsWithDetails(competitionId: string): Promise<any[]> {
    try {
      if (!ObjectId.isValid(competitionId)) return [];

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { competitionId: new ObjectId(competitionId) } },
        {
          $lookup: {
            from: "User",
            localField: "participantId",
            foreignField: "_id",
            as: "participant",
          },
        },
        {
          $lookup: {
            from: "Competition",
            localField: "competitionId",
            foreignField: "_id",
            as: "competition",
          },
        },
        {
          $addFields: {
            id: { $toString: "$_id" },
            participant: { $arrayElemAt: ["$participant", 0] },
            competition: { $arrayElemAt: ["$competition", 0] },
          },
        },
        { $sort: { applicationDate: -1 } },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return this.normalizeDocuments(results);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des participations avec détails:",
        error
      );
      return [];
    }
  }

  async getParticipationStats(competitionId: string): Promise<{
    total: number;
    byStatus: Record<ParticipationStatus, number>;
    recentApplications: number;
  }> {
    try {
      if (!ObjectId.isValid(competitionId)) {
        return {
          total: 0,
          byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0, WITHDRAWN: 0 },
          recentApplications: 0,
        };
      }

      const collection = await this.getCollection();
      const filter = { competitionId: new ObjectId(competitionId) };

      const [total, statusStats, recent] = await Promise.all([
        collection.countDocuments(filter),
        collection
          .aggregate([
            { $match: filter },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ])
          .toArray(),
        collection.countDocuments({
          ...filter,
          applicationDate: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      const byStatus: Record<ParticipationStatus, number> = {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        WITHDRAWN: 0,
      };

      // Traiter les résultats de l'agrégation
      statusStats.forEach((stat: any) => {
        const status = stat._id as ParticipationStatus;
        if (status in byStatus) {
          byStatus[status] = stat.count;
        }
      });

      return {
        total,
        byStatus,
        recentApplications: recent,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques de participation:",
        error
      );
      return {
        total: 0,
        byStatus: { PENDING: 0, APPROVED: 0, REJECTED: 0, WITHDRAWN: 0 },
        recentApplications: 0,
      };
    }
  }
}

// Instance singleton
export const participationModel = new ParticipationModel();
