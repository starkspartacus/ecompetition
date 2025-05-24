import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!notificationId && !userId) {
      return NextResponse.json(
        { message: "ID de notification ou ID d'utilisateur requis" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const notificationsCollection = db.collection("Notification");

    if (notificationId) {
      // Marquer une notification spécifique comme lue
      const notification = await notificationsCollection.findOne({
        _id: new ObjectId(notificationId),
      });

      if (!notification) {
        return NextResponse.json(
          { message: "Notification non trouvée" },
          { status: 404 }
        );
      }

      // Vérifier que l'utilisateur est autorisé à marquer cette notification comme lue
      if (notification.userId.toString() !== session.user.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
      }

      await notificationsCollection.updateOne(
        { _id: new ObjectId(notificationId) },
        { $set: { read: true, updatedAt: new Date() } }
      );

      return NextResponse.json({ message: "Notification marquée comme lue" });
    } else {
      // Marquer toutes les notifications d'un utilisateur comme lues
      const targetUserId = userId || session.user.id;

      // Vérifier que l'utilisateur est autorisé à marquer ces notifications comme lues
      if (targetUserId !== session.user.id) {
        return NextResponse.json({ message: "Non autorisé" }, { status: 403 });
      }

      await notificationsCollection.updateMany(
        { userId: new ObjectId(targetUserId), read: false },
        { $set: { read: true, updatedAt: new Date() } }
      );

      return NextResponse.json({
        message: "Toutes les notifications marquées comme lues",
      });
    }
  } catch (error) {
    console.error(
      "Erreur lors du marquage des notifications comme lues:",
      error
    );
    return NextResponse.json(
      {
        message:
          "Une erreur est survenue lors du marquage des notifications comme lues",
      },
      { status: 500 }
    );
  }
}
