import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export interface TeamDocument extends BaseDocument {
  name: string;
  competitionId: ObjectId;
  captainId: ObjectId;
  groupId?: ObjectId;
  description?: string;
  logo?: string;
  isActive: boolean;
}

export class TeamModel extends BaseModel<TeamDocument> {
  constructor() {
    super("Team");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ competitionId: 1 }),
        collection.createIndex({ captainId: 1 }),
        collection.createIndex({ groupId: 1 }),
        collection.createIndex({ competitionId: 1, name: 1 }, { unique: true }),
        collection.createIndex({ isActive: 1 }),
        collection.createIndex({ name: 1 }),
        collection.createIndex({ createdAt: -1 }),
      ]);

      console.log("✅ Index Team créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index Team:", error);
    }
  }

  async findByCompetition(competitionId: string): Promise<TeamDocument[]> {
    if (!ObjectId.isValid(competitionId)) return [];

    return this.findMany(
      { competitionId: new ObjectId(competitionId), isActive: true },
      { sort: { name: 1 } }
    );
  }

  async findByCaptain(captainId: string): Promise<TeamDocument[]> {
    if (!ObjectId.isValid(captainId)) return [];

    return this.findMany(
      { captainId: new ObjectId(captainId) },
      { sort: { createdAt: -1 } }
    );
  }

  async findByGroup(groupId: string): Promise<TeamDocument[]> {
    if (!ObjectId.isValid(groupId)) return [];

    return this.findMany(
      { groupId: new ObjectId(groupId) },
      { sort: { name: 1 } }
    );
  }

  async checkNameExists(
    competitionId: string,
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    if (!ObjectId.isValid(competitionId)) return false;

    const filter: any = {
      competitionId: new ObjectId(competitionId),
      name: { $regex: new RegExp(`^${name}$`, "i") },
    };

    if (excludeId && ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new ObjectId(excludeId) };
    }

    const team = await this.findOne(filter);
    return !!team;
  }

  async getTeamWithPlayers(id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) return null;

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "Player",
            localField: "_id",
            foreignField: "teamId",
            as: "players",
            pipeline: [{ $sort: { jerseyNumber: 1 } }],
          },
        },
        {
          $lookup: {
            from: "User",
            localField: "captainId",
            foreignField: "_id",
            as: "captain",
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
          $lookup: {
            from: "Group",
            localField: "groupId",
            foreignField: "_id",
            as: "group",
          },
        },
        {
          $addFields: {
            id: { $toString: "$_id" },
            captain: { $arrayElemAt: ["$captain", 0] },
            competition: { $arrayElemAt: ["$competition", 0] },
            group: { $arrayElemAt: ["$group", 0] },
            playersCount: { $size: "$players" },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results[0] ? this.normalizeDocument(results[0]) : null;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération de l'équipe avec joueurs:",
        error
      );
      return null;
    }
  }

  async assignToGroup(
    teamId: string,
    groupId: string
  ): Promise<TeamDocument | null> {
    if (!ObjectId.isValid(teamId) || !ObjectId.isValid(groupId)) return null;

    return this.updateById(teamId, { groupId: new ObjectId(groupId) });
  }

  async removeFromGroup(teamId: string): Promise<TeamDocument | null> {
    if (!ObjectId.isValid(teamId)) return null;

    return this.updateById(teamId, { groupId: undefined });
  }

  async deactivateTeam(id: string): Promise<TeamDocument | null> {
    return this.updateById(id, { isActive: false });
  }

  async activateTeam(id: string): Promise<TeamDocument | null> {
    return this.updateById(id, { isActive: true });
  }

  async getTeamStats(competitionId: string): Promise<{
    total: number;
    active: number;
    withGroups: number;
    averagePlayersPerTeam: number;
  }> {
    try {
      if (!ObjectId.isValid(competitionId)) {
        return { total: 0, active: 0, withGroups: 0, averagePlayersPerTeam: 0 };
      }

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { competitionId: new ObjectId(competitionId) } },
        {
          $lookup: {
            from: "Player",
            localField: "_id",
            foreignField: "teamId",
            as: "players",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            withGroups: {
              $sum: { $cond: [{ $ne: ["$groupId", null] }, 1, 0] },
            },
            totalPlayers: { $sum: { $size: "$players" } },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      const data = results[0];

      if (!data) {
        return { total: 0, active: 0, withGroups: 0, averagePlayersPerTeam: 0 };
      }

      return {
        total: data.total,
        active: data.active,
        withGroups: data.withGroups,
        averagePlayersPerTeam:
          data.total > 0 ? Math.round(data.totalPlayers / data.total) : 0,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques d'équipes:",
        error
      );
      return { total: 0, active: 0, withGroups: 0, averagePlayersPerTeam: 0 };
    }
  }
}

// Instance singleton
export const teamModel = new TeamModel();
