import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export type CompetitionStatus =
  | "DRAFT"
  | "OPEN"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELLED";
export type CompetitionType = "TOURNAMENT" | "LEAGUE" | "KNOCKOUT";
export type CompetitionCategory =
  | "FOOTBALL"
  | "BASKETBALL"
  | "TENNIS"
  | "VOLLEYBALL"
  | "OTHER";

export interface CompetitionDocument extends BaseDocument {
  name: string;
  description?: string;
  category: CompetitionCategory;
  type: CompetitionType;
  status: CompetitionStatus;
  organizerId: ObjectId;
  country?: string;
  city?: string;
  commune?: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  maxParticipants?: number;
  minParticipants?: number;
  entryFee?: number;
  currency?: string;
  rules?: string;
  prizes?: string;
  isPublic: boolean;
  requiresApproval: boolean;
  contactEmail?: string;
  contactPhone?: string;
  venue?: string;
  bannerImage?: string;
}

export class CompetitionModel extends BaseModel<CompetitionDocument> {
  constructor() {
    super("Competition");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ organizerId: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ category: 1 }),
        collection.createIndex({ type: 1 }),
        collection.createIndex({ country: 1 }),
        collection.createIndex({ city: 1 }),
        collection.createIndex({ startDate: 1 }),
        collection.createIndex({ endDate: 1 }),
        collection.createIndex({ registrationDeadline: 1 }),
        collection.createIndex({ isPublic: 1 }),
        collection.createIndex({ createdAt: -1 }),
        collection.createIndex({ name: "text", description: "text" }),
        collection.createIndex({ status: 1, isPublic: 1, startDate: 1 }),
      ]);

      console.log("✅ Index Competition créés avec succès");
    } catch (error) {
      console.error(
        "❌ Erreur lors de la création des index Competition:",
        error
      );
    }
  }

  async findByOrganizer(organizerId: string): Promise<CompetitionDocument[]> {
    if (!ObjectId.isValid(organizerId)) return [];

    return this.findMany(
      { organizerId: new ObjectId(organizerId) },
      { sort: { createdAt: -1 } }
    );
  }

  async findPublicCompetitions(
    filters: {
      country?: string;
      category?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ competitions: CompetitionDocument[]; total: number }> {
    try {
      const {
        country,
        category,
        status,
        search,
        page = 1,
        limit = 12,
      } = filters;

      const matchStage: any = { isPublic: true };

      if (country) matchStage.country = country;
      if (category) matchStage.category = category;
      if (status) matchStage.status = status;
      if (search) {
        matchStage.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const collection = await this.getCollection();
      const pipeline = [
        { $match: matchStage },
        {
          $lookup: {
            from: "User",
            localField: "organizerId",
            foreignField: "_id",
            as: "organizer",
            pipeline: [
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            id: { $toString: "$_id" },
            organizer: { $arrayElemAt: ["$organizer", 0] },
          },
        },
        { $sort: { startDate: 1, createdAt: -1 } },
      ];

      const [competitions, total] = await Promise.all([
        collection
          .aggregate([
            ...pipeline,
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ])
          .toArray(),
        collection
          .aggregate([{ $match: matchStage }, { $count: "total" }])
          .toArray(),
      ]);

      return {
        competitions: this.normalizeDocuments(competitions),
        total: total[0]?.total || 0,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la recherche de compétitions publiques:",
        error
      );
      return { competitions: [], total: 0 };
    }
  }

  async getCompetitionWithDetails(id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) return null;

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "User",
            localField: "organizerId",
            foreignField: "_id",
            as: "organizer",
          },
        },
        {
          $lookup: {
            from: "Participation",
            localField: "_id",
            foreignField: "competitionId",
            as: "participations",
          },
        },
        {
          $lookup: {
            from: "Team",
            localField: "_id",
            foreignField: "competitionId",
            as: "teams",
          },
        },
        {
          $addFields: {
            id: { $toString: "$_id" },
            organizer: { $arrayElemAt: ["$organizer", 0] },
            participationsCount: { $size: "$participations" },
            teamsCount: { $size: "$teams" },
            approvedParticipations: {
              $size: {
                $filter: {
                  input: "$participations",
                  cond: { $eq: ["$$this.status", "APPROVED"] },
                },
              },
            },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results[0] ? this.normalizeDocument(results[0]) : null;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des détails de la compétition:",
        error
      );
      return null;
    }
  }

  async updateStatus(
    id: string,
    status: CompetitionStatus
  ): Promise<CompetitionDocument | null> {
    return this.updateById(id, { status });
  }

  async getStatsByOrganizer(organizerId: string): Promise<{
    total: number;
    byStatus: Record<CompetitionStatus, number>;
    byCategory: Record<CompetitionCategory, number>;
    totalParticipants: number;
  }> {
    try {
      if (!ObjectId.isValid(organizerId)) {
        return {
          total: 0,
          byStatus: {
            DRAFT: 0,
            OPEN: 0,
            ONGOING: 0,
            COMPLETED: 0,
            CANCELLED: 0,
          },
          byCategory: {
            FOOTBALL: 0,
            BASKETBALL: 0,
            TENNIS: 0,
            VOLLEYBALL: 0,
            OTHER: 0,
          },
          totalParticipants: 0,
        };
      }

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { organizerId: new ObjectId(organizerId) } },
        {
          $lookup: {
            from: "Participation",
            localField: "_id",
            foreignField: "competitionId",
            as: "participations",
            pipeline: [{ $match: { status: "APPROVED" } }],
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            statusCounts: {
              $push: {
                status: "$status",
                category: "$category",
                participantsCount: { $size: "$participations" },
              },
            },
            totalParticipants: {
              $sum: { $size: "$participations" },
            },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      const data = results[0];

      if (!data) {
        return {
          total: 0,
          byStatus: {
            DRAFT: 0,
            OPEN: 0,
            ONGOING: 0,
            COMPLETED: 0,
            CANCELLED: 0,
          },
          byCategory: {
            FOOTBALL: 0,
            BASKETBALL: 0,
            TENNIS: 0,
            VOLLEYBALL: 0,
            OTHER: 0,
          },
          totalParticipants: 0,
        };
      }

      const byStatus = data.statusCounts.reduce(
        (acc: any, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        },
        { DRAFT: 0, OPEN: 0, ONGOING: 0, COMPLETED: 0, CANCELLED: 0 }
      );

      const byCategory = data.statusCounts.reduce(
        (acc: any, item: any) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        { FOOTBALL: 0, BASKETBALL: 0, TENNIS: 0, VOLLEYBALL: 0, OTHER: 0 }
      );

      return {
        total: data.total,
        byStatus,
        byCategory,
        totalParticipants: data.totalParticipants,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques:",
        error
      );
      return {
        total: 0,
        byStatus: { DRAFT: 0, OPEN: 0, ONGOING: 0, COMPLETED: 0, CANCELLED: 0 },
        byCategory: {
          FOOTBALL: 0,
          BASKETBALL: 0,
          TENNIS: 0,
          VOLLEYBALL: 0,
          OTHER: 0,
        },
        totalParticipants: 0,
      };
    }
  }

  async searchCompetitions(
    query: string,
    filters: any = {}
  ): Promise<CompetitionDocument[]> {
    try {
      const searchFilter = {
        $text: { $search: query },
        ...filters,
      };

      return this.findMany(searchFilter, {
        sort: { score: { $meta: "textScore" } },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la recherche de compétitions:", error);
      return [];
    }
  }
}

// Instance singleton
export const competitionModel = new CompetitionModel();
