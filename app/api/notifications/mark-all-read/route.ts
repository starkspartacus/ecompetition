import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    console.log("✅ Marquage de toutes les notifications comme lues...");

    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("❌ Session non trouvée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log(`👤 Utilisateur: ${session.user.email} (${session.user.id})`);

    // Validation de l'ObjectId
    if (!ObjectId.isValid(session.user.id)) {
      console.log("❌ ID utilisateur invalide");
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const userObjectId = new ObjectId(session.user.id);

    // Récupérer toutes les notifications non lues de l'utilisateur
    console.log("🔍 Recherche des notifications non lues...");
    const unreadNotifications = await db.notifications.findByUser(
      userObjectId.toString(),
      true
    ); // true = unreadOnly

    console.log(
      `📋 ${unreadNotifications.length} notifications non lues trouvées`
    );

    if (unreadNotifications.length === 0) {
      console.log("ℹ️ Aucune notification à marquer");
      return NextResponse.json({
        success: true,
        message: "Aucune notification à marquer",
        updated: 0,
      });
    }

    // Marquer chaque notification comme lue
    let updatedCount = 0;
    const updatePromises = unreadNotifications
      .filter((notification: any) => notification._id)
      .map(async (notification: any) => {
        try {
          const success = await db.notifications.updateById(
            notification._id.toString(),
            {
              isRead: true,
              readAt: new Date(),
            }
          );
          if (success) {
            updatedCount++;
          }
          return success;
        } catch (error) {
          console.error(
            `❌ Erreur lors de la mise à jour de la notification ${notification._id}:`,
            error
          );
          return false;
        }
      });

    console.log("💾 Mise à jour des notifications...");
    await Promise.all(updatePromises);

    console.log(`✅ ${updatedCount} notifications marquées comme lues`);

    const response = {
      success: true,
      message: `${updatedCount} notifications marquées comme lues`,
      updated: updatedCount,
      total: unreadNotifications.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("💥 Erreur lors du marquage des notifications:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    const errorResponse = {
      error: "Erreur lors du marquage des notifications",
      details:
        process.env.NODE_ENV === "development" ? errorMessage : undefined,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
