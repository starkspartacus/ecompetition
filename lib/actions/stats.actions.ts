"use server";

import { getDatabase } from "@/lib/mongodb-native";
import { ObjectId } from "mongodb";

export async function getCompetitionStats(competitionId: string) {
  try {
    console.log(`📊 Stats - Getting stats for: ${competitionId}`);

    if (!ObjectId.isValid(competitionId)) {
      console.log("❌ Stats - Invalid ObjectId:", competitionId);
      return { participantCount: 0, pendingCount: 0 };
    }

    const db = await getDatabase();

    // Try to get participation stats
    const participationsCollection = db.collection("participations");

    const [participantCount, pendingCount] = await Promise.all([
      participationsCollection.countDocuments({
        competitionId: new ObjectId(competitionId),
        status: "approved",
      }),
      participationsCollection.countDocuments({
        competitionId: new ObjectId(competitionId),
        status: "pending",
      }),
    ]);

    const stats = { participantCount, pendingCount };
    console.log(`✅ Stats - Found stats:`, stats);

    return stats;
  } catch (error) {
    console.error("❌ Stats - Error getting stats:", error);
    return { participantCount: 0, pendingCount: 0 };
  }
}

export async function getGlobalStats() {
  try {
    const db = await getDatabase();

    const [totalCompetitions, totalParticipations, activeCompetitions] =
      await Promise.all([
        db.collection("competitions").countDocuments(),
        db.collection("participations").countDocuments(),
        db.collection("competitions").countDocuments({ status: "open" }),
      ]);

    return {
      totalCompetitions,
      totalParticipations,
      activeCompetitions,
    };
  } catch (error) {
    console.error("❌ Stats - Error getting global stats:", error);
    return {
      totalCompetitions: 0,
      totalParticipations: 0,
      activeCompetitions: 0,
    };
  }
}
