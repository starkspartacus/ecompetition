import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getUserNotifications,
  countUnreadNotifications,
} from "@/lib/notification-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "20");
    const skip = Number.parseInt(searchParams.get("skip") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Récupérer les notifications
    const notificationsResult = await getUserNotifications(session.user.id, {
      limit,
      skip,
      unreadOnly,
    });

    if (!notificationsResult.success) {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des notifications" },
        { status: 500 }
      );
    }

    // Compter les notifications non lues
    const unreadCountResult = await countUnreadNotifications(session.user.id);

    return NextResponse.json({
      notifications: notificationsResult.notifications,
      unreadCount: unreadCountResult.success ? unreadCountResult.count : 0,
      hasMore: notificationsResult.notifications?.length === limit,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}
