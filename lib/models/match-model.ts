import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "POSTPONED";

export interface MatchDocument extends BaseDocument {
  competitionId: ObjectId;
  homeTeamId: ObjectId;
  awayTeamId: ObjectId;
  groupId?: ObjectId;
  round?: number;
  matchNumber?: number;
  scheduledDate: Date;
  venue?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  startTime?: Date;
  endTime?: Date;
  referee?: string;
  notes?: string;
}

export class MatchModel extends BaseModel<MatchDocument> {
  constructor() {
    super("Match");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ competitionId: 1 }),
        collection.createIndex({ homeTeamId: 1 }),
        collection.createIndex({ awayTeamId: 1 }),
        collection.createIndex({ groupId: 1 }),
        collection.createIndex({ scheduledDate: 1 }),
        collection.createIndex({ status: 1 }),
        collection.createIndex({ round: 1 }),
        collection.createIndex({ competitionId: 1, round: 1 }),
        collection.createIndex({ competitionId: 1, status: 1 }),
        collection.createIndex({
          homeTeamId: 1,
          awayTeamId: 1,
          competitionId: 1,
        }),
      ]);

      console.log("✅ Index Match créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index Match:", error);
    }
  }

  async findByCompetition(competitionId: string): Promise<MatchDocument[]> {
    if (!ObjectId.isValid(competitionId)) return [];

    return this.findMany(
      { competitionId: new ObjectId(competitionId) },
      { sort: { scheduledDate: 1, round: 1 } }
    );
  }

  async findByTeam(teamId: string): Promise<MatchDocument[]> {
    if (!ObjectId.isValid(teamId)) return [];

    return this.findMany(
      {
        $or: [
          { homeTeamId: new ObjectId(teamId) },
          { awayTeamId: new ObjectId(teamId) },
        ],
      },
      { sort: { scheduledDate: 1 } }
    );
  }

  async findByGroup(groupId: string): Promise<MatchDocument[]> {
    if (!ObjectId.isValid(groupId)) return [];

    return this.findMany(
      { groupId: new ObjectId(groupId) },
      { sort: { scheduledDate: 1, round: 1 } }
    );
  }

  async getMatchesWithTeams(competitionId: string): Promise<any[]> {
    try {
      if (!ObjectId.isValid(competitionId)) return [];

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { competitionId: new ObjectId(competitionId) } },
        {
          $lookup: {
            from: "Team",
            localField: "homeTeamId",
            foreignField: "_id",
            as: "homeTeam",
          },
        },
        {
          $lookup: {
            from: "Team",
            localField: "awayTeamId",
            foreignField: "_id",
            as: "awayTeam",
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
            homeTeam: { $arrayElemAt: ["$homeTeam", 0] },
            awayTeam: { $arrayElemAt: ["$awayTeam", 0] },
            group: { $arrayElemAt: ["$group", 0] },
          },
        },
        { $sort: { scheduledDate: 1, round: 1 } },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return this.normalizeDocuments(results);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des matchs avec équipes:",
        error
      );
      return [];
    }
  }

  async updateScore(
    id: string,
    homeScore: number,
    awayScore: number
  ): Promise<MatchDocument | null> {
    return this.updateById(id, {
      homeScore,
      awayScore,
      status: "COMPLETED",
      endTime: new Date(),
    });
  }

  async startMatch(id: string): Promise<MatchDocument | null> {
    return this.updateById(id, {
      status: "LIVE",
      startTime: new Date(),
    });
  }

  async cancelMatch(
    id: string,
    reason?: string
  ): Promise<MatchDocument | null> {
    return this.updateById(id, {
      status: "CANCELLED",
      notes: reason,
    });
  }

  async postponeMatch(
    id: string,
    newDate: Date,
    reason?: string
  ): Promise<MatchDocument | null> {
    return this.updateById(id, {
      status: "POSTPONED",
      scheduledDate: newDate,
      notes: reason,
    });
  }

  async generateRoundRobinMatches(
    competitionId: string,
    teams: string[]
  ): Promise<MatchDocument[]> {
    try {
      if (!ObjectId.isValid(competitionId) || teams.length < 2) return [];

      const matches: MatchDocument[] = [];
      let matchNumber = 1;

      // Générer tous les matchs possibles (round-robin)
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const homeTeamId = new ObjectId(teams[i]);
          const awayTeamId = new ObjectId(teams[j]);

          // Match aller
          const match1 = await this.create({
            competitionId: new ObjectId(competitionId),
            homeTeamId,
            awayTeamId,
            round: 1,
            matchNumber: matchNumber++,
            scheduledDate: new Date(
              Date.now() + matchNumber * 7 * 24 * 60 * 60 * 1000
            ), // Une semaine d'intervalle
            status: "SCHEDULED",
          });

          if (match1) matches.push(match1);

          // Match retour
          const match2 = await this.create({
            competitionId: new ObjectId(competitionId),
            homeTeamId: awayTeamId,
            awayTeamId: homeTeamId,
            round: 2,
            matchNumber: matchNumber++,
            scheduledDate: new Date(
              Date.now() + matchNumber * 7 * 24 * 60 * 60 * 1000
            ),
            status: "SCHEDULED",
          });

          if (match2) matches.push(match2);
        }
      }

      return matches;
    } catch (error) {
      console.error("❌ Erreur lors de la génération des matchs:", error);
      return [];
    }
  }

  async getTeamRecord(teamId: string): Promise<{
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  }> {
    try {
      if (!ObjectId.isValid(teamId)) {
        return {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        };
      }

      const collection = await this.getCollection();
      const pipeline = [
        {
          $match: {
            $or: [
              { homeTeamId: new ObjectId(teamId) },
              { awayTeamId: new ObjectId(teamId) },
            ],
            status: "COMPLETED",
            homeScore: { $exists: true },
            awayScore: { $exists: true },
          },
        },
        {
          $project: {
            isHome: { $eq: ["$homeTeamId", new ObjectId(teamId)] },
            teamScore: {
              $cond: [
                { $eq: ["$homeTeamId", new ObjectId(teamId)] },
                "$homeScore",
                "$awayScore",
              ],
            },
            opponentScore: {
              $cond: [
                { $eq: ["$homeTeamId", new ObjectId(teamId)] },
                "$awayScore",
                "$homeScore",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            played: { $sum: 1 },
            won: {
              $sum: {
                $cond: [{ $gt: ["$teamScore", "$opponentScore"] }, 1, 0],
              },
            },
            drawn: {
              $sum: {
                $cond: [{ $eq: ["$teamScore", "$opponentScore"] }, 1, 0],
              },
            },
            lost: {
              $sum: {
                $cond: [{ $lt: ["$teamScore", "$opponentScore"] }, 1, 0],
              },
            },
            goalsFor: { $sum: "$teamScore" },
            goalsAgainst: { $sum: "$opponentScore" },
          },
        },
        {
          $addFields: {
            goalDifference: { $subtract: ["$goalsFor", "$goalsAgainst"] },
            points: { $add: [{ $multiply: ["$won", 3] }, "$drawn"] },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      const data = results[0] as
        | {
            played: number;
            won: number;
            drawn: number;
            lost: number;
            goalsFor: number;
            goalsAgainst: number;
            goalDifference: number;
            points: number;
          }
        | undefined;

      return (
        data || {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        }
      );
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération du bilan de l'équipe:",
        error
      );
      return {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      };
    }
  }

  async getUpcomingMatches(teamId?: string, limit = 10): Promise<any[]> {
    try {
      const filter: any = {
        status: "SCHEDULED",
        scheduledDate: { $gte: new Date() },
      };

      if (teamId && ObjectId.isValid(teamId)) {
        filter.$or = [
          { homeTeamId: new ObjectId(teamId) },
          { awayTeamId: new ObjectId(teamId) },
        ];
      }

      const collection = await this.getCollection();
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "Team",
            localField: "homeTeamId",
            foreignField: "_id",
            as: "homeTeam",
          },
        },
        {
          $lookup: {
            from: "Team",
            localField: "awayTeamId",
            foreignField: "_id",
            as: "awayTeam",
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
            homeTeam: { $arrayElemAt: ["$homeTeam", 0] },
            awayTeam: { $arrayElemAt: ["$awayTeam", 0] },
            competition: { $arrayElemAt: ["$competition", 0] },
          },
        },
        { $sort: { scheduledDate: 1 } },
        { $limit: limit },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return this.normalizeDocuments(results);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des prochains matchs:",
        error
      );
      return [];
    }
  }
}

// Instance singleton
export const matchModel = new MatchModel();
