import { BaseModel, type BaseDocument } from "./base-model";
import { ObjectId } from "mongodb";

export type PlayerPosition =
  | "GOALKEEPER"
  | "DEFENDER"
  | "MIDFIELDER"
  | "FORWARD"
  | "OTHER";

export interface PlayerDocument extends BaseDocument {
  firstName: string;
  lastName: string;
  teamId: ObjectId;
  jerseyNumber: number;
  position?: PlayerPosition;
  dateOfBirth?: Date;
  nationality?: string;
  height?: number;
  weight?: number;
  isActive: boolean;
  isCaptain: boolean;
  photo?: string;
}

export class PlayerModel extends BaseModel<PlayerDocument> {
  constructor() {
    super("Player");
  }

  async createIndexes(): Promise<void> {
    try {
      const collection = await this.getCollection();

      await Promise.all([
        collection.createIndex({ teamId: 1 }),
        collection.createIndex(
          { teamId: 1, jerseyNumber: 1 },
          { unique: true }
        ),
        collection.createIndex({ firstName: 1, lastName: 1 }),
        collection.createIndex({ position: 1 }),
        collection.createIndex({ isActive: 1 }),
        collection.createIndex({ isCaptain: 1 }),
        collection.createIndex({ nationality: 1 }),
        collection.createIndex({ createdAt: -1 }),
      ]);

      console.log("✅ Index Player créés avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de la création des index Player:", error);
    }
  }

  async findByTeam(teamId: string): Promise<PlayerDocument[]> {
    if (!ObjectId.isValid(teamId)) return [];

    return this.findMany(
      { teamId: new ObjectId(teamId), isActive: true },
      { sort: { jerseyNumber: 1 } }
    );
  }

  async checkJerseyNumberExists(
    teamId: string,
    jerseyNumber: number,
    excludeId?: string
  ): Promise<boolean> {
    if (!ObjectId.isValid(teamId)) return false;

    const filter: any = {
      teamId: new ObjectId(teamId),
      jerseyNumber,
      isActive: true,
    };

    if (excludeId && ObjectId.isValid(excludeId)) {
      filter._id = { $ne: new ObjectId(excludeId) };
    }

    const player = await this.findOne(filter);
    return !!player;
  }

  async getNextJerseyNumber(teamId: string): Promise<number> {
    try {
      if (!ObjectId.isValid(teamId)) return 1;

      const collection = await this.getCollection();
      const players = await collection
        .find(
          { teamId: new ObjectId(teamId), isActive: true },
          { projection: { jerseyNumber: 1 } }
        )
        .sort({ jerseyNumber: 1 })
        .toArray();

      const usedNumbers = new Set(players.map((p) => p.jerseyNumber));

      for (let i = 1; i <= 99; i++) {
        if (!usedNumbers.has(i)) {
          return i;
        }
      }

      return 1; // Fallback
    } catch (error) {
      console.error(
        "❌ Erreur lors de la recherche du prochain numéro:",
        error
      );
      return 1;
    }
  }

