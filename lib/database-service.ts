import {
  userModel,
  competitionModel,
  participationModel,
  teamModel,
  playerModel,
  matchModel,
  groupModel,
  notificationModel,
  accountModel,
  sessionModel,
  verificationTokenModel,
  initializeDatabase,
  cleanupExpiredData,
  checkDatabaseHealth,
} from "./models";

export class DatabaseService {
  // User operations
  get users() {
    return userModel;
  }

  // Competition operations
  get competitions() {
    return competitionModel;
  }

  // Participation operations
  get participations() {
    return participationModel;
  }

  // Team operations
  get teams() {
    return teamModel;
  }

  // Player operations
  get players() {
    return playerModel;
  }

  // Match operations
  get matches() {
    return matchModel;
  }

  // Group operations
  get groups() {
    return groupModel;
  }

  // Notification operations
  get notifications() {
    return notificationModel;
  }

  // Auth operations
  get accounts() {
    return accountModel;
  }

  get sessions() {
    return sessionModel;
  }

  get verificationTokens() {
    return verificationTokenModel;
  }

  // Database management
  async initialize(): Promise<void> {
    return initializeDatabase();
  }

  async cleanup(): Promise<void> {
    return cleanupExpiredData();
  }

  async healthCheck() {
    return checkDatabaseHealth();
  }

  // Global statistics
  async getGlobalStats(): Promise<{
    users: { total: number; recent: number };
    competitions: { total: number; active: number };
    teams: { total: number; active: number };
    matches: { total: number; upcoming: number };
  }> {
    try {
      const [
        usersTotal,
        usersRecent,
        competitionsTotal,
        competitionsActive,
        teamsTotal,
        teamsActive,
        matchesTotal,
        matchesUpcoming,
      ] = await Promise.all([
        this.users.count(),
        this.users.count({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
        this.competitions.count(),
        this.competitions.count({ status: { $in: ["OPEN", "ONGOING"] } }),
        this.teams.count(),
        this.teams.count({ isActive: true }),
        this.matches.count(),
        this.matches.count({
          status: "SCHEDULED",
          scheduledDate: { $gte: new Date() },
        }),
      ]);

      return {
        users: { total: usersTotal, recent: usersRecent },
        competitions: { total: competitionsTotal, active: competitionsActive },
        teams: { total: teamsTotal, active: teamsActive },
        matches: { total: matchesTotal, upcoming: matchesUpcoming },
      };
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des statistiques globales:",
        error
      );
      return {
        users: { total: 0, recent: 0 },
        competitions: { total: 0, active: 0 },
        teams: { total: 0, active: 0 },
        matches: { total: 0, upcoming: 0 },
      };
    }
  }

  // Search across multiple collections
  async globalSearch(
    query: string,
    userId?: string
  ): Promise<{
    competitions: any[];
    teams: any[];
    users: any[];
  }> {
    try {
      const searchRegex = new RegExp(query, "i");

      const [competitions, teams, users] = await Promise.all([
        this.competitions.findMany(
          {
            $or: [{ name: searchRegex }, { description: searchRegex }],
            isPublic: true,
          },
          { limit: 10, sort: { createdAt: -1 } }
        ),
        this.teams.findMany(
          {
            name: searchRegex,
            isActive: true,
          },
          { limit: 10, sort: { name: 1 } }
        ),
        userId
          ? this.users.findMany(
              {
                $or: [
                  { firstName: searchRegex },
                  { lastName: searchRegex },
                  { email: searchRegex },
                ],
                _id: { $ne: userId },
              },
              { limit: 10, sort: { firstName: 1, lastName: 1 } }
            )
          : [],
      ]);

      return { competitions, teams, users };
    } catch (error) {
      console.error("❌ Erreur lors de la recherche globale:", error);
      return { competitions: [], teams: [], users: [] };
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();

// Export for convenience
export {
  initializeDatabase,
  cleanupExpiredData,
  checkDatabaseHealth,
  userModel,
  competitionModel,
  participationModel,
  teamModel,
  playerModel,
  matchModel,
  groupModel,
  notificationModel,
  accountModel,
  sessionModel,
  verificationTokenModel,
};
