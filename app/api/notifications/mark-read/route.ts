import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/database-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "ID de notification manquant" },
        { status: 400 }
      );
    }

    const success = await db.notifications.markAsRead(notificationId);

    if (!success) {
      return NextResponse.json(
        { error: "Erreur lors du marquage de la notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors du marquage de la notification:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage de la notification" },
      { status: 500 }
    );
  }
}