  async createPlayer(
    playerData: Omit<PlayerDocument, keyof BaseDocument>
  ): Promise<PlayerDocument | null> {
    try {
      // Vérifier si le numéro de maillot est disponible
      const numberExists = await this.checkJerseyNumberExists(
        playerData.teamId.toString(),
        playerData.jerseyNumber
      );

      if (numberExists) {
        throw new Error(
          `Le numéro ${playerData.jerseyNumber} est déjà utilisé`
        );
      }

      return this.create({
        ...playerData,
        isActive: true,
        isCaptain: false,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la création du joueur:", error);
      return null;
    }
  }

  async setCaptain(playerId: string): Promise<boolean> {
    try {
      if (!ObjectId.isValid(playerId)) return false;

      const player = await this.findById(playerId);
      if (!player) return false;

      // Retirer le statut de capitaine des autres joueurs de l'équipe
      const collection = await this.getCollection();
      await collection.updateMany(
        { teamId: player.teamId, _id: { $ne: new ObjectId(playerId) } },
        { $set: { isCaptain: false, updatedAt: new Date() } }
      );

      // Définir le nouveau capitaine
      const result = await this.updateById(playerId, { isCaptain: true });
      return !!result;
    } catch (error) {
      console.error("❌ Erreur lors de la définition du capitaine:", error);
      return false;
    }
  }

  async removeCaptain(playerId: string): Promise<boolean> {
    try {
      const result = await this.updateById(playerId, { isCaptain: false });
      return !!result;
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du capitaine:", error);
      return false;
    }
  }

  async deactivatePlayer(id: string): Promise<PlayerDocument | null> {
    return this.updateById(id, { isActive: false });
  }

  async activatePlayer(id: string): Promise<PlayerDocument | null> {
    return this.updateById(id, { isActive: true });
  }

  async getPlayersByPosition(
    teamId: string,
    position: PlayerPosition
  ): Promise<PlayerDocument[]> {
    if (!ObjectId.isValid(teamId)) return [];

    return this.findMany(
      { teamId: new ObjectId(teamId), position, isActive: true },
      { sort: { jerseyNumber: 1 } }
    );
  }

  async getTeamStatistics(teamId: string): Promise<{
    total: number;
    active: number;
    byPosition: Record<PlayerPosition, number>;
    averageAge: number;
    captainId?: string;
  }> {
    try {
      if (!ObjectId.isValid(teamId)) {
        return {
          total: 0,
          active: 0,
          byPosition: {
            GOALKEEPER: 0,
            DEFENDER: 0,
            MIDFIELDER: 0,
            FORWARD: 0,
            OTHER: 0,
          },
          averageAge: 0,
        };
      }

      const collection = await this.getCollection();
      const pipeline = [
        { $match: { teamId: new ObjectId(teamId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] },
            },
            positions: { $push: "$position" },
            ages: {
              $push: {
                $cond: [
                  { $ne: ["$dateOfBirth", null] },
                  {
                    $divide: [
                      { $subtract: [new Date(), "$dateOfBirth"] },
                      365.25 * 24 * 60 * 60 * 1000,
                    ],
                  },
                  null,
                ],
              },
            },
            captain: {
              $push: {
                $cond: [
                  { $eq: ["$isCaptain", true] },
                  { $toString: "$_id" },
                  null,
                ],
              },
            },
          },
        },
      ];

      const results = await collection.aggregate(pipeline).toArray();
      const data = results[0];

      if (!data) {
        return {
          total: 0,
          active: 0,
          byPosition: {
            GOALKEEPER: 0,
            DEFENDER: 0,
            MIDFIELDER: 0,
            FORWARD: 0,
            OTHER: 0,
          },
          averageAge: 0,
        };
      }

      const byPosition = data.positions.reduce(
        (acc: any, position: PlayerPosition) => {
          if (position) {
            acc[position] = (acc[position] || 0) + 1;
          }
          return acc;
        },
        { GOALKEEPER: 0, DEFENDER: 0, MIDFIELDER: 0, FORWARD: 0, OTHER: 0 }
      );

      const validAges = data.ages.filter(
        (age: number) => age !== null && age > 0
      );
      const averageAge =
        validAges.length > 0
          ? validAges.reduce((sum: number, age: number) => sum + age, 0) /
            validAges.length
          : 0;

      const captainId = data.captain.find((id: string) => id !== null);

      return {
        total: data.total,
        active: data.active,
        byPosition,
        averageAge: Math.round(averageAge * 10) / 10,
        captainId,
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques de joueurs:",
        error
      );
      return {
        total: 0,
        active: 0,
        byPosition: {
          GOALKEEPER: 0,
          DEFENDER: 0,
          MIDFIELDER: 0,
          FORWARD: 0,
          OTHER: 0,
        },
        averageAge: 0,
      };
    }
  }
}

// Instance singleton
export const playerModel = new PlayerModel();
