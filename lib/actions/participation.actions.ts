"use server";

import { getDatabase } from "@/lib/mongodb-native";
import { ObjectId } from "mongodb";

export async function checkUserParticipation(
  competitionId: string,
  userId: string
) {
  try {
    console.log(
      `👤 Participation - Checking for user: ${userId} in competition: ${competitionId}`
    );

    if (!ObjectId.isValid(competitionId)) {
      console.log(
        "❌ Participation - Invalid competition ObjectId:",
        competitionId
      );
      return false;
    }

    const db = await getDatabase();
    const participationsCollection = db.collection("participations");

    const participation = await participationsCollection.findOne({
      competitionId: new ObjectId(competitionId),
      userId: userId,
    });

    const isParticipating = !!participation;
    console.log(`✅ Participation - User participating: ${isParticipating}`);

    return isParticipating;
  } catch (error) {
    console.error("❌ Participation - Error checking participation:", error);
    return false;
  }
}

export async function getUserParticipations(userId: string) {
  try {
    const db = await getDatabase();
    const participationsCollection = db.collection("participations");

    const participations = await participationsCollection
      .find({ userId })
      .toArray();

    return participations.map((p) => ({
      ...p,
      _id: p._id.toString(),
      competitionId: p.competitionId.toString(),
    }));
  } catch (error) {
    console.error(
      "❌ Participation - Error getting user participations:",
      error
    );
    return [];
  }
}

export async function createParticipation(
  competitionId: string,
  userId: string,
  teamData?: any
) {
  try {
    console.log(
      `➕ Participation - Creating for user: ${userId} in competition: ${competitionId}`
    );

    if (!ObjectId.isValid(competitionId)) {
      throw new Error("Invalid competition ID");
    }

    const db = await getDatabase();
    const participationsCollection = db.collection("participations");

    // Check if already participating
    const existing = await participationsCollection.findOne({
      competitionId: new ObjectId(competitionId),
      userId: userId,
    });

    if (existing) {
      throw new Error("User already participating in this competition");
    }

    const participation = {
      competitionId: new ObjectId(competitionId),
      userId: userId,
      status: "pending",
      teamData: teamData || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await participationsCollection.insertOne(participation);

    console.log(`✅ Participation - Created with ID: ${result.insertedId}`);

    return {
      ...participation,
      _id: result.insertedId.toString(),
      competitionId: competitionId,
    };
  } catch (error) {
    console.error("❌ Participation - Error creating participation:", error);
    throw error;
  }
}
