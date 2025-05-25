import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export interface GroupDocument extends BaseDocument {
  name: string;
  competitionId: ObjectId;
}

export class GroupModel extends BaseModel<GroupDocument> {
  constructor() {
    super("Group");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ competitionId: 1 }),
        collection.createIndex({ competitionId: 1, name: 1 }, { unique: true }),
        collection.createIndex({ name: 1 }),
        collection.createIndex({ createdAt: -1 }),
      ]);

      console.log("✅ Index Group créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index Group:", error);
    }
  }

  async findByCompetition(competitionId: string): Promise<GroupDocument[]> {
    if (!ObjectId.isValid(competitionId)) return [];

    return this.findMany(
      { competitionId: new ObjectId(competitionId) },
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

    const group = await this.findOne(filter);
    return !!group;
  }

  async getGroupWithTeams(id: string): Promise<any> {
    try {
      if (!ObjectId.isValid(id)) return null;

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: "Team",
            localField: "_id",
            foreignField: "groupId",
            as: "teams",
            pipeline: [{ $sort: { name: 1 } }],
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
            competition: { $arrayElemAt: ["$competition", 0] },
            teamsCount: { $size: "$teams" },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results[0] ? this.normalizeDocument(results[0]) : null;
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du groupe avec équipes:",
        error
      );
      return null;
    }
  }

  async getCompetitionGroups(competitionId: string): Promise<any[]> {
    try {
      if (!ObjectId.isValid(competitionId)) return [];

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { competitionId: new ObjectId(competitionId) } },
        {
          $lookup: {
            from: "Team",
            localField: "_id",
            foreignField: "groupId",
            as: "teams",
          },
        },
        {
          $addFields: {
            id: { $toString: "$_id" },
            teamsCount: { $size: "$teams" },
          },
        },
        { $sort: { name: 1 } },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return this.normalizeDocuments(results);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des groupes de la compétition:",
        error
      );
      return [];
    }
  }

  async createGroupsForCompetition(
    competitionId: string,
    groupNames: string[]
  ): Promise<GroupDocument[]> {
    try {
      if (!ObjectId.isValid(competitionId) || groupNames.length === 0)
        return [];

      const groups: GroupDocument[] = [];

      for (const name of groupNames) {
        const exists = await this.checkNameExists(competitionId, name);
        if (!exists) {
          const group = await this.create({
            name,
            competitionId: new ObjectId(competitionId),
          });
          if (group) {
            groups.push(group);
          }
        }
      }

      return groups;
    } catch (error) {
      console.error("❌ Erreur lors de la création des groupes:", error);
      return [];
    }
  }
}

// Instance singleton
export const groupModel = new GroupModel();
