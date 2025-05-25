"use server";

import { getDatabase } from "@/lib/mongodb-native";
import { ObjectId } from "mongodb";

export async function getCompetitionById(id: string) {
  try {
    console.log(`🔍 Action - Getting competition: ${id}`);

    if (!ObjectId.isValid(id)) {
      console.log("❌ Action - Invalid ObjectId:", id);
      return null;
    }

    const db = await getDatabase();

    // Try multiple collection names
    const possibleCollections = [
      "competitions",
      "Competition",
      "Competitions",
      "competition",
    ];

    for (const collectionName of possibleCollections) {
      try {
        const collection = db.collection(collectionName);
        const competition = await collection.findOne({ _id: new ObjectId(id) });

        if (competition) {
          console.log(`✅ Action - Competition found in: ${collectionName}`);
          return {
            ...competition,
            _id: competition._id.toString(),
            id: competition._id.toString(),
          };
        }
      } catch (error) {
        console.log(
          `❌ Action - Error in ${collectionName}:`,
          error instanceof Error ? error.message : "Erreur inconnue"
        );
      }
    }

    console.log(`❌ Action - Competition not found: ${id}`);
    return null;
  } catch (error) {
    console.error("❌ Action - Error getting competition:", error);
    return null;
  }
}

export async function getAllCompetitions() {
  try {
    const db = await getDatabase();
    const collection = db.collection("competitions");

    const competitions = await collection.find({}).toArray();

    return competitions.map((comp) => ({
      ...comp,
      _id: comp._id.toString(),
      id: comp._id.toString(),
    }));
  } catch (error) {
    console.error("❌ Action - Error getting all competitions:", error);
    return [];
  }
}

export async function getPublicCompetitions() {
  try {
    const db = await getDatabase();
    const collection = db.collection("competitions");

    const competitions = await collection
      .find({
        status: { $in: ["open", "upcoming"] },
      })
      .toArray();

    return competitions.map((comp) => ({
      ...comp,
      _id: comp._id.toString(),
      id: comp._id.toString(),
    }));
  } catch (error) {
    console.error("❌ Action - Error getting public competitions:", error);
    return [];
  }
}
