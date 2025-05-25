import { getDatabase, debugCollections } from "@/lib/mongodb-native";
import { ObjectId } from "mongodb";

export class CompetitionNativeService {
  private async getCompetitionsCollection() {
    const db = await getDatabase();

    // Essayer de trouver la bonne collection de compétitions
    const collections = await debugCollections();
    const possibleNames = [
      "competitions",
      "Competition",
      "Competitions",
      "competition",
    ];

    for (const name of possibleNames) {
      if (collections.includes(name)) {
        const collection = db.collection(name);
        const count = await collection.countDocuments();
        if (count > 0) {
          console.log(
            `✅ Utilisation de la collection: ${name} (${count} documents)`
          );
          return collection;
        }
      }
    }

    // Par défaut, utiliser "competitions"
    console.log("📂 Utilisation de la collection par défaut: competitions");
    return db.collection("competitions");
  }

  async findById(id: string) {
    try {
      console.log(`🔍 CompetitionService.findById: ${id}`);

      if (!ObjectId.isValid(id)) {
        console.log("❌ ID invalide:", id);
        return null;
      }

      const collection = await this.getCompetitionsCollection();

      // Essayer plusieurs méthodes de recherche
      let competition = await collection.findOne({ _id: new ObjectId(id) });

      if (!competition) {
        competition = await collection.findOne({ id: id });
      }

      if (!competition) {
        console.log(`❌ Compétition non trouvée: ${id}`);
        return null;
      }

      console.log(
        `✅ Compétition trouvée: ${competition.title || competition.name}`
      );

      // Normaliser le document
      return {
        ...competition,
        id: competition._id?.toString(),
      };
    } catch (error) {
      console.error("❌ Erreur CompetitionService.findById:", error);
      return null;
    }
  }

  async findAll(filters = {}) {
    try {
      console.log("🔍 CompetitionService.findAll");
      const collection = await this.getCompetitionsCollection();

      const competitions = await collection.find(filters).toArray();
      console.log(`✅ ${competitions.length} compétitions trouvées`);

      return competitions.map((comp) => ({
        ...comp,
        id: comp._id?.toString(),
      }));
    } catch (error) {
      console.error("❌ Erreur CompetitionService.findAll:", error);
      return [];
    }
  }

  async findPublic() {
    return this.findAll({
      $or: [{ isPublic: true }, { status: { $in: ["OPEN", "ONGOING"] } }],
    });
  }
}

export const competitionNativeService = new CompetitionNativeService();
